import registry from './registry.js';

/**
 * Plugin API for BullMQ handler plugins
 * This API is used by plugins to register handlers with the registry
 */

/**
 * Register a handler with the registry
 * @param {Object} handler - The handler object to register
 * @returns {boolean} - True if registration was successful, false otherwise
 */
export const registerHandler = (handler) => {
  return registry.registerHandler(handler);
};

/**
 * Create a handler with the specified name and execute function
 * @param {string} name - The name of the handler
 * @param {Function} executeFn - The function to execute when the handler is called
 * @param {Object} metadata - Additional metadata for the handler
 * @returns {Object} - The handler object
 */
export const createHandler = (name, executeFn, metadata = {}) => {
  return {
    name,
    execute: executeFn,
    description: metadata.description || '',
    version: metadata.version || '1.0.0',
    author: metadata.author || 'Unknown',
    ...metadata
  };
};

/**
 * Register multiple handlers at once
 * @param {Array} handlers - An array of handler objects
 * @returns {number} - The number of successfully registered handlers
 */
export const registerHandlers = (handlers) => {
  if (!Array.isArray(handlers)) {
    return 0;
  }
  
  let count = 0;
  for (const handler of handlers) {
    if (registry.registerHandler(handler)) {
      count++;
    }
  }
  
  return count;
};

/**
 * Example plugin registration function
 * This is the function that should be exported by plugins
 * @param {Object} registry - The handler registry
 */
export const registerHandlersExample = async (registry) => {
  // Import and register handlers
  const handler1 = await import('./handlers/customHandler1.js');
  const handler2 = await import('./handlers/customHandler2.js');
  
  registry.registerHandler(handler1.default);
  registry.registerHandler(handler2.default);
};