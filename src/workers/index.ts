import { logger } from '@ugm/logger';
import { initializeWebhookWorker } from './webhookWorker.js';
import { initializeSchedulerWorker } from './schedulerWorker.js';
import { Worker } from 'bullmq';

/**
 * Initialize all workers
 */
export const initializeWorkers = async (): Promise<{ [key: string]: Worker }> => {
  logger.info('Initializing workers...');
  
  // Initialize webhook worker
  const webhookWorker = initializeWebhookWorker();
  
  // Initialize scheduler worker
  const schedulerWorker = initializeSchedulerWorker();

  // The flowWorker is a single instance, not initialized via a function
  const { flowWorker } = await import('./flowWorker.js');
  
  logger.info('All workers initialized');
  
  return {
    webhookWorker,
    schedulerWorker,
    flowWorker
  };
};

export default { initializeWorkers };