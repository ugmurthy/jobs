import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '@ugm/logger';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultConfigPath = path.join(__dirname, '..', 'config.json');

class Config {
  constructor() {
    this.config = {
      handlerDirectories: [
        path.join(__dirname, '..', 'handlers', 'core'),
        path.join(__dirname, '..', 'handlers', 'custom')
      ],
      queueNames: ['jobQueue'],  // Default queue name
      queueConfigs: {            // Queue-specific configurations
        'jobQueue': {
          concurrency: 10,
          handlers: '*'  // '*' means use all available handlers
        }
      },
      disabledHandlers: [],
      handlerOptions: {}
    };
  }

  async load(configPath = defaultConfigPath) {
    try {
      const configData = await fs.readFile(configPath, 'utf8');
      const userConfig = JSON.parse(configData);
      this.config = { ...this.config, ...userConfig };
      logger.info(`Loaded configuration from ${configPath}`);
    } catch (error) {
      // If config file doesn't exist, use defaults
      if (error.code !== 'ENOENT') {
        logger.error(`Error loading configuration: ${error.message}`);
        throw error;
      }
      logger.info('Using default configuration');
    }
    return this.config;
  }

  isHandlerEnabled(handlerName, queueName = null) {
    // Check global disabled handlers
    if (this.config.disabledHandlers.includes(handlerName)) {
      return false;
    }
    
    // If queue name is provided, check queue-specific configuration
    if (queueName && this.config.queueConfigs[queueName]) {
      const queueConfig = this.config.queueConfigs[queueName];
      
      // If handlers is an array, check if the handler is included
      if (Array.isArray(queueConfig.handlers)) {
        return queueConfig.handlers.includes(handlerName);
      }
      
      // If handlers is '*', all handlers are enabled for this queue
      return queueConfig.handlers === '*';
    }
    
    return true;
  }

  getHandlerOptions(handlerName) {
    return this.config.handlerOptions[handlerName] || {};
  }

  getHandlerDirectories() {
    return this.config.handlerDirectories;
  }
  
  getQueueNames() {
    return this.config.queueNames || ['jobQueue'];
  }
  
  getQueueConfig(queueName) {
    return this.config.queueConfigs[queueName] || { concurrency: 10, handlers: '*' };
  }
}

export default new Config();