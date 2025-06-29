import { logger } from '@ugm/logger';
import { initializeWebhookWorker } from './webhookWorker.js';
/**
 * Initialize all workers
 */
export const initializeWorkers = () => {
    logger.info('Initializing workers...');
    // Initialize webhook worker
    const webhookWorker = initializeWebhookWorker();
    // Add more workers here as needed
    logger.info('All workers initialized');
    return {
        webhookWorker
    };
};
export default { initializeWorkers };
