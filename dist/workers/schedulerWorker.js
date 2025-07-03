import { Worker } from 'bullmq';
import { logger } from '@ugm/logger';
import redisOptions from '../config/redis.js';
import { jobQueue, defaultOptions } from '../config/bull.js';
/**
 * Initialize the scheduler worker
 *
 * This worker takes jobs from the schedQueue and adds them to the jobQueue
 * for actual execution. It acts as a bridge between the scheduler and the
 * job execution system.
 */
export const initializeSchedulerWorker = () => {
    // Create scheduler worker
    const schedulerWorker = new Worker('schedQueue', async (job) => {
        try {
            //const { name, data, options } = job.data;
            const { name, data } = job;
            const options = job.data;
            logger.info(`Processing scheduled job: ${job.id} (${name})`);
            // Add the job to the jobQueue for actual execution
            const jobOptions = options || defaultOptions;
            const actualJob = await jobQueue.add(name, data, jobOptions);
            logger.info(`Scheduled job ${job.id} added to jobQueue as job ${actualJob.id}`);
            return {
                success: true,
                jobId: actualJob.id
            };
        }
        catch (error) {
            logger.error(`Error processing scheduled job ${job.id}:`, error);
            throw error;
        }
    }, {
        connection: redisOptions,
        concurrency: 5 // Process up to 5 scheduled jobs at once
    });
    // Event listeners for the worker
    schedulerWorker.on('completed', (job, result) => {
        logger.info(`Scheduled job ${job.id} completed with result: ${JSON.stringify(result)}`);
    });
    schedulerWorker.on('failed', (job, error) => {
        if (job) {
            logger.error(`Scheduled job ${job.id} failed:`, error);
        }
        else {
            logger.error('Scheduled job failed:', error);
        }
    });
    schedulerWorker.on('ready', () => {
        logger.info('Scheduler worker is ready');
    });
    schedulerWorker.on('error', (error) => {
        logger.error('Scheduler worker error:', error);
    });
    logger.info('Scheduler worker initialized');
    return schedulerWorker;
};
export default { initializeSchedulerWorker };
