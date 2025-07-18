import { Worker } from 'bullmq';
import { logger } from '@ugm/logger';
import redis from '../config/redis.js';
import prisma from '../lib/prisma.js';
export const flowWorker = new Worker('flowQueue', async (job) => {
    logger.info(`Processing job "${job.name}" (ID: ${job.id}) in flowQueue`);
    try {
        // Main job logic based on job name
        let result;
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
                    result = { data: job.data };
                }
                else {
                    const children = Object.entries(childrenValues).map(([k, v]) => ({ id: k, ...v }));
                    result = {
                        data: { ...job.data, children }
                    };
                }
                ///result = { success: true, data: {id:job.id,data:{message:`processing ${JSON.stringify(job.data)}`}}};
                break;
            // Add other job cases here
            default:
                logger.warn(`No specific logic for job name: ${job.name}`);
                result = { data: `No specific handler for jobname ${job.name}` };
        }
        logger.info(`Job "${job.name}" (ID: ${job.id}) completed successfully.`);
        return result;
    }
    catch (error) {
        logger.error(`Job "${job.name}" (ID: ${job.id}) failed: ${error.message}`);
        // No need to update the status here, it will be handled by the 'failed' event
        throw error;
    }
}, { connection: redis });
// Event listeners for logging and monitoring
flowWorker.on('completed', async (job, returnValue) => {
    logger.info(`EVENT: Job "${job.name}" (ID: ${job.id}) completed.`);
    if (job.id) {
        try {
            await prisma.flowJob.update({
                where: { jobId: job.id.toString() },
                data: { status: 'completed', result: returnValue },
            });
        }
        catch (error) {
            logger.error(`Failed to update job ${job.id} to completed: ${error.message}`);
        }
    }
});
flowWorker.on('failed', async (job, err) => {
    logger.error(`EVENT: Job "${job?.id}" failed with error: ${err.message}`);
    if (job?.id) {
        try {
            await prisma.flowJob.update({
                where: { jobId: job.id.toString() },
                data: { status: 'failed', error: { message: err.message } },
            });
        }
        catch (error) {
            logger.error(`Failed to update job ${job.id} to failed: ${error.message}`);
        }
    }
});
