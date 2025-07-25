import { Worker, Queue } from "bullmq";
import { logger } from '@ugm/logger';
import path from 'path';
import { fileURLToPath } from 'url';

import registry from './registry.js';
import config from './config.js';
import watcher from './watcher.js';
import pluginManager from './pluginManager.js';

// Redis connection options
const redisOptions = { host: "localhost", port: 6379 };

// For returning results and notification to requestor
const webHookQueue = new Queue("webhooks", { connection: redisOptions });

// Process jobs from the queue
export const processJob = async (job) => {
  // Get the handler at the time the job starts processing
  const handler = registry.getHandler(job.name);
  
  // Store a reference to the handler to ensure it's not affected by updates
  const handlerSnapshot = handler ? { ...handler } : null;
  
  if (handlerSnapshot) {
    logger.info(`Processing job: ${job.id} : ${job.name}`);
    try {
      const retval = await handlerSnapshot.execute(job);
      if (retval) {
        return retval;
      }
    } catch (error) {
      logger.error(`Error executing handler for ${job.name}: ${error.message}`);
      throw error;
    }
  } else {
    logger.error(`${job.id}: ${job.name} : Handler not available`);
    throw new Error(`${job.id}: ${job.name} : Handler not available`);
  }
};

// Create a worker for a specific queue
const createQueueWorker = (queueName, options = {}) => {
  logger.info(`Creating worker for queue: ${queueName}`);
  
  const queueConfig = config.getQueueConfig(queueName);
  const concurrency = queueConfig.concurrency || 10;
  
  const worker = new Worker(queueName, processJob, { 
    connection: redisOptions,
    concurrency,
    ...options
  });
  
  // Set up event listeners for this worker
  worker.on("completed", (job, returnvalue) => {
    logger.info(`${job.id} : ${job.name} for ${job.data.username || job.data.userId || 'unknown'} : completed!`);
  });
  
  worker.on("progress", (job, progress) => {
    logger.info(`\t ${job.name} : progress ${progress}%`);
  });
  
  worker.on("failed", (job, err) => {
    logger.error(`${job.id} has failed with ${err.message}`);
  });
  
  return worker;
};


// Initialize and start the worker
export const startWorker = async () => {
  try {
    // Load configuration
    await config.load();
    
    // Initialize handler registry with directories from config
    const handlerDirectories = config.getHandlerDirectories();
    for (const directory of handlerDirectories) {
      registry.addDirectory(directory);
    }
    
    // Initialize plugin manager and discover plugins
    await pluginManager.initialize();
    
    // Discover and load handlers
    await registry.discoverHandlers();
    
    // Get queue names from configuration
    const queueNames = config.getQueueNames();
    
    // Create workers for each queue
    const workers = queueNames.map(queueName => createQueueWorker(queueName));
    
    // Set up file watchers for hot reloading
    for (const directory of handlerDirectories) {
      watcher.watchDirectory(directory);
    }
    
    logger.info(`Worker started with dynamic handler registry for ${queueNames.length} queues!`);
    return workers;
  } catch (error) {
    logger.error(`Failed to initialize worker: ${error.message}`);
    throw error;
  }
};

// If this file is run directly, start the worker
if (import.meta.url === `file://${process.argv[1]}`) {
  startWorker().catch(error => {
    logger.error(`Worker startup failed: ${error.message}`);
    process.exit(1);
  });
}