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
import { allowedQueues } from '../config/queues.js';
router.get('/stats', authenticate, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        logger.info(`Fetching dashboard stats for user ${userId}`);
        const queueStats = [];
        const jobStatuses = ['completed', 'failed', 'active', 'waiting', 'delayed', 'paused', 'waiting-children'];
        const totals = {
            completed: 0,
            failed: 0,
            active: 0,
            waiting: 0,
            delayed: 0,
            paused: 0,
            'waiting-children': 0,
            total: 0,
        };
        for (const queueName of allowedQueues) {
            const queue = getQueue(queueName);
            if (!queue)
                continue;
            const statsForQueue = { name: queueName, total: 0 };
            const promises = jobStatuses.map(status => queue.getJobs([status]));
            const jobsByStatus = await Promise.all(promises);
            jobsByStatus.forEach((jobs, index) => {
                const status = jobStatuses[index];
                const userJobsInStatus = jobs.filter((job) => job.data.userId === userId);
                const count = userJobsInStatus.length;
                statsForQueue[status] = count;
                statsForQueue.total += count;
                totals[status] += count;
            });
            totals.total += statsForQueue.total;
            queueStats.push(statsForQueue);
        }
        const { total, completed, failed, active, delayed, paused, waiting } = totals;
        const waitingChildren = totals['waiting-children'];
        const completionRate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
        const jobQueue = getQueue('jobQueue');
        const recentJobsRaw = await jobQueue.getJobs(['completed', 'failed', 'active', 'waiting', 'delayed', 'paused', 'waiting-children'], 0, 4);
        const recentJobs = await Promise.all(recentJobsRaw
            .filter((job) => job.data.userId === userId)
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
                default: status = 'active';
            }
            const createdAt = new Date(job.timestamp).toISOString();
            const completedAt = job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined;
            const duration = job.finishedOn && job.processedOn ? Math.round((job.finishedOn - job.processedOn) / 1000) : undefined;
            return { id: job.id, name: job.name, status, createdAt, completedAt, duration };
        }));
        // Get scheduler statistics
        const scheduledJobs = await schedulerService.getUserScheduledJobs('schedQueue', userId);
        const activeSchedules = scheduledJobs.length;
        const totalSchedules = scheduledJobs.length;
        let nextScheduledJob;
        if (scheduledJobs.length > 0) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            nextScheduledJob = tomorrow.toISOString();
        }
        // Get webhook statistics
        const webhooks = await prisma.webhook.findMany({ where: { userId } });
        const totalWebhooks = webhooks.length;
        const activeWebhooks = webhooks.filter(webhook => webhook.active).length;
        const deliveryRate = 98.5;
        const totalDeliveries = 1250;
        const failedDeliveries = Math.round(totalDeliveries * (1 - deliveryRate / 100));
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
            queueStats,
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
