import { Router, Request, Response } from 'express';
import { logger } from '@ugm/logger';
import schedulerService from '../services/schedulerService.js';
import { authenticate } from '../middleware/combinedAuth.js';
import { validateQueue } from '../middleware/validateQueue.js';
// Define custom Request type with user property
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    username: string;
  };
}

const router = Router();
logger.level='info'
/**
 * Schedule a new job
 */
router.post('/:queueName/schedule', authenticate, validateQueue, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { queueName } = req.params;
        const { name, data, schedule, options } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }

        if (!name || !data || !schedule) {
            res.status(400).json({ message: 'Missing required fields: name, data, or schedule' });
            return;
        }

        if (!schedule.cron && (!schedule.repeat || !schedule.repeat.every)) {
            res.status(400).json({
                message: 'Invalid schedule options: must provide either cron expression or repeat.every'
            });
            return;
        }

        const schedulerId = await schedulerService.scheduleJob(
            queueName,
            { name, data, schedule, options },
            userId
        );

        res.json({ schedulerId });
    } catch (error) {
        logger.error('Error scheduling job:', error);
        res.status(500).json({ message: 'An error occurred while scheduling the job' });
    }
});

/**
 * Get all scheduled jobs for the authenticated user
 */
router.get('/:queueName/schedule', authenticate, validateQueue, async (req: AuthenticatedRequest, res: Response) => {
    logger.info(`GET /jobs/schedule route hit for queue ${req.params.queueName}`);
    logger.debug(`/jobs/schedule request user: ${JSON.stringify(req.user)}`);
    try {
        const { queueName } = req.params;
        const userId = req.user?.userId;
        logger.debug(`User ID from request: ${userId}`);

        if (!userId) {
            logger.warn('No user ID found in request');
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }

        logger.debug(`Fetching scheduled jobs for user ${userId} in queue ${queueName}`);
        const scheduledJobs = await schedulerService.getUserScheduledJobs(queueName, userId);
        logger.info(`/jobs/schedule : Found ${scheduledJobs.length} jobs scheduled for user ${userId} in queue ${queueName}`);

        res.json({ scheduledJobs });
    } catch (error) {
        logger.error('Error getting scheduled jobs:', error);
        res.status(500).json({ message: 'An error occurred while fetching scheduled jobs' });
    }
});

/**
 * Get a specific scheduled job
 */
router.get('/:queueName/schedule/:schedulerId', authenticate, validateQueue, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { queueName, schedulerId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }

        const scheduledJob = await schedulerService.getScheduledJob(queueName, schedulerId, userId);

        if (!scheduledJob) {
            res.status(404).json({ message: 'Scheduled job not found' });
            return;
        }

        res.json(scheduledJob);
    } catch (error) {
        logger.error('Error getting scheduled job:', error);
        res.status(500).json({ message: 'An error occurred while fetching the scheduled job' });
    }
});

/**
 * Remove a scheduled job
 */
router.delete('/:queueName/schedule/:schedulerId', authenticate, validateQueue, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { queueName, schedulerId } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }

        const removed = await schedulerService.removeScheduledJob(queueName, schedulerId, userId);

        if (!removed) {
            res.status(404).json({ message: 'Scheduled job not found or unauthorized' });
            return;
        }

        res.json({ message: 'Scheduled job removed successfully' });
    } catch (error) {
        logger.error('Error removing scheduled job:', error);
        res.status(500).json({ message: 'An error occurred while removing the scheduled job' });
    }
});

export default router;