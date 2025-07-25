import registry from './registry.js';

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