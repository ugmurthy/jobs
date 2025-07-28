import { Router } from 'express';
import { logger } from '@ugm/logger';
import { getQueue, defaultOptions } from '../config/bull.js';
import { authenticate } from '../middleware/combinedAuth.js';
import { validateQueue } from '../middleware/validateQueue.js';
import { BULLMQ_JOB_STATUSES, JobStatusUtils, } from '../types/bullmq-statuses.js';
const router = Router();
/**
 * Validates if the provided options is a valid JSON object
 */
function isValidOptions(options) {
    // Check if options is an object and not null
    if (typeof options !== 'object' || options === null) {
        return false;
    }
    try {
        // Try to stringify and parse to ensure it's a valid JSON object
        JSON.parse(JSON.stringify(options));
        logger.debug(`options : ${JSON.stringify(options)}`);
        return true;
    }
    catch (error) {
        logger.error("Invalid options", options);
        return false;
    }
}
/**
 * Submit a new job
 */
router.post('/:queueName/submit', authenticate, validateQueue, async (req, res, next) => {
    try {
        const { queueName } = req.params;
        const requestedJob = req.body;
        logger.info(`/${queueName}/submit REQUESTED BY: ${JSON.stringify(req.user)}`);
        logger.debug(`/${queueName}/submit name: ${requestedJob.name}`);
        logger.debug(`/${queueName}/submit data: ${JSON.stringify(requestedJob.data)}`);
        let jobOptions = defaultOptions;
        if (requestedJob.options) {
            if (isValidOptions(requestedJob.options)) {
                jobOptions = requestedJob.options;
                logger.info("Using custom options provided in the request");
            }
            else {
                logger.warn("Invalid options provided, using default options");
            }
        }
        else {
            logger.info("No options provided, using default options");
        }
        const jobData = {
            ...requestedJob.data,
            userId: req.user?.userId
        };
        const jobQueue = getQueue(queueName);
        const job = await jobQueue.add(requestedJob.name, jobData, jobOptions);
        logger.debug(`/${queueName}/submit: jobData: ${JSON.stringify(jobData)}`);
        logger.info(`/${queueName}/submit: JOB SCHEDULED : ${job.id}/${requestedJob.name}`);
        res.json({ jobId: job.id });
    }
    catch (error) {
        next(error);
    }
});
/**
 * Get status of a specific job
 */
router.get('/:queueName/job/:jobId', authenticate, validateQueue, async (req, res, next) => {
    try {
        const { queueName, jobId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        logger.debug(`Getting job with ID: ${jobId} from queue: ${queueName}`);
        const jobQueue = getQueue(queueName);
        const job = await jobQueue.getJob(jobId);
        if (!job) {
            logger.warn(`Job not found with ID: ${jobId} in queue: ${queueName}`);
            res.status(404).json({ message: 'Job not found' });
            return;
        }
        if (job.data.userId !== userId) {
            res.status(403).json({ message: 'Unauthorized access to job' });
            return;
        }
        const state = await job.getState();
        const progress = job.progress || 0;
        const result = job.returnvalue;
        const failedReason = job.failedReason;
        res.json({
            id: job.id,
            name: job.name,
            state,
            progress,
            result,
            failedReason,
            timestamp: {
                created: job.timestamp,
                started: job.processedOn,
                finished: job.finishedOn
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * Get all jobs for the authenticated user
 */
router.get('/:queueName', authenticate, validateQueue, async (req, res, next) => {
    try {
        const { queueName } = req.params;
        logger.info(`GET /jobs/${queueName} route hit`);
        const userId = req.user?.userId;
        logger.debug(`User ID from request: ${userId}`);
        if (!userId) {
            logger.warn('No user ID found in request');
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status;
        const jobQueue = getQueue(queueName);
        let jobs;
        if (status) {
            if (JobStatusUtils.isValidStatus(status)) {
                jobs = await jobQueue.getJobs([status]);
            }
            else {
                res.status(400).json({ message: 'Invalid status parameter' });
                return;
            }
        }
        else {
            // Use all valid statuses (filter out 'stuck' as it's not a standard BullMQ JobType)
            const validJobTypes = BULLMQ_JOB_STATUSES.filter(status => status !== 'stuck');
            jobs = await jobQueue.getJobs(validJobTypes);
        }
        const filteredJobs = jobs.filter((job) => job.data.userId === userId);
        const paginatedJobs = filteredJobs.slice(skip, skip + limit);
        const jobsData = await Promise.all(paginatedJobs.map(async (job) => {
            const state = await job.getState();
            return {
                id: job.id,
                name: job.name,
                state,
                progress: job.progress || 0,
                timestamp: {
                    created: job.timestamp,
                    started: job.processedOn,
                    finished: job.finishedOn
                }
            };
        }));
        res.json({
            jobs: jobsData,
            pagination: {
                total: filteredJobs.length,
                page,
                limit,
                pages: Math.ceil(filteredJobs.length / limit)
            }
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * Delete a specific job
 */
router.delete('/:queueName/job/:jobId', authenticate, validateQueue, async (req, res, next) => {
    try {
        const { queueName, jobId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        logger.debug(`Deleting job with ID: ${jobId} from queue: ${queueName}`);
        const jobQueue = getQueue(queueName);
        const job = await jobQueue.getJob(jobId);
        if (!job) {
            logger.warn(`Job not found with ID: ${jobId} from queue: ${queueName}`);
            res.status(404).json({ message: 'Job not found' });
            return;
        }
        if (job.data.userId !== userId) {
            res.status(403).json({ message: 'Unauthorized access to job' });
            return;
        }
        await job.remove();
        res.json({
            message: 'Job deleted successfully',
            id: jobId
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
