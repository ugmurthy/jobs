import { startWorker } from './src/worker.js';
import { logger } from '@ugm/logger';

// Set log level
//logger.level = 'debug';

// Start the worker
logger.info('Starting BullMQ worker with dynamic handler registry...');
startWorker()
  .then(workers => {
    logger.info(`Worker started successfully with ${workers.length} queue(s)`);
  })
  .catch(error => {
    logger.error(`Failed to start worker: ${error.message}`);
    process.exit(1);
  });