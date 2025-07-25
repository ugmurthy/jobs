// Note: This implementation requires the chokidar package
// Please run: npm install chokidar

import path from 'path';
import { logger } from '@ugm/logger';
import registry from './registry.js';
import chokidar from 'chokidar';
class HandlerWatcher {
  constructor() {
    this.watchers = new Map();
    this.debounceTimers = new Map();
  }

  // Watch a directory for changes
  watchDirectory(directory) {
    if (this.watchers.has(directory)) {
      return;
    }

    logger.info(`Setting up watcher for directory: ${directory}`);
    
    try {
      // This requires the chokidar package
      //const chokidar = require('chokidar');
      

      const watcher = chokidar.watch(directory, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: true,
      });

      watcher
        .on('add', (filePath) => this.handleFileChange('add', filePath))
        .on('change', (filePath) => this.handleFileChange('change', filePath))
        .on('unlink', (filePath) => this.handleFileChange('unlink', filePath));

      this.watchers.set(directory, watcher);
    } catch (error) {
      logger.error(`Error setting up watcher for ${directory}: ${error.message}`);
      logger.error('Make sure to install chokidar: npm install chokidar');
    }
  }

  // Handle file changes with debouncing
  handleFileChange(event, filePath) {
    if (!filePath.endsWith('.js')) {
      return;
    }

    const handlerName = path.basename(filePath, '.js');
    
    // Debounce to prevent multiple reloads for the same file
    if (this.debounceTimers.has(filePath)) {
      clearTimeout(this.debounceTimers.get(filePath));
    }

    this.debounceTimers.set(
      filePath,
      setTimeout(() => {
        this.reloadHandler(event, filePath, handlerName);
        this.debounceTimers.delete(filePath);
      }, 300)
    );
  }

  // Reload a handler
  async reloadHandler(event, filePath, handlerName) {
    logger.info(`Handler file ${event}: ${filePath}`);

    if (event === 'unlink') {
      // Remove handler if file is deleted
      if (registry.hasHandler(handlerName)) {
        registry.removeHandler(handlerName);
        logger.info(`Handler removed: ${handlerName}`);
      }
      return;
    }

    try {
      // Clear module from cache to force reload
      const resolvedPath = path.resolve(filePath);
      
      // In ES Modules, we can't directly clear the cache like in CommonJS
      // Instead, we use a cache-busting query parameter with the current timestamp
      const handlerModule = await import(`file://${resolvedPath}?update=${Date.now()}`);
      const handler = handlerModule.default;
      
      if (handler) {
        // Update or add the handler
        registry.registerHandler(handler);
        logger.info(`Handler ${event === 'add' ? 'added' : 'updated'}: ${handlerName}`);
      }
    } catch (error) {
      logger.error(`Error reloading handler ${handlerName}: ${error.message}`);
    }
  }

  // Stop watching all directories
  stopAll() {
    for (const [directory, watcher] of this.watchers.entries()) {
      watcher.close();
      logger.info(`Stopped watching directory: ${directory}`);
    }
    this.watchers.clear();
  }
}

export default new HandlerWatcher();