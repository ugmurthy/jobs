import { Job, Worker } from 'bullmq';
import { logger } from '@ugm/logger';
import redis from '../config/redis.js'
import prisma from '../lib/prisma.js';

export const flowWorker = new Worker('flowQueue', async (job: Job) => {
  logger.info(`Processing job "${job.name}" (ID: ${job.id}) in flowQueue`);

  try {
    // Example: Update the job status in the database
    await prisma.flowJob.update({
      where: { jobId: job.id!.toString() },
      data: { status: 'active' },
    });

    // Main job logic based on job name
    let result: any;
    switch (job.name) {
      case 'example-child-job':
        logger.info('Executing example-child-job...');
        result = { success: true, message: `Child job ${job.id} completed.` };
        break;
      // Add other job cases here
      default:
        logger.warn(`No specific logic for job name: ${job.name}`);
        result = { success: true, message: `Job ${job.id} processed with default handler.` };
    }

    // Update DB with completion status
    await prisma.flowJob.update({
      where: { jobId: job.id!.toString() },
      data: { status: 'completed', result: result },
    });

    logger.info(`Job "${job.name}" (ID: ${job.id}) completed successfully.`);
    return result;

  } catch (error: any) {
    logger.error(`Job "${job.name}" (ID: ${job.id}) failed: ${error.message}`);
    // Update DB with failure status
    await prisma.flowJob.update({
      where: { jobId: job.id!.toString() },
      data: { status: 'failed', error: { message: error.message } },
    });
    throw error;
  }
}, { connection: redis });

// Event listeners for logging and monitoring
flowWorker.on('completed', (job, returnValue) => {
    logger.info(`EVENT: Job "${job.name}" (ID: ${job.id}) completed.`);
});

flowWorker.on('failed', (job, err) => {
    logger.error(`EVENT: Job "${job?.id}" failed with error: ${err.message}`);
});