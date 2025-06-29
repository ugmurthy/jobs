import { QueueEvents } from 'bullmq';
import { logger } from '@ugm/logger';
import { Server as SocketIOServer } from 'socket.io';
import { jobQueue, webHookQueue } from '../config/bull.js';

/**
 * Initialize job queue events
 */
export const initializeJobEvents = (io: SocketIOServer, queueEvents: QueueEvents): void => {
  // Progress event
  queueEvents.on('progress', async ({ jobId, data }) => {
    const progress = data;
    logger.info(`Job ${jobId} progress: ${JSON.stringify(progress)}%`);
    
    try {
      const job = await jobQueue.getJob(jobId);
      if (job) {
        const userId = job.data.userId;
        
        // Emit to job-specific room
        io.to(`job:${jobId}`).emit(`job:${jobId}:progress`, { jobId, progress });
        
        // Emit to user-specific room
        io.to(`user:${userId}`).emit('job:progress', { 
          jobId, 
          jobName: job.name, 
          progress 
        });
        
        // Add progress update to webhook queue
        await webHookQueue.add('progress', {
          id: jobId,
          jobname: job.name,
          userId: userId,
          progress: progress
        });
      }
    } catch (error) {
      logger.error(`Error processing progress event for job ${jobId}:`, error);
    }
  });

  // Completed event
  queueEvents.on('completed', async ({ jobId, returnvalue }) => {
    logger.info(`Job ${jobId} completed with result: ${returnvalue}`);
    
    try {
      const job = await jobQueue.getJob(jobId);
      if (job) {
        const userId = job.data.userId;
        
        // Emit to job-specific room
        io.to(`job:${jobId}`).emit(`job:${jobId}:completed`, { jobId, result: returnvalue });
        
        // Emit to user-specific room
        io.to(`user:${userId}`).emit('job:completed', { 
          jobId, 
          jobName: job.name, 
          result: returnvalue 
        });
        
        // Add completion update to webhook queue
        await webHookQueue.add('completed', {
          id: jobId,
          jobname: job.name,
          userId: userId,
          result: returnvalue
        });
      }
    } catch (error) {
      logger.error(`Error processing completed event for job ${jobId}:`, error);
    }
  });

  // Failed event
  queueEvents.on('failed', async ({ jobId, failedReason }) => {
    logger.info(`Job ${jobId} failed: ${failedReason}`);
    
    try {
      const job = await jobQueue.getJob(jobId);
      if (job) {
        const userId = job.data.userId;
        
        // Emit to job-specific room
        io.to(`job:${jobId}`).emit(`job:${jobId}:failed`, { jobId, error: failedReason });
        
        // Emit to user-specific room
        io.to(`user:${userId}`).emit('job:failed', { 
          jobId, 
          jobName: job.name, 
          error: failedReason 
        });
        
        // Add failure update to webhook queue
        await webHookQueue.add('failed', {
          id: jobId,
          jobname: job.name,
          userId: userId,
          error: failedReason
        });
      }
    } catch (error) {
      logger.error(`Error processing failed event for job ${jobId}:`, error);
    }
  });

  // Custom delta event
  (queueEvents as any).on('delta', async ({ jobId, data }: { jobId: string, data: any }) => {
    logger.info(`Job ${jobId} delta event received: ${JSON.stringify(data)}`);
    
    try {
      const job = await jobQueue.getJob(jobId);
      if (job) {
        const userId = job.data.userId;
        const content = data.content;
        
        // Emit to job-specific room
        io.to(`job:${jobId}`).emit(`job:${jobId}:delta`, {
          jobId,
          content
        });
        
        // Emit to user-specific room
        io.to(`user:${userId}`).emit('job:delta', {
          jobId,
          jobName: job.name,
          userId: job.data.userId,
          content
        });
        
        // Add delta update to webhook queue
        await webHookQueue.add('delta', {
          id: jobId,
          jobname: job.name,
          userId: userId,
          content: content
        });
      }
    } catch (error) {
      logger.error(`Error processing delta event for job ${jobId}:`, error);
    }
  });

  logger.info('Job events initialized');
};

export default { initializeJobEvents };