import { logger } from '@ugm/logger';
import { jobQueue, defaultOptions } from '../config/bull';

/**
 * Interface for job data
 */
export interface JobData {
  userId: number;
  [key: string]: any;
}

/**
 * Interface for job submission
 */
export interface JobSubmission {
  name: string;
  data: JobData;
  options?: any;
}

/**
 * Interface for job status
 */
export interface JobStatus {
  id: string;
  name: string;
  state: string;
  progress: number;
  result?: any;
  failedReason?: string;
  timestamp: {
    created: number;
    started?: number;
    finished?: number;
  };
}

/**
 * Service for job-related operations
 */
class JobService {
  /**
   * Submit a new job
   */
  async submitJob(submission: JobSubmission): Promise<string> {
    logger.info(`Submitting job: ${submission.name} for user ${submission.data.userId}`);
    
    // Use provided options or default options
    const options = submission.options || defaultOptions;
    
    // Add job to queue
    const job = await jobQueue.add(submission.name, submission.data, options);
    
    logger.info(`Job scheduled: ${job.id}/${submission.name}`);
    return job.id as string;
  }

  /**
   * Get job status by ID
   */
  async getJobStatus(jobId: string, userId: number): Promise<JobStatus | null> {
    logger.info(`Getting status for job ${jobId}`);
    
    const job = await jobQueue.getJob(jobId);
    
    if (!job) {
      logger.warn(`Job ${jobId} not found`);
      return null;
    }
    
    // Ensure user can only access their own jobs
    if (job.data.userId !== userId) {
      logger.warn(`Unauthorized access to job ${jobId} by user ${userId}`);
      return null;
    }
    
    const state = await job.getState();
    
    return {
      id: job.id,
      name: job.name,
      state,
      progress: job.progress || 0,
      result: job.returnvalue,
      failedReason: job.failedReason,
      timestamp: {
        created: job.timestamp,
        started: job.processedOn,
        finished: job.finishedOn
      }
    };
  }

  /**
   * Get all jobs for a user
   */
  async getUserJobs(userId: number, options: { status?: string, page?: number, limit?: number } = {}): Promise<{ jobs: JobStatus[], pagination: any }> {
    logger.info(`Getting jobs for user ${userId}`);
    
    // Pagination parameters
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    
    // Get jobs from the queue
    let jobs;
    if (options.status) {
      // Map string status to JobType
      const validStatuses = ['completed', 'failed', 'active', 'waiting', 'delayed'] as const;
      if (validStatuses.includes(options.status as any)) {
        jobs = await jobQueue.getJobs([options.status as any]);
      } else {
        logger.warn(`Invalid status parameter: ${options.status}`);
        jobs = [];
      }
    } else {
      jobs = await jobQueue.getJobs(['completed', 'failed', 'active', 'waiting', 'delayed']);
    }
    
    // Filter jobs by user ID
    const filteredJobs = jobs.filter(job => job.data.userId === userId);
    
    // Apply pagination
    const paginatedJobs = filteredJobs.slice(skip, skip + limit);
    
    // Format response
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
    
    return {
      jobs: jobsData,
      pagination: {
        total: filteredJobs.length,
        page,
        limit,
        pages: Math.ceil(filteredJobs.length / limit)
      }
    };
  }
}

export default new JobService();