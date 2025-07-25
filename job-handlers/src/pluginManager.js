import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '@ugm/logger';
import registry from './registry.js';

class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.nodeModulesPath = '';
  }

  // Initialize the plugin manager
  async initialize() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    this.nodeModulesPath = path.resolve(__dirname, '..', 'node_modules');
    
    await this.discoverPlugins();
  }

  // Discover plugins in node_modules
  async discoverPlugins() {
    try {
      logger.info(`Searching for plugins in ${this.nodeModulesPath}`);
      const packages = await fs.readdir(this.nodeModulesPath);
      //logger.info(`Found ${packages.length} entries in node_modules`);
      
      // Log all packages found for debugging
      //logger.info(`Node modules entries: ${packages.join(', ')}`);
      
      // Check for @ugm directory specifically
      if (packages.includes('@ugm')) {
        logger.info('Found @ugm directory, checking for plugins inside');
        const ugmPath = path.join(this.nodeModulesPath, '@ugm');
        const ugmPackages = await fs.readdir(ugmPath);
        //logger.info(`Found packages in @ugm: ${ugmPackages.join(', ')}`);
        
        // Check each package in @ugm directory
        for (const pkg of ugmPackages) {
          const fullPkgName = `@ugm/${pkg}`;
          logger.info(`Checking package: ${fullPkgName}`);
          await this.checkAndLoadPlugin(fullPkgName);
        }
      }
      
      // Continue with regular package checking
      for (const pkg of packages) {
        // Skip @ugm directory as we've already processed it
        if (pkg === '@ugm') continue;
        
        await this.checkAndLoadPlugin(pkg);
      }
      
      logger.info(`Discovered ${this.plugins.size} handler plugins`);
    } catch (error) {
      logger.error(`Error discovering plugins: ${error.message}`);
    }
  }

  // Check if a package is a handler plugin and load it
  async checkAndLoadPlugin(packageName) {
    const packagePath = path.join(this.nodeModulesPath, packageName);
    const packageJsonPath = path.join(packagePath, 'package.json');
    
    try {
      // First check if the package path is a directory
      const stats = await fs.stat(packagePath);
      if (!stats.isDirectory()) {
        // Skip if not a directory
        //logger.debug(`Skipping ${packageName}: Not a directory`);
        return;
      }
      
      //logger.info(`Checking if ${packageName} is a plugin (${packageJsonPath})`);
      
      // Check if package.json exists
      await fs.access(packageJsonPath);
      
      // Read and parse package.json
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);
      
      // Log package.json contents for debugging
      //logger.info(`Package ${packageName} keywords: ${packageJson.keywords?.join(', ') || 'none'}`);
      //logger.info(`Package ${packageName} has bullmqHandlerPlugin: ${!!packageJson.bullmqHandlerPlugin}`);
      
      // Check if it's a handler plugin
      if (packageJson.keywords?.includes('bullmq-handler-plugin') && packageJson.bullmqHandlerPlugin) {
        //logger.info(`Found handler plugin: ${packageName}`);
        await this.loadPlugin(packageName, packagePath, packageJson);
      } else {
        //logger.info(`${packageName} is not a handler plugin`);
      }
    } catch (error) {
      // Skip if package.json doesn't exist or can't be parsed
      if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') {
        logger.error(`Error checking plugin ${packageName}: ${error.message}`);
      } else {
        logger.debug(`Skipping ${packageName}: ${error.code}`);
      }
    }
  }

  // Load a plugin and its handlers
  async loadPlugin(packageName, packagePath, packageJson) {
    try {
      logger.info(`Loading handler plugin: ${packageName}`);
      
      // Import the plugin's main file
      let plugin;
      try {
        // Try different ways to import the plugin
        logger.debug(`Attempting to import plugin ${packageName} using direct import`);
        try {
          plugin = await import(packageName);
        } catch (directImportError) {
          logger.debug(`Direct import failed: ${directImportError.message}`);
          
          // Try with file:// protocol for local path
          logger.debug(`Attempting to import plugin using file:// protocol`);
          const mainFilePath = path.join(packagePath, packageJson.main || 'index.js');
          logger.debug(`Importing from path: ${mainFilePath}`);
          
          try {
            plugin = await import(`file://${mainFilePath}`);
          } catch (fileImportError) {
            logger.debug(`File import failed: ${fileImportError.message}`);
            throw fileImportError;
          }
        }
      } catch (importError) {
        logger.error(`All import attempts failed for plugin ${packageName}: ${importError.message}`);
        logger.info(`Attempting to load plugin handlers directly from package.json configuration`);
        plugin = {}; // Create empty plugin object to fall back to package.json configuration
      }
      
      // Register the plugin
      this.plugins.set(packageName, {
        name: packageName,
        version: packageJson.version,
        handlers: []
      });
      
      // Load handlers from the plugin
      if (plugin.registerHandlers) {
        // If the plugin has a registerHandlers function, call it with the registry
        try {
          await plugin.registerHandlers(registry);
          logger.info(`Successfully registered handlers from plugin ${packageName} using registerHandlers function`);
        } catch (registerError) {
          logger.error(`Error registering handlers from plugin ${packageName}: ${registerError.message}`);
          logger.info(`Falling back to package.json configuration for plugin ${packageName}`);
          // Fall back to package.json configuration
          if (packageJson.bullmqHandlerPlugin.handlers) {
            await this.loadHandlersFromPackageJson(packageName, packagePath, packageJson);
          }
        }
      } else if (packageJson.bullmqHandlerPlugin.handlers) {
        await this.loadHandlersFromPackageJson(packageName, packagePath, packageJson);
      }
    } catch (error) {
      logger.error(`Error loading plugin ${packageName}: ${error.message}`);
    }
  }

  // Load handlers based on package.json configuration
  async loadHandlersFromPackageJson(packageName, packagePath, packageJson) {
    logger.info(`Loading handlers from package.json configuration for plugin ${packageName}`);
    const handlersDir = path.join(packagePath, 'handlers');
    
    for (const handlerName of packageJson.bullmqHandlerPlugin.handlers) {
      try {
        const handlerPath = path.join(handlersDir, `${handlerName}.js`);
        const handlerModule = await import(`file://${handlerPath}`);
        const handler = handlerModule.default;
        
        if (handler) {
          registry.registerHandler(handler);
          this.plugins.get(packageName).handlers.push(handlerName);
          logger.info(`Registered handler ${handlerName} from plugin ${packageName}`);
        }
      } catch (error) {
        logger.error(`Error loading handler ${handlerName} from plugin ${packageName}: ${error.message}`);
      }
    }
  }

  // Get all loaded plugins
  getPlugins() {
    return Array.from(this.plugins.values());
  }
}

export default new PluginManager();