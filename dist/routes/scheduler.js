import { Router } from 'express';
import { logger } from '@ugm/logger';
import { authenticateToken } from '../middleware/auth.js';
import schedulerService from '../services/schedulerService.js';
const router = Router();
logger.level = 'info';
/**
 * Schedule a new job
 */
router.post('/schedule', authenticateToken, async (req, res) => {
    try {
        const { name, data, schedule, options } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        // Validate required fields
        if (!name || !data || !schedule) {
            res.status(400).json({ message: 'Missing required fields: name, data, or schedule' });
            return;
        }
        // Validate schedule options
        if (!schedule.cron && (!schedule.repeat || !schedule.repeat.every)) {
            res.status(400).json({
                message: 'Invalid schedule options: must provide either cron expression or repeat.every'
            });
            return;
        }
        // Schedule the job
        const schedulerId = await schedulerService.scheduleJob({ name, data, schedule, options }, userId);
        res.json({ schedulerId });
    }
    catch (error) {
        logger.error('Error scheduling job:', error);
        res.status(500).json({ message: 'An error occurred while scheduling the job' });
    }
});
/**
 * Get all scheduled jobs for the authenticated user
 */
router.get('/schedule', authenticateToken, async (req, res) => {
    logger.info('GET /jobs/schedule route hit');
    logger.debug(`/jobs/schedule request user: ${JSON.stringify(req.user)}`);
    try {
        const userId = req.user?.userId;
        logger.debug(`User ID from request: ${userId}`);
        if (!userId) {
            logger.warn('No user ID found in request');
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        logger.debug(`Fetching scheduled jobs for user ${userId}`);
        const scheduledJobs = await schedulerService.getUserScheduledJobs(userId);
        logger.info(`/jobs/schedule : Found ${scheduledJobs.length} jobs scheduled for user ${userId}`);
        // Always return an object with scheduledJobs array, even if empty
        res.json({ scheduledJobs });
    }
    catch (error) {
        logger.error('Error getting scheduled jobs:', error);
        res.status(500).json({ message: 'An error occurred while fetching scheduled jobs' });
    }
});
/**
 * Get a specific scheduled job
 */
router.get('/schedule/:schedulerId', authenticateToken, async (req, res) => {
    try {
        const { schedulerId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        const scheduledJob = await schedulerService.getScheduledJob(schedulerId, userId);
        if (!scheduledJob) {
            res.status(404).json({ message: 'Scheduled job not found' });
            return;
        }
        res.json(scheduledJob);
    }
    catch (error) {
        logger.error('Error getting scheduled job:', error);
        res.status(500).json({ message: 'An error occurred while fetching the scheduled job' });
    }
});
/**
 * Remove a scheduled job
 */
router.delete('/schedule/:schedulerId', authenticateToken, async (req, res) => {
    try {
        const { schedulerId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        const removed = await schedulerService.removeScheduledJob(schedulerId, userId);
        if (!removed) {
            res.status(404).json({ message: 'Scheduled job not found or unauthorized' });
            return;
        }
        res.json({ message: 'Scheduled job removed successfully' });
    }
    catch (error) {
        logger.error('Error removing scheduled job:', error);
        res.status(500).json({ message: 'An error occurred while removing the scheduled job' });
    }
});
export default router;
