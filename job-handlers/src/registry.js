import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '@ugm/logger';

class HandlerRegistry {
  constructor() {
    this.handlers = new Map();
    this.directories = [];
  }

  // Add a directory to scan for handlers
  addDirectory(directory) {
    this.directories.push(directory);
    return this;
  }

  // Register a handler
  registerHandler(handler) {
    if (!this.validateHandler(handler)) {
      logger.warn(`Invalid handler: ${handler.name || 'unknown'}`);
      return false;
    }
    
    this.handlers.set(handler.name, handler);
    logger.info(`Registered handler: ${handler.name}`);
    return true;
  }

  // Get a handler by name
  getHandler(name) {
    return this.handlers.get(name);
  }

  // Check if a handler exists
  hasHandler(name) {
    return this.handlers.has(name);
  }

  // Remove a handler
  removeHandler(name) {
    if (this.handlers.has(name)) {
      this.handlers.delete(name);
      logger.info(`Removed handler: ${name}`);
      return true;
    }
    return false;
  }

  // Validate handler interface
  validateHandler(handler) {
    return (
      handler &&
      typeof handler.name === 'string' &&
      typeof handler.execute === 'function'
    );
  }

  // Discover and load all handlers
  async discoverHandlers() {
    for (const directory of this.directories) {
      await this.loadHandlersFromDirectory(directory);
    }
    
    logger.info(`Loaded ${this.handlers.size} handlers`);
    return this.handlers;
  }

  // Load handlers from a directory
  async loadHandlersFromDirectory(directory) {
    try {
      const files = await fs.readdir(directory);
      
      for (const file of files) {
        if (file.endsWith('.js')) {
          const handlerPath = path.join(directory, file);
          try {
            const handlerModule = await import(`file://${path.resolve(handlerPath)}`);
            const handler = handlerModule.default;
            
            if (handler) {
              this.registerHandler(handler);
            }
          } catch (error) {
            logger.error(`Error loading handler from ${handlerPath}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      logger.error(`Error reading directory ${directory}: ${error.message}`);
    }
  }
}

export default new HandlerRegistry();