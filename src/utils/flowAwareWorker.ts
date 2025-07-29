import { Job, Worker } from 'bullmq';
import { logger } from '@ugm/logger';
import redis from '../config/redis.js';
import { flowService } from '../services/flowService.js';
import { FlowUpdateRequest } from '../types/flow-interfaces.js';
import { BullMQJobStatus } from '../types/bullmq-statuses.js';

/**
 * Generic worker enhancement for flow-aware jobs
 * This utility creates workers that automatically update flow progress
 */
export function createFlowAwareWorker(
  queueName: string,
  processor: (job: Job) => Promise<any>
) {
  return new Worker(
    queueName,
    async (job: Job) => {
      try {
        // Check if job is part of a flow
        if (job.data.flowId) {
          logger.info(`Processing flow-aware job ${job.id} for flow ${job.data.flowId}`);
          
          // Update job status to active
          await updateFlowProgress(job.data.flowId, job.id!, "active");
        }

        // Execute the actual job processor
        const result = await processor(job);

        // Update flow progress on completion
        if (job.data.flowId) {
          await updateFlowProgress(job.data.flowId, job.id!, "completed", result);
        }

        return result;
      } catch (error) {
        // Update flow progress on failure
        if (job.data.flowId) {
          await updateFlowProgress(job.data.flowId, job.id!, "failed", undefined, error);
        }
        throw error;
      }
    },
    { connection: redis }
  );
}

/**
 * Flow progress update function
 * Updates flow progress in database and emits WebSocket events
 */
export async function updateFlowProgress(
  flowId: string,
  jobId: string,
  status: BullMQJobStatus,
  result?: any,
  error?: any
) {
  try {
    const update: FlowUpdateRequest = {
      jobId,
      status,
      result,
      error,
    };

    await flowService.updateFlowProgress(flowId, update);
    
    logger.info(`Updated flow ${flowId} job ${jobId} status to ${status}`);

    // TODO: Emit WebSocket events (Section 9)
    // this.emitFlowUpdate(flowId, update);
  } catch (updateError) {
    logger.error(`Failed to update flow progress for ${flowId}:`, updateError);
  }
}

/**
 * Middleware to inject flow metadata into job data
 * Use this when adding jobs to queues that should be tracked by flows
 */
export function injectFlowMetadata(jobData: any, flowId: string, parentFlowName: string) {
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