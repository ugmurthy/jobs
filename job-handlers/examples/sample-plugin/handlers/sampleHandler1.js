import { logger } from '@ugm/logger';

/**
 * Sample Handler 1
 * This handler demonstrates a simple job handler implementation
 */
export default {
  name: 'sampleHandler1',
  description: 'A sample handler that processes simple jobs',
  version: '1.0.0',
  author: 'Sample Author',
  
  async execute(job) {
    logger.debug(`Sample Handler 1 processing job: ${job.id} : ${job.name}`);
    
    // Extract data from the job
    const { data } = job;
    
    // Process the data (this is just a sample)
    const result = {
      jobId: job.id,
      processedAt: new Date().toISOString(),
      data: data,
      message: 'Sample Handler 1 processed the job successfully'
    };
    
    // Return the result
    return { status: 'done', result };
  }
};