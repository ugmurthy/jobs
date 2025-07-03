import { logger } from '@ugm/logger';
import { initializeWebhookWorker } from './webhookWorker.js';
import { initializeSchedulerWorker } from './schedulerWorker.js';
/**
 * Initialize all workers
 */
export const initializeWorkers = () => {
    logger.info('Initializing workers...');
    // Initialize webhook worker
    const webhookWorker = initializeWebhookWorker();
    // Initialize scheduler worker
    const schedulerWorker = initializeSchedulerWorker();
    logger.info('All workers initialized');
    return {
        webhookWorker,
        schedulerWorker
    };
};
export default { initializeWorkers };
