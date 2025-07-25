/**
 * Test utilities for the BullMQ handler system
 */

import { v4 as uuidv4 } from 'uuid'; // Note: This requires installing the uuid package
import { Queue } from 'bullmq';

/**
 * Create a unique queue name for tests to avoid conflicts
 * @param {string} name - Base name for the queue
 * @returns {string} - Unique queue name
 */
export const createUniqueQueueName = (name = 'test') => {
  return `${name}-${uuidv4()}`;
};

/**
 * Create a test queue with a unique name
 * @param {string} name - Base name for the queue
 * @param {Object} options - Queue options
 * @returns {Queue} - BullMQ Queue instance
 */
export const createTestQueue = (name = 'test', options = {}) => {
  const uniqueName = createUniqueQueueName(name);
  return new Queue(uniqueName, { 
    connection: { host: 'localhost', port: 6379 },
    ...options
  });
};

/**
 * Create a test handler
 * @param {string} name - Handler name
 * @param {Function} executeFn - Execute function
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Handler object
 */
export const createTestHandler = (name, executeFn, metadata = {}) => {
  return {
    name,
    description: metadata.description || `Test handler: ${name}`,
    version: metadata.version || '1.0.0',
    author: metadata.author || 'Test',
    execute: executeFn || (async (job) => ({ status: 'done', jobId: job.id })),
    ...metadata
  };
};

/**
 * Create a mock job for testing
 * @param {string} name - Job name
 * @param {Object} data - Job data
 * @returns {Object} - Mock job object
 */
export const createMockJob = (name, data = {}) => {
  const jobId = `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  return {
    id: jobId,
    name,
    data,
    updateProgress: (progress) => console.log(`Job ${jobId} (${name}) progress: ${progress}%`)
  };
};

/**
 * Wait for a job to complete
 * @param {Queue} queue - BullMQ Queue instance
 * @param {string} jobId - Job ID
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Object>} - Completed job
 */
export const waitForJobCompletion = async (queue, jobId, timeout = 5000) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    
    const state = await job.getState();
    if (state === 'completed') {
      return job;
    } else if (state === 'failed') {
      throw new Error(`Job ${jobId} failed: ${job.failedReason}`);
    }
    
    // Wait a bit before checking again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error(`Timeout waiting for job ${jobId} to complete`);
};

/**
 * Clean up test resources
 * @param {Array<Queue>} queues - Array of BullMQ Queue instances to close
 * @returns {Promise<void>}
 */
export const cleanupTestResources = async (queues = []) => {
  for (const queue of queues) {
    await queue.obliterate();
    await queue.close();
  }
};