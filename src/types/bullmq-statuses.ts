/**
 * SINGLE SOURCE OF TRUTH for all BullMQ job statuses
 * This is the definitive list that must be imported and used everywhere
 * DO NOT duplicate these statuses in other files
 */
export const BULLMQ_JOB_STATUSES = [
  "completed", // The job has been successfully processed
  "failed", // The job has failed during processing
  "delayed", // The job is scheduled for later processing
  "active", // The job is currently being processed by a worker
  "waiting", // The job is in the queue, waiting to be processed
  "waiting-children", // The parent job is waiting for its child jobs to complete
  "paused", // The job is in a paused queue and won't process until resumed
  "stuck", // The job is in an undefined state (worker crashes, Redis issues)
] as const;

/**
 * TypeScript type for BullMQ job statuses
 */
export type BullMQJobStatus = (typeof BULLMQ_JOB_STATUSES)[number];

/**
 * Utility functions for status validation and filtering
 */
export const JobStatusUtils = {
  /**
   * Check if a status is valid
   */
  isValidStatus(status: string): status is BullMQJobStatus {
    return BULLMQ_JOB_STATUSES.includes(status as BullMQJobStatus);
  },

  /**
   * Get all statuses
   */
  getAllStatuses(): readonly BullMQJobStatus[] {
    return BULLMQ_JOB_STATUSES;
  },

  /**
   * Get statuses for active monitoring (excludes stuck)
   */
  getActiveStatuses(): readonly BullMQJobStatus[] {
    return BULLMQ_JOB_STATUSES.filter((status) => status !== "stuck");
  },

  /**
   * Get completed statuses (final states)
   */
  getFinalStatuses(): readonly BullMQJobStatus[] {
    return ["completed", "failed"] as const;
  },

  /**
   * Get processing statuses (non-final states)
   */
  getProcessingStatuses(): readonly BullMQJobStatus[] {
    return [
      "active",
      "waiting",
      "delayed",
      "waiting-children",
      "paused",
    ] as const;
  },

  /**
   * Check if status indicates job is in progress
   */
  isProcessing(status: BullMQJobStatus): boolean {
    return this.getProcessingStatuses().includes(status);
  },

  /**
   * Check if status indicates job is complete
   */
  isFinal(status: BullMQJobStatus): boolean {
    return this.getFinalStatuses().includes(status);
  },
};