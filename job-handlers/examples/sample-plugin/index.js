/**
 * Sample BullMQ Handler Plugin
 * This plugin demonstrates how to create a plugin for the BullMQ handler system
 */

import { registerHandler } from '../../src/pluginAPI.js';

/**
 * Register handlers with the registry
 * This function is called by the plugin manager when the plugin is loaded
 * @param {Object} registry - The handler registry
 */
export const registerHandlers = async (registry) => {
  // Import handlers
  const sampleHandler1 = await import('./handlers/sampleHandler1.js');
  const sampleHandler2 = await import('./handlers/sampleHandler2.js');
  
  // Register handlers
  registry.registerHandler(sampleHandler1.default);
  registry.registerHandler(sampleHandler2.default);
  
  console.log('Sample plugin handlers registered successfully');
};

// Export any other functions or objects that might be useful
export const pluginInfo = {
  name: 'bullmq-sample-plugin',
  version: '1.0.0',
  description: 'Sample plugin for BullMQ handler system'
};