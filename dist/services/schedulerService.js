import { logger } from '@ugm/logger';
import { getJobScheduler, defaultOptions } from '../config/bull.js';
class SchedulerService {
    /**
     * Schedule a new job
     */
    async scheduleJob(queueName, submission, userId) {
        logger.debug(`===================`);
        logger.info(`schedulerService : Scheduling job: (${submission.name}) for user (${userId}) in queue (${queueName})`);
        const jobData = {
            ...submission.data,
            userId
        };
        const options = submission.options || defaultOptions;
        const schedulerId = `${userId}-${submission.name}-${Date.now()}`;
        const { cron, repeat, startDate, endDate, tz } = submission.schedule;
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
        const jobScheduler = getJobScheduler(queueName);
        const job = await jobScheduler.upsertJobScheduler(schedulerId, repeatOpts, submission.name, jobData, options, { override: true });
        logger.debug(`repeatOpts ${JSON.stringify(repeatOpts)}`);
        logger.debug(`submission.name ${submission.name}`);
        logger.debug(`jobData ${JSON.stringify(jobData)}`);
        logger.debug(`options : ${JSON.stringify(options)}`);
        logger.info(`Job scheduled: ${schedulerId} in queue ${queueName}`);
        logger.debug(`==================`);
        return schedulerId;
    }
    /**
     * Get all scheduled jobs for a user
     */
    async getUserScheduledJobs(queueName, userId) {
        logger.info(`Getting scheduled jobs for user ${userId} from queue ${queueName}`);
        try {
            const jobScheduler = getJobScheduler(queueName);
            logger.debug(`Calling schedulerService.getJobSchedulers() from queue ${queueName}`);
            const schedulers = await jobScheduler.getJobSchedulers();
            logger.debug(`Retrieved ${schedulers.length} scheduled jobs from queue ${queueName}`);
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
    async getScheduledJob(queueName, schedulerId, userId) {
        logger.info(`Getting scheduled job ${schedulerId} from queue ${queueName}`);
        const jobScheduler = getJobScheduler(queueName);
        const scheduler = await jobScheduler.getScheduler(schedulerId);
        if (!scheduler) {
            logger.warn(`Scheduled job ${schedulerId} not found in queue ${queueName}`);
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
    async removeScheduledJob(queueName, schedulerId, userId) {
        logger.info(`Removing scheduled job ${schedulerId} from queue ${queueName}`);
        const scheduler = await this.getScheduledJob(queueName, schedulerId, userId);
        if (!scheduler) {
            return false;
        }
        const jobScheduler = getJobScheduler(queueName);
        await jobScheduler.removeJobScheduler(schedulerId);
        logger.info(`Scheduled job ${schedulerId} removed from queue ${queueName}`);
        return true;
    }
}
export default new SchedulerService();
