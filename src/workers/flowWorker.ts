import { Job, Worker } from 'bullmq';
import { logger } from '@ugm/logger';
import redis from '../config/redis.js'
import { flowService } from '../services/flowService.js';
import { updateFlowProgress } from '../utils/flowAwareWorker.js';

export const flowWorker = new Worker('flowQueue', async (job: Job) => {
  logger.info(`Processing job "${job.name}" (ID: ${job.id}) in flowQueue`);

  try {
    // Main job logic based on job name
    let result: any;
    switch (job.name) {
      case 'child-job':
        logger.info('Executing example-child-job...');
        ///
        const childrenValues = await job.getChildrenValues();
        
        /////////////////////////////////////////////////////////////////////////////
        // At this state process the children data as well as any data in job.data
        // to produce this job output 
        // for demo purpose i am returning the job.data as well as children data
        /////////////////////////////////////////////////////////////////////////////

        if (Object.keys(childrenValues).length === 0) {
          result = { data: job.data }
        } else {
          const children = Object.entries(childrenValues).map(([k, v]) => ({ id: k, ...v }));
          result = {
            data: { ...job.data, children }
          }
        }

        ///result = { success: true, data: {id:job.id,data:{message:`processing ${JSON.stringify(job.data)}`}}};
        break;
        // Add other job cases here
      default:
        logger.warn(`No specific logic for job name: ${job.name}`);
        result = { data: `No specific handler for jobname ${job.name}` }
    }

    logger.info(`Job "${job.name}" (ID: ${job.id}) completed successfully.`);
    return result;

  } catch (error: any) {
    logger.error(`Job "${job.name}" (ID: ${job.id}) failed: ${error.message}`);
    // No need to update the status here, it will be handled by the 'failed' event
    throw error;
  }
}, { connection: redis });

// Event listeners for logging and monitoring
flowWorker.on('completed', async (job, returnValue) => {
  logger.info(`EVENT: Job "${job.name}" (ID: ${job.id}) completed.`);
  if (job.id && job.data.flowId) {
    try {
      // Update flow progress using the new unified approach
      await updateFlowProgress(job.data.flowId, job.id.toString(), "completed", returnValue);
    } catch (error: any) {
      logger.error(`Failed to update flow progress for job ${job.id}: ${error.message}`);
    }
  }
});

flowWorker.on('failed', async (job, err) => {
  logger.error(`EVENT: Job "${job?.id}" failed with error: ${err.message}`);
  if (job?.id && job.data.flowId) {
    try {
      // Update flow progress using the new unified approach
      await updateFlowProgress(job.data.flowId, job.id.toString(), "failed", undefined, { message: err.message });
    } catch (error: any) {
      logger.error(`Failed to update flow progress for job ${job.id}: ${error.message}`);
    }
  }
});

flowWorker.on('active', async (job) => {
  logger.info(`EVENT: Job "${job.name}" (ID: ${job.id}) started processing.`);
  if (job.id && job.data.flowId) {
    try {
      // Update flow progress to indicate job is running
      await updateFlowProgress(job.data.flowId, job.id.toString(), "running");
    } catch (error: any) {
      logger.error(`Failed to update flow progress for job ${job.id}: ${error.message}`);
    }
  }
});