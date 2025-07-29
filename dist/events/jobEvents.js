import { QueueEvents } from 'bullmq';
import { logger } from '@ugm/logger';
import { getQueue } from '../config/bull.js';
import { allowedQueues } from '../config/queues.js';
import { flowService } from '../services/flowService.js';
/**
 * Initialize job queue events
 *
 * This function sets up event listeners for BullMQ job events including:
 * - progress: Updates job progress and triggers webhooks
 * - completed: Handles job completion, updates flow progress if applicable, and emits events
 * - failed: Handles job failures, updates flow progress if applicable, and emits events
 * - delta: Handles streaming data updates from jobs
 *
 * Flow Integration:
 * Jobs that belong to flows (identified by job.data.flowId) will automatically
 * update their parent flow's progress when they complete or fail. This enables
 * real-time flow tracking and WebSocket notifications.
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
                    const flowId = job.data.flowId;
                    // Update flow progress if this job belongs to a flow
                    if (flowId) {
                        try {
                            await flowService.updateFlowProgress(flowId, {
                                jobId,
                                status: 'completed',
                                result: typeof returnvalue === 'object' ? returnvalue : { value: returnvalue },
                                jobName: job.name,
                                queueName: queueName // Add queue metadata
                            });
                            logger.info(`Flow ${flowId} progress updated for completed job ${jobId}`);
                        }
                        catch (flowError) {
                            logger.error(`Error updating flow progress for job ${jobId} in flow ${flowId}:`, flowError);
                        }
                    }
                    io.to(`job:${jobId}`).emit(`job:${jobId}:completed`, { jobId, result: returnvalue, queueName });
                    io.to(`user:${userId}`).emit('job:completed', {
                        jobId,
                        jobName: job.name,
                        flowId: flowId,
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
                    const flowId = job.data.flowId;
                    // Update flow progress if this job belongs to a flow
                    if (flowId) {
                        try {
                            await flowService.updateFlowProgress(flowId, {
                                jobId,
                                status: 'failed',
                                error: typeof failedReason === 'object' ? failedReason : { message: failedReason },
                                jobName: job.name,
                                queueName: queueName // Add queue metadata
                            });
                            logger.info(`Flow ${flowId} progress updated for failed job ${jobId}`);
                        }
                        catch (flowError) {
                            logger.error(`Error updating flow progress for job ${jobId} in flow ${flowId}:`, flowError);
                        }
                    }
                    io.to(`job:${jobId}`).emit(`job:${jobId}:failed`, { jobId, error: failedReason, queueName });
                    io.to(`user:${userId}`).emit('job:failed', {
                        jobId,
                        jobName: job.name,
                        flowId: flowId,
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
        // NEW: Track when jobs become active
        queueEvents.on('active', async ({ jobId }) => {
            logger.info(`Job ${jobId} in queue ${queueName} became active`);
            try {
                const job = await queue.getJob(jobId);
                if (job) {
                    const userId = job.data.userId;
                    const flowId = job.data.flowId;
                    // Update flow progress if this job belongs to a flow
                    if (flowId) {
                        try {
                            await flowService.updateFlowProgress(flowId, {
                                jobId,
                                status: 'active',
                                jobName: job.name,
                                queueName: queueName,
                                startedAt: new Date().toISOString()
                            });
                            logger.info(`Flow ${flowId} progress updated for active job ${jobId}`);
                        }
                        catch (flowError) {
                            logger.error(`Error updating flow progress for job ${jobId} in flow ${flowId}:`, flowError);
                        }
                    }
                    // Emit WebSocket events
                    io.to(`job:${jobId}`).emit(`job:${jobId}:active`, { jobId, queueName });
                    io.to(`user:${userId}`).emit('job:active', {
                        jobId,
                        jobName: job.name,
                        flowId: flowId,
                        queueName
                    });
                }
            }
            catch (error) {
                logger.error(`Error processing active event for job ${jobId} in queue ${queueName}:`, error);
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
