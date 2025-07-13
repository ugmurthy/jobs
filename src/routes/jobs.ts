import { Router, Request, Response } from 'express';
import { logger } from '@ugm/logger';
//import { authenticateToken } from '../middleware/auth.js';
import { jobQueue, defaultOptions } from '../config/bull.js';
import { authenticate } from '../middleware/combinedAuth.js';
const router = Router();

/**
 * Validates if the provided options is a valid JSON object
 */
function isValidOptions(options: unknown): boolean {
  // Check if options is an object and not null
  if (typeof options !== 'object' || options === null) {
    return false;
  }
  
  try {
    // Try to stringify and parse to ensure it's a valid JSON object
    JSON.parse(JSON.stringify(options));
    logger.debug(`options : ${JSON.stringify(options)}`);
    return true;
  } catch (error) {
    logger.error("Invalid options", options);
    return false;
  }
}

/**
 * Submit a new job
 */
router.post('/submit', authenticate, async (req: Request, res: Response) => {
  const requestedJob = req.body;

  logger.info(`/submit REQUESTED BY: ${JSON.stringify(req.user)}`);
  logger.debug(`/submit name: ${requestedJob.name}`); 
  logger.debug(`/submit data: ${JSON.stringify(requestedJob.data)}`);
  
  // Check if options are provided in the request
  let jobOptions = defaultOptions;
  if (requestedJob.options) {
    // Validate the provided options
    if (isValidOptions(requestedJob.options)) {
      jobOptions = requestedJob.options;
      logger.info("Using custom options provided in the request");
    } else {
      logger.warn("Invalid options provided, using default options");
    }
  } else {
    logger.info("No options provided, using default options");
  }
  
  const jobData = {
    ...requestedJob.data,
    userId: req.user?.userId
  };
  
  const job = await jobQueue.add(requestedJob.name, jobData, jobOptions);
  logger.debug(`/submit: jobData: ${JSON.stringify(jobData)}`); 
  logger.info(`/submit: JOB SCHEDULED : ${job.id}/${requestedJob.name}`);
  
  res.json({ jobId: job.id });
});

/**
 * Get status of a specific job
 */
router.get('/:jobId', authenticate, async (req: Request, res: Response, next: Function) => {
  try {
    // Skip this route handler if the jobId is 'schedule' - it will be handled by the scheduler routes
    if (req.params.jobId === 'schedule') {
      logger.debug('Skipping jobs route for /schedule path - will be handled by scheduler routes');
      return next();
    }

    const { jobId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    
    logger.debug(`Getting job with ID: ${jobId}`);
    const job = await jobQueue.getJob(jobId);
    
    if (!job) {
      logger.warn(`Job not found with ID: ${jobId}`);
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    
    // Ensure user can only access their own jobs
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
  } catch (error) {
    logger.error('Job status error:', error);
    res.status(500).json({ message: 'An error occurred while fetching job status' });
  }
});

/**
 * Get all jobs for the authenticated user
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    // Log that we're hitting the root jobs route
    logger.info('GET /jobs route hit');
    
    const userId = req.user?.userId;
    logger.debug(`User ID from request: ${userId}`);
    
    if (!userId) {
      logger.warn('No user ID found in request');
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    
    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Filter parameters
    const status = req.query.status as string; // 'completed', 'failed', 'delayed', 'active', 'waiting', 'paused', 'stuck'
    
    // Get jobs from the queue
    let jobs;
    const validStatuses = ['completed', 'failed', 'delayed', 'active', 'waiting', 'paused', 'stuck'];
    if (status) {
      // Map string status to JobType
      if (validStatuses.includes(status as any)) {
        jobs = await jobQueue.getJobs([status as any]);
      } else {
        res.status(400).json({ message: 'Invalid status parameter' });
        return;
      }
    } else {
      jobs = await jobQueue.getJobs(validStatuses as any);
    }
    
    // Filter jobs by user ID
    const filteredJobs = jobs.filter((job: any) => job.data.userId === userId);
    
    // Apply pagination
    const paginatedJobs = filteredJobs.slice(skip, skip + limit);
    
    // Format response
    const jobsData = await Promise.all(paginatedJobs.map(async (job: any) => {
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
  } catch (error) {
    logger.error('Jobs list error:', error);
    res.status(500).json({ message: 'An error occurred while fetching jobs' });
  }
});

/**
 * Delete a specific job
 */
router.delete('/:jobId', authenticate, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    
    logger.debug(`Deleting job with ID: ${jobId}`);
    const job = await jobQueue.getJob(jobId);
    
    if (!job) {
      logger.warn(`Job not found with ID: ${jobId}`);
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    
    // Ensure user can only delete their own jobs
    if (job.data.userId !== userId) {
      res.status(403).json({ message: 'Unauthorized access to job' });
      return;
    }
    
    // Remove the job from the queue
    await job.remove();
    
    res.json({
      message: 'Job deleted successfully',
      id: jobId
    });
  } catch (error) {
    logger.error('Job deletion error:', error);
    res.status(500).json({ message: 'An error occurred while deleting the job' });
  }
});

export default router;