import { Queue, QueueEvents, JobScheduler } from 'bullmq';
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
import { ExpressAdapter } from "@bull-board/express";
import { logger } from '@ugm/logger';
import redisOptions from './redis.js';
import { allowedQueues } from './queues.js';
// Default job options
export const defaultOptions = {
    removeOnComplete: { count: 3 },
    removeOnFail: { count: 5 } // retain info on last 5 failed jobs
};
const queueInstances = new Map();
const queueEventsInstances = new Map();
const jobSchedulerInstances = new Map();
function getValidatedQueue(queueName, instancesMap, creator) {
    if (!allowedQueues.includes(queueName)) {
        throw new Error(`Queue ${queueName} is not allowed.`);
    }
    if (!instancesMap.has(queueName)) {
        instancesMap.set(queueName, creator(queueName));
    }
    return instancesMap.get(queueName);
}
export const getQueue = (queueName) => {
    return getValidatedQueue(queueName, queueInstances, (name) => new Queue(name, { connection: redisOptions }));
};
export const getQueueEvents = (queueName) => {
    return getValidatedQueue(queueName, queueEventsInstances, (name) => new QueueEvents(name, { connection: redisOptions }));
};
export const getJobScheduler = (queueName) => {
    return getValidatedQueue(queueName, jobSchedulerInstances, (name) => new JobScheduler(name, { connection: redisOptions }));
};
// Set up Bull Board with all allowed queues
const bullBoardQueues = allowedQueues.map(name => new BullMQAdapter(getQueue(name)));
export const serverAdapter = new ExpressAdapter();
export const bullBoard = createBullBoard({
    queues: bullBoardQueues,
    serverAdapter: serverAdapter,
});
// Configure Bull Board
serverAdapter.setBasePath('/admin');
// Function to initialize Bull/BullMQ
export const initializeBull = () => {
    logger.info('Bull/BullMQ initialized');
    logger.info(`Allowed queues: ${allowedQueues.join(', ')}`);
};
export default {
    getQueue,
    getQueueEvents,
    getJobScheduler,
    serverAdapter,
    bullBoard,
    defaultOptions,
    initializeBull
};
