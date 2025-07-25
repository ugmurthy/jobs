#!/usr/bin/env node

/**
 * Script to run the BullMQ worker with dynamic handler registration
 */

import { startWorker } from './src/worker.js';
import { logger } from '@ugm/logger';

// Set log level
logger.level = process.env.LOG_LEVEL || '';

// Print banner
console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   JobRunner Dynamic Handler System                         ║
║                                                            ║
║   - Modular Handlers                                       ║
║   - Dynamic Registration                                   ║
║   - Hot Reloading                                          ║
║   - Plugin System                                          ║
║   - Multi-Queue Support                                    ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);

// Start the worker
logger.info('Starting BullMQ worker with dynamic handler registry...');

startWorker()
  .then(workers => {
    logger.info(`Worker started successfully with ${workers.length} queue(s)`);
    logger.info('Press Ctrl+C to stop');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down...');
      
      // Close all workers
      for (const worker of workers) {
        logger.info(`Closing worker for queue: ${worker.name}`);
        await worker.close();
      }
      
      logger.info('Shutdown complete');
      process.exit(0);
    });
  })
  .catch(error => {
    logger.error(`Failed to start worker: ${error.message}`);
    process.exit(1);
  });