import { logger } from '@ugm/logger';

/**
 * Sample Handler 2
 * This handler demonstrates a more complex job handler with progress updates
 */
export default {
  name: 'sampleHandler2',
  description: 'A sample handler that processes jobs with progress updates',
  version: '1.0.0',
  author: 'Sample Author',
  
  async execute(job) {
    logger.debug(`Sample Handler 2 processing job: ${job.id} : ${job.name}`);
    
    // Extract data from the job
    const { data } = job;
    
    // Simulate a multi-step process with progress updates
    // Step 1: Initialize
    job.updateProgress(10);
    await this.delay(1);
    
    // Step 2: Process data
    job.updateProgress(30);
    await this.delay(1);
    
    // Step 3: Perform calculations
    job.updateProgress(60);
    await this.delay(1);
    
    // Step 4: Finalize
    job.updateProgress(90);
    await this.delay(1);
    
    // Complete
    job.updateProgress(100);
    
    // Return the result
    return {
      status: 'done',
      result: {
        jobId: job.id,
        processedAt: new Date().toISOString(),
        data: data,
        message: 'Sample Handler 2 processed the job successfully with progress updates'
      }
    };
  },
  
  // Helper method for delay
  delay(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }
};