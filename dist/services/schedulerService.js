import { logger } from '@ugm/logger';
import { jobScheduler, defaultOptions } from '../config/bull.js';
class SchedulerService {
    /**
     * Schedule a new job
     */
    async scheduleJob(submission, userId) {
        logger.debug(`===================`);
        logger.info(`schedulerService : Scheduling job: (${submission.name}) for user (${userId})`);
        // Add user ID to job data
        const jobData = {
            ...submission.data,
            userId
        };
        // Use provided options or default options
        const options = submission.options || defaultOptions;
        // Create a unique ID for the scheduler
        const schedulerId = `${userId}-${submission.name}-${Date.now()}`;
        // Extract scheduling options
        const { cron, repeat, startDate, endDate, tz } = submission.schedule;
        // Create repeat options for the scheduler
        const repeatOpts = {};
        if (cron) {
            repeatOpts.pattern = cron;
            if (tz)
                repeatOpts.tz = tz;
        }
        else if (repeat?.every) {
            repeatOpts.every = repeat.every;
            if (repeat.limit)
                repeatOpts.limit = repeat.limit;
        }
        if (startDate)
            repeatOpts.startDate = startDate;
        if (endDate)
            repeatOpts.endDate = endDate;
        // Schedule the job
        const job = await jobScheduler.upsertJobScheduler(schedulerId, repeatOpts, submission.name, jobData, options, { override: true });
        logger.debug(`repeatOpts ${JSON.stringify(repeatOpts)}`);
        logger.debug(`submission.name ${submission.name}`);
        logger.debug(`jobData ${JSON.stringify(jobData)}`);
        logger.debug(`options : ${JSON.stringify(options)}`);
        logger.info(`Job scheduled: ${schedulerId}`);
        logger.debug(`==================`);
        return schedulerId;
    }
    /**
     * Get all scheduled jobs for a user
     */
    async getUserScheduledJobs(userId) {
        logger.info(`Getting scheduled jobs for user ${userId}`);
        try {
            // Get all schedulers
            logger.debug(`Calling schedulerService.getJobSchedulers()`);
            const schedulers = await jobScheduler.getJobSchedulers();
            // Log the retrieved schedulers for debugging
            logger.debug(`Retrieved ${schedulers.length} scheduled jobs`);
            if (schedulers.length > 0) {
                logger.debug(`First scheduler ID: ${schedulers[0]?.key || 'undefined'}`);
            }
            // Filter schedulers by user ID
            const userSchedulers = schedulers.filter(scheduler => {
                const hasId = scheduler && scheduler.key && typeof scheduler.key === 'string';
                const startsWithUserId = hasId && scheduler.key && scheduler.key.startsWith(`${userId}-`);
                if (hasId) {
                    logger.debug(`Checking scheduler ID: ${scheduler.key}, matches user: ${startsWithUserId}`);
                }
                else {
                    logger.debug(`Scheduler has invalid ID: ${JSON.stringify(scheduler)}`);
                }
                return hasId && startsWithUserId;
            });
            logger.info(`Filtered ${userSchedulers.length} schedulers for user ${userId}`);
            if (userSchedulers.length > 0) {
                logger.debug(`User schedulers: ${userSchedulers.map(s => s.key).join(', ')}`);
            }
            else {
                logger.debug(`No schedulers found for user ${userId}`);
            }
            return userSchedulers;
        }
        catch (error) {
            logger.error(`Error retrieving scheduled jobs for user ${userId}:`, error);
            // Return empty array instead of throwing error
            return [];
        }
    }
    /**
     * Get a specific scheduled job
     */
    async getScheduledJob(schedulerId, userId) {
        logger.info(`Getting scheduled job ${schedulerId}`);
        const scheduler = await jobScheduler.getScheduler(schedulerId);
        if (!scheduler) {
            logger.warn(`Scheduled job ${schedulerId} not found`);
            return null;
        }
        // Ensure user can only access their own scheduled jobs
        // Check if the scheduler ID starts with the user ID
        if (!schedulerId.startsWith(`${userId}-`)) {
            logger.warn(`Unauthorized access to scheduled job ${schedulerId} by user ${userId}`);
            return null;
        }
        return scheduler;
    }
    /**
     * Remove a scheduled job
     */
    async removeScheduledJob(schedulerId, userId) {
        logger.info(`Removing scheduled job ${schedulerId}`);
        // First check if the scheduler exists and belongs to the user
        const scheduler = await this.getScheduledJob(schedulerId, userId);
        if (!scheduler) {
            return false;
        }
        // Remove the scheduler
        await jobScheduler.removeJobScheduler(schedulerId);
        logger.info(`Scheduled job ${schedulerId} removed`);
        return true;
    }
}
export default new SchedulerService();
