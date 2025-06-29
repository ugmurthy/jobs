import { Worker } from 'bullmq';
import { logger } from '@ugm/logger';
import redisOptions from '../config/redis.js';
import webhookService from '../services/webhookService.js';

/**
 * Initialize the webhook worker
 */
export const initializeWebhookWorker = (): Worker => {
  // Create webhook worker
  const webhookWorker = new Worker(
    "webhooks",
    async (job) => {
      const { id, jobname, userId, result, progress, error, content } = job.data;
      const eventType = job.name as "progress" | "completed" | "failed" | "delta" | "all"; // Cast to valid event type
      
      logger.info(`WORKER: webhooks ${job.id}/${job.name} active for ${userId}/${id}/${jobname}`);
      
      // Prepare payload based on event type
      const payload = {
        id,
        jobname,
        userId,
        eventType,
        ...(progress !== undefined && { progress }),
        ...(result !== undefined && { result }),
        ...(error !== undefined && { error }),
        ...(content !== undefined && { content })
      };
      
      // Send webhook notifications
      const results = await webhookService.sendWebhookNotification(payload);
      
      // Return success status
      return {
        success: results.some((result: boolean) => result === true),
        webhooksTriggered: results.filter((result: boolean) => result === true).length,
        webhooksFailed: results.filter((result: boolean) => result === false).length
      };
    },
    { connection: redisOptions }
  );

  // Event listeners for the worker
  webhookWorker.on("completed", (job, returnvalue) => {
    logger.info(`WORKER : ${job.id} : ${job.name} : completed!`);
    logger.debug(`Return value: ${JSON.stringify(returnvalue)}`);
  });

  webhookWorker.on("progress", (job, progress) => {
    logger.info(`WORKER : ${job.name} : progress ${progress}%`);
  });

  webhookWorker.on("failed", (job, err) => {
    logger.error(`WORKER : ${job?.id} has failed with ${err.message}`);
  });

  logger.info("Webhook worker initialized");
  return webhookWorker;
};

export default { initializeWebhookWorker };