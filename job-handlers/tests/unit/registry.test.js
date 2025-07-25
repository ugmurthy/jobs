/**
 * Unit tests for the handler registry
 */

// Note: This is a basic test structure. In a real implementation, you would use a testing framework like Jest.

import assert from 'assert';
import registry from '../../src/registry.js';

// Reset the registry before tests
registry.handlers.clear();
registry.directories = [];

console.log('Running registry tests...');

// Test 1: Register a valid handler
const testRegisterValidHandler = () => {
  const mockHandler = {
    name: 'testHandler',
    execute: async (job) => ({ status: 'done' }),
    description: 'Test handler',
    version: '1.0.0',
    author: 'Test Author'
  };
  
  const result = registry.registerHandler(mockHandler);
  assert.strictEqual(result, true, 'Should return true for valid handler');
  assert.strictEqual(registry.handlers.size, 1, 'Should have 1 handler registered');
  assert.strictEqual(registry.handlers.get('testHandler'), mockHandler, 'Should store the handler');
  
  console.log('✅ Test passed: Register valid handler');
};

// Test 2: Reject an invalid handler
const testRejectInvalidHandler = () => {
  // Create an invalid handler (missing execute function)
  const invalidHandler = {
    name: 'invalidHandler',
    description: 'Invalid handler'
  };
  
  const result = registry.registerHandler(invalidHandler);
  assert.strictEqual(result, false, 'Should return false for invalid handler');
  assert.strictEqual(registry.handlers.has('invalidHandler'), false, 'Should not register invalid handler');
  
  console.log('✅ Test passed: Reject invalid handler');
};

// Test 3: Get a handler
const testGetHandler = () => {
  const mockHandler = {
    name: 'getHandler',
    execute: async (job) => ({ status: 'done' }),
    description: 'Get handler test'
  };
  
  registry.registerHandler(mockHandler);
  const handler = registry.getHandler('getHandler');
  assert.strictEqual(handler, mockHandler, 'Should return the registered handler');
  
  const nonExistentHandler = registry.getHandler('nonExistent');
  assert.strictEqual(nonExistentHandler, undefined, 'Should return undefined for non-existent handler');
  
  console.log('✅ Test passed: Get handler');
};

// Test 4: Remove a handler
const testRemoveHandler = () => {
  const mockHandler = {
    name: 'removeHandler',
    execute: async (job) => ({ status: 'done' }),
    description: 'Remove handler test'
  };
  
  registry.registerHandler(mockHandler);
  assert.strictEqual(registry.hasHandler('removeHandler'), true, 'Handler should exist');
  
  const result = registry.removeHandler('removeHandler');
  assert.strictEqual(result, true, 'Should return true when handler is removed');
  assert.strictEqual(registry.hasHandler('removeHandler'), false, 'Handler should be removed');
  
  const resultNonExistent = registry.removeHandler('nonExistent');
  assert.strictEqual(resultNonExistent, false, 'Should return false when handler does not exist');
  
  console.log('✅ Test passed: Remove handler');
};

// Run the tests
try {
  testRegisterValidHandler();
  testRejectInvalidHandler();
  testGetHandler();
  testRemoveHandler();
  
  console.log('All registry tests passed! ✅');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}