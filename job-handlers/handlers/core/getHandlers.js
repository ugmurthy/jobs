import { logger } from '@ugm/logger';
import registry from '../../src/registry.js';
import { Queue } from 'bullmq';

// Constants for webhook queue
const MAX_ATTEMPTS = 3;
const BACK_OFF_DELAY = 5000;
const redisOptions = { host: "localhost", port: 6379 };

// Queue for returning results to the user
const webHookQueue = new Queue("webhooks", { connection: redisOptions });

export default {
  name: 'getHandlers',
  description: 'Returns information about all registered handlers',
  version: '1.0.0',
  author: 'System',
  
  async execute(job) {
    // Extract userId from job data for security validation
    const { userId } = job.data;
    
    // Log job execution with userId for audit purposes
    logger.debug(`getHandlers.js : Job : ${job.id} : ${job.name} for user: ${userId || 'unknown'}`);
    
    // Security check: Ensure the job has a userId
    if (!userId) {
      logger.warn(`Security warning: getHandlers job ${job.id} executed without userId`);
      return {
        status: 'error',
        message: 'User authentication required'
      };
    }
    
    // Get all handlers from the registry
    const handlersMap = registry.handlers;
    
    // Convert the Map to an array of handler information objects
    // Exclude the execute function to avoid circular references
    const handlersInfo = Array.from(handlersMap.entries()).map(([name, handler]) => {
      return {
        name: handler.name,
        description: handler.description || 'No description provided',
        version: handler.version || 'unknown',
        author: handler.author || 'unknown',
        // Include any other meta information available in the handler
        // but exclude the execute function
      };
    });
    
    // Update progress to 100% as the task is complete
    job.updateProgress(100);
    
    
    // Use the webHookQueue pattern to ensure results go back to the correct user
    return  {
      id: job.id,
      jobname: job.name,
      input:job.data,
      result: handlersInfo,
      success:true
    }
  }
};