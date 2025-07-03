import { Queue, QueueEvents, JobScheduler } from 'bullmq';
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
import { ExpressAdapter } from "@bull-board/express";
import { logger } from '@ugm/logger';
import redisOptions from './redis.js';

// Default job options
export const defaultOptions = {
  removeOnComplete: { count: 3 },  // retain info on last 3 completed jobs
  removeOnFail: { count: 5 }       // retain info on last 5 failed jobs
};

// Initialize queues
export const jobQueue = new Queue('jobQueue', { connection: redisOptions });
export const webHookQueue = new Queue('webhooks', { connection: redisOptions });
export const schedQueue = new Queue('schedQueue', { connection: redisOptions });

// Initialize JobScheduler
export const jobScheduler = new JobScheduler('schedQueue', { connection: redisOptions });

// Initialize queue events
export const queueEvents = new QueueEvents('jobQueue', { connection: redisOptions });

// Set up Bull Board
export const serverAdapter = new ExpressAdapter();
export const bullBoard = createBullBoard({
  queues: [
    new BullMQAdapter(jobQueue),
    new BullMQAdapter(webHookQueue),
    new BullMQAdapter(schedQueue)
  ],
  serverAdapter: serverAdapter,
});

// Configure Bull Board
serverAdapter.setBasePath('/admin');

// Function to initialize Bull/BullMQ
export const initializeBull = (): void => {
  logger.info('Bull/BullMQ initialized');
  logger.info('Job queue, webhook queue, and scheduler queue created');
};

export default {
  jobQueue,
  webHookQueue,
  schedQueue,
  queueEvents,
  jobScheduler,
  serverAdapter,
  bullBoard,
  defaultOptions,
  initializeBull
};