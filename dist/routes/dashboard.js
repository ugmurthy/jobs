import { Router } from 'express';
import { logger } from '@ugm/logger';
import { getQueue } from '../config/bull.js';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/combinedAuth.js';
import schedulerService from '../services/schedulerService.js';
const router = Router();
/**
 * Get dashboard statistics
 */
router.get('/stats', authenticate, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        logger.info(`Fetching dashboard stats for user ${userId}`);
        const jobQueue = getQueue('jobQueue');
        // Get all jobs from the queue
        const allJobs = await jobQueue.getJobs(['completed', 'failed', 'active', 'waiting', 'delayed', 'paused', 'waiting-children']);
        // Filter jobs by user ID
        const userJobs = allJobs.filter((job) => job.data.userId === userId);
        // Calculate job statistics using BullMQ status names
        const total = userJobs.length;
        const completed = userJobs.filter((job) => job.finishedOn && !job.failedReason).length;
        const failed = userJobs.filter((job) => job.failedReason).length;
        const active = userJobs.filter((job) => job.processedOn && !job.finishedOn).length;
        const delayed = userJobs.filter((job) => {
            const state = job.opts?.delay && job.opts.delay > Date.now();
            return state;
        }).length;
        const paused = (await jobQueue.getJobs(['paused'])).filter((job) => job.data.userId === userId).length;
        const waiting = (await jobQueue.getJobs(['waiting'])).filter((job) => job.data.userId === userId).length;
        const waitingChildren = userJobs.filter((job) => {
            // Check if job is waiting for children - this would need to be determined by job dependencies
            return false; // Placeholder - would need actual waiting-children detection
        }).length;
        const completionRate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
        // Get recent jobs (last 5)
        const recentJobs = await Promise.all(userJobs
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, 5)
            .map(async (job) => {
            const state = await job.getState();
            let status;
            switch (state) {
                case 'active':
                    status = 'active';
                    break;
                case 'completed':
                    status = 'completed';
                    break;
                case 'failed':
                    status = 'failed';
                    break;
                case 'delayed':
                    status = 'delayed';
                    break;
                case 'paused':
                    status = 'paused';
                    break;
                case 'waiting-children':
                    status = 'waiting-children';
                    break;
                case 'waiting':
                    status = 'waiting';
                    break;
                default:
                    status = 'active'; // Default to active for unknown jobs
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
        }));
        // Get scheduler statistics
        const scheduledJobs = await schedulerService.getUserScheduledJobs('schedQueue', userId);
        // Since we don't have direct access to 'active' property in JobSchedulerJson,
        // we'll assume all returned jobs are active for now
        const activeSchedules = scheduledJobs.length;
        const totalSchedules = scheduledJobs.length;
        // For the next scheduled job, we'll use the current time + 1 day as a placeholder
        // In a real implementation, you would extract this from the job's repeat pattern
        let nextScheduledJob;
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
                active,
                delayed,
                completed,
                failed,
                paused,
                'waiting-children': waitingChildren,
                waiting,
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
    }
    catch (error) {
        logger.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'An error occurred while fetching dashboard statistics' });
    }
});
export default router;
