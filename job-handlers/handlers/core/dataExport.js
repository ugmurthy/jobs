import { logger } from '@ugm/logger';

// Helper function for delay
const delay = (duration, ...args) => new Promise(resolve => {
  // Convert duration from seconds to milliseconds and set the timeout
  setTimeout(resolve, duration * 1000, ...args);
});

export default {
  name: 'dataExport',
  description: 'Exports data to a file',
  version: '1.0.0',
  author: 'System',
  
  async execute(job) {
    logger.debug(`Job : ${job.id} : ${job.name} for ${job.data}`);
    
    
    // Simulate data export
    await delay(5);
    job.updateProgress(50);
    
    // Simulate some delay
    await delay(2);
    job.updateProgress(70);
    
     // Simulate some delay
    await delay(3);
    job.updateProgress(100);
    const tstamp = new Date().toLocaleTimeString();
    return {status: 'done',completedAt: tstamp,id:job.id,name:job.name,data:job.data};
  }
};