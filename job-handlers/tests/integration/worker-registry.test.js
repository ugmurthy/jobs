/**
 * Integration tests for the worker and registry
 */

// Note: This is a basic test structure. In a real implementation, you would use a testing framework like Jest.

import assert from 'assert';
import registry from '../../src/registry.js';
import { processJob } from '../../src/worker.js';

// Mock job for testing
const createMockJob = (name, data = {}) => ({
  id: `job-${Date.now()}`,
  name,
  data,
  updateProgress: (progress) => console.log(`Job ${name} progress: ${progress}%`)
});

// Reset the registry before tests
registry.handlers.clear();
registry.directories = [];

console.log('Running worker-registry integration tests...');

// Test 1: Process a job with a registered handler
const testProcessJobWithRegisteredHandler = async () => {
  // Register a mock handler
  const mockHandler = {
    name: 'testHandler',
    execute: async (job) => ({ status: 'done', jobId: job.id }),
    description: 'Test handler'
  };
  
  registry.registerHandler(mockHandler);
  
  // Create a mock job
  const mockJob = createMockJob('testHandler', { test: 'data' });
  
  // Process the job
  const result = await processJob(mockJob);
  
  // Verify the result
  assert.strictEqual(result.status, 'done', 'Should return status done');
  assert.strictEqual(result.jobId, mockJob.id, 'Should return the job ID');
  
  console.log('✅ Test passed: Process job with registered handler');
};

// Test 2: Process a job with an unregistered handler
const testProcessJobWithUnregisteredHandler = async () => {
  // Create a mock job with a handler that doesn't exist
  const mockJob = createMockJob('nonExistentHandler', { test: 'data' });
  
  // Process the job and expect an error
  try {
    await processJob(mockJob);
    assert.fail('Should have thrown an error');
  } catch (error) {
    assert(error instanceof Error, 'Should throw an Error');
    assert(error.message.includes('Handler not available'), 'Error message should mention handler not available');
    console.log('✅ Test passed: Process job with unregistered handler');
  }
};

// Test 3: Handler with progress updates
const testHandlerWithProgressUpdates = async () => {
  // Register a mock handler with progress updates
  const mockHandler = {
    name: 'progressHandler',
    execute: async (job) => {
      job.updateProgress(25);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      job.updateProgress(50);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      job.updateProgress(75);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      job.updateProgress(100);
      return { status: 'done', progress: 'complete' };
    },
    description: 'Progress test handler'
  };
  
  registry.registerHandler(mockHandler);
  
  // Create a mock job
  const mockJob = createMockJob('progressHandler', { test: 'progress' });
  
  // Process the job
  const result = await processJob(mockJob);
  
  // Verify the result
  assert.strictEqual(result.status, 'done', 'Should return status done');
  assert.strictEqual(result.progress, 'complete', 'Should return progress complete');
  
  console.log('✅ Test passed: Handler with progress updates');
};

// Run the tests
(async () => {
  try {
    await testProcessJobWithRegisteredHandler();
    await testProcessJobWithUnregisteredHandler();
    await testHandlerWithProgressUpdates();
    
    console.log('All worker-registry integration tests passed! ✅');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
})();