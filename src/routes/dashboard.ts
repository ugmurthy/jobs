import { Router, Request, Response } from 'express';
import { logger } from '@ugm/logger';
import { jobQueue } from '../config/bull.js';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/combinedAuth.js';
import schedulerService from '../services/schedulerService.js';
import { JobSchedulerJson } from 'bullmq';

// Define custom Request type with user property
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    username: string;
  };
}

const router = Router();

/**
 * Get dashboard statistics
 */
router.get('/stats', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    
    logger.info(`Fetching dashboard stats for user ${userId}`);
    
    // Get all jobs from the queue
    const allJobs = await jobQueue.getJobs(['completed', 'failed', 'active', 'waiting', 'delayed']);
    
    // Filter jobs by user ID
    const userJobs = allJobs.filter((job: any) => job.data.userId === userId);
    
    // Calculate job statistics
    const total = userJobs.length;
    const completed = userJobs.filter((job: any) => job.finishedOn && !job.failedReason).length;
    const failed = userJobs.filter((job: any) => job.failedReason).length;
    const running = userJobs.filter((job: any) => job.processedOn && !job.finishedOn).length;
    const pending = total - completed - failed - running;
    const completionRate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
    
    // Get recent jobs (last 5)
    const recentJobs = await Promise.all(
      userJobs
        .sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, 5)
        .map(async (job: any) => {
          const state = await job.getState();
          let status: 'pending' | 'running' | 'completed' | 'failed';
          
          switch (state) {
            case 'active':
              status = 'running';
              break;
            case 'completed':
              status = 'completed';
              break;
            case 'failed':
              status = 'failed';
              break;
            default:
              status = 'pending';
          }
          
          const createdAt = new Date(job.timestamp).toISOString();
          const completedAt = job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined;
          const duration = job.finishedOn && job.processedOn 
            ? Math.round((job.finishedOn - job.processedOn) / 1000) 
            : undefined;
          
          return {
            id: job.id,
            name: job.name,
            status,
            createdAt,
            completedAt,
            duration
          };
        })
    );
    
    // Get scheduler statistics
    const scheduledJobs = await schedulerService.getUserScheduledJobs(userId);
    
    // Since we don't have direct access to 'active' property in JobSchedulerJson,
    // we'll assume all returned jobs are active for now
    const activeSchedules = scheduledJobs.length;
    const totalSchedules = scheduledJobs.length;
    
    // For the next scheduled job, we'll use the current time + 1 day as a placeholder
    // In a real implementation, you would extract this from the job's repeat pattern
    let nextScheduledJob: string | undefined;
    if (scheduledJobs.length > 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      nextScheduledJob = tomorrow.toISOString();
    }
    
    // Get webhook statistics
    const webhooks = await prisma.webhook.findMany({
      where: { userId }
    });
    
    const totalWebhooks = webhooks.length;
    const activeWebhooks = webhooks.filter(webhook => webhook.active).length;
    
    // For webhook delivery stats, we would need a webhook delivery tracking table
    // For now, we'll use mock data
    const deliveryRate = 98.5;
    const totalDeliveries = 1250;
    const failedDeliveries = Math.round(totalDeliveries * (1 - deliveryRate / 100));
    
    // Construct the response
    const response = {
      jobStats: {
        total,
        pending,
        running,
        completed,
        failed,
        completionRate
      },
      recentJobs,
      schedulerStats: {
        activeSchedules,
        totalSchedules,
        nextScheduledJob
      },
      webhookStats: {
        totalWebhooks,
        activeWebhooks,
        deliveryRate,
        totalDeliveries,
        failedDeliveries
      }
    };
    
    res.json(response);
  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'An error occurred while fetching dashboard statistics' });
  }
});

export default router;