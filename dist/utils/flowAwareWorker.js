import { Worker } from 'bullmq';
import { logger } from '@ugm/logger';
import redis from '../config/redis.js';
import { flowService } from '../services/flowService.js';
/**
 * Generic worker enhancement for flow-aware jobs
 * This utility creates workers that automatically update flow progress
 */
export function createFlowAwareWorker(queueName, processor) {
    return new Worker(queueName, async (job) => {
        try {
            // Check if job is part of a flow
            if (job.data.flowId) {
                logger.info(`Processing flow-aware job ${job.id} for flow ${job.data.flowId}`);
                // Update job status to running
                await updateFlowProgress(job.data.flowId, job.id, "running");
            }
            // Execute the actual job processor
            const result = await processor(job);
            // Update flow progress on completion
            if (job.data.flowId) {
                await updateFlowProgress(job.data.flowId, job.id, "completed", result);
            }
            return result;
        }
        catch (error) {
            // Update flow progress on failure
            if (job.data.flowId) {
                await updateFlowProgress(job.data.flowId, job.id, "failed", undefined, error);
            }
            throw error;
        }
    }, { connection: redis });
}
/**
 * Flow progress update function
 * Updates flow progress in database and emits WebSocket events
 */
export async function updateFlowProgress(flowId, jobId, status, result, error) {
    try {
        const update = {
            jobId,
            status,
            result,
            error,
        };
        await flowService.updateFlowProgress(flowId, update);
        logger.info(`Updated flow ${flowId} job ${jobId} status to ${status}`);
        // TODO: Emit WebSocket events (Section 9)
        // this.emitFlowUpdate(flowId, update);
    }
    catch (updateError) {
        logger.error(`Failed to update flow progress for ${flowId}:`, updateError);
    }
}
/**
 * Middleware to inject flow metadata into job data
 * Use this when adding jobs to queues that should be tracked by flows
 */
export function injectFlowMetadata(jobData, flowId, parentFlowName) {
    return {
        ...jobData,
        flowId,
        _flowMetadata: {
            flowId,
            parentFlowName,
            injectedAt: new Date().toISOString(),
        },
    };
}
