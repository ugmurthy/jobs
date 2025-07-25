import { logger } from '@ugm/logger';

export default {
  name: 'welcomeMessage',
  description: 'Sends a welcome message to the user',
  version: '1.0.0',
  author: 'System',
  
  async execute(job) {
    logger.debug(`welcomeMessage.js : Job : ${job.id} : ${job.name} for ${JSON.stringify(job.data)}`);
    job.updateProgress(100)
    return { status: 'done', jobid: job.id, name:job.name, data:job.data };
  }
};