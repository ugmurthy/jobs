import { QueueEvents } from 'bullmq';
import { logger } from '@ugm/logger';
import { getQueue } from '../config/bull.js';
import { allowedQueues } from '../config/queues.js';
/**
 * Initialize job queue events
 */
export const initializeJobEvents = (io) => {
    allowedQueues.forEach(queueName => {
        const queue = getQueue(queueName);
        const queueEvents = new QueueEvents(queueName, { connection: queue.opts.connection });
        queueEvents.on('progress', async ({ jobId, data }) => {
            const progress = data;
            logger.info(`Job ${jobId} in queue ${queueName} progress: ${JSON.stringify(progress)}%`);
            try {
                const job = await queue.getJob(jobId);
                if (job) {
                    const userId = job.data.userId;
                    io.to(`job:${jobId}`).emit(`job:${jobId}:progress`, { jobId, progress, queueName });
                    io.to(`user:${userId}`).emit('job:progress', {
                        jobId,
                        jobName: job.name,
                        progress,
                        queueName
                    });
                    // Assuming webhooks should be triggered from any queue
                    if (queueName !== 'webhooks') {
                        const webHookQueue = getQueue('webhooks');
                        await webHookQueue.add('progress', {
                            id: jobId,
                            jobname: job.name,
                            userId: userId,
                            progress: progress,
                            queue: queueName
                        });
                    }
                }
            }
            catch (error) {
                logger.error(`Error processing progress event for job ${jobId} in queue ${queueName}:`, error);
            }
        });
        queueEvents.on('completed', async ({ jobId, returnvalue }) => {
            logger.info(`Job ${jobId} in queue ${queueName} completed with result: ${returnvalue}`);
            try {
                const job = await queue.getJob(jobId);
                if (job) {
                    const userId = job.data.userId;
                    io.to(`job:${jobId}`).emit(`job:${jobId}:completed`, { jobId, result: returnvalue, queueName });
                    io.to(`user:${userId}`).emit('job:completed', {
                        jobId,
                        jobName: job.name,
                        result: returnvalue,
                        queueName
                    });
                    if (queueName !== 'webhooks') {
                        const webHookQueue = getQueue('webhooks');
                        await webHookQueue.add('completed', {
                            id: jobId,
                            jobname: job.name,
                            userId: userId,
                            result: returnvalue,
                            queue: queueName
                        });
                    }
                }
            }
            catch (error) {
                logger.error(`Error processing completed event for job ${jobId} in queue ${queueName}:`, error);
            }
        });
        queueEvents.on('failed', async ({ jobId, failedReason }) => {
            logger.info(`Job ${jobId} in queue ${queueName} failed: ${failedReason}`);
            try {
                const job = await queue.getJob(jobId);
                if (job) {
                    const userId = job.data.userId;
                    io.to(`job:${jobId}`).emit(`job:${jobId}:failed`, { jobId, error: failedReason, queueName });
                    io.to(`user:${userId}`).emit('job:failed', {
                        jobId,
                        jobName: job.name,
                        error: failedReason,
                        queueName
                    });
                    if (queueName !== 'webhooks') {
                        const webHookQueue = getQueue('webhooks');
                        await webHookQueue.add('failed', {
                            id: jobId,
                            jobname: job.name,
                            userId: userId,
                            error: failedReason,
                            queue: queueName
                        });
                    }
                }
            }
            catch (error) {
                logger.error(`Error processing failed event for job ${jobId} in queue ${queueName}:`, error);
            }
        });
        queueEvents.on('delta', async ({ jobId, data }) => {
            logger.info(`Job ${jobId} in queue ${queueName} delta event received: ${JSON.stringify(data)}`);
            try {
                const job = await queue.getJob(jobId);
                if (job) {
                    const userId = job.data.userId;
                    const content = data.content;
                    io.to(`job:${jobId}`).emit(`job:${jobId}:delta`, { jobId, content, queueName });
                    io.to(`user:${userId}`).emit('job:delta', {
                        jobId,
                        jobName: job.name,
                        userId: job.data.userId,
                        content,
                        queueName
                    });
                    if (queueName !== 'webhooks') {
                        const webHookQueue = getQueue('webhooks');
                        await webHookQueue.add('delta', {
                            id: jobId,
                            jobname: job.name,
                            userId: userId,
                            content: content,
                            queue: queueName
                        });
                    }
                }
            }
            catch (error) {
                logger.error(`Error processing delta event for job ${jobId} in queue ${queueName}:`, error);
            }
        });
        logger.info(`Job events for queue ${queueName} initialized`);
    });
};
export default { initializeJobEvents };
