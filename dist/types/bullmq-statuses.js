/**
 * SINGLE SOURCE OF TRUTH for all BullMQ job statuses
 * This is the definitive list that must be imported and used everywhere
 * DO NOT duplicate these statuses in other files
 */
export const BULLMQ_JOB_STATUSES = [
    "completed",
    "failed",
    "delayed",
    "active",
    "waiting",
    "waiting-children",
    "paused",
    "stuck", // The job is in an undefined state (worker crashes, Redis issues)
];
/**
 * Utility functions for status validation and filtering
 */
export const JobStatusUtils = {
    /**
     * Check if a status is valid
     */
    isValidStatus(status) {
        return BULLMQ_JOB_STATUSES.includes(status);
    },
    /**
     * Get all statuses
     */
    getAllStatuses() {
        return BULLMQ_JOB_STATUSES;
    },
    /**
     * Get statuses for active monitoring (excludes stuck)
     */
    getActiveStatuses() {
        return BULLMQ_JOB_STATUSES.filter((status) => status !== "stuck");
    },
    /**
     * Get completed statuses (final states)
     */
    getFinalStatuses() {
        return ["completed", "failed"];
    },
    /**
     * Get processing statuses (non-final states)
     */
    getProcessingStatuses() {
        return [
            "active",
            "waiting",
            "delayed",
            "waiting-children",
            "paused",
        ];
    },
    /**
     * Check if status indicates job is in progress
     */
    isProcessing(status) {
        return this.getProcessingStatuses().includes(status);
    },
    /**
     * Check if status indicates job is complete
     */
    isFinal(status) {
        return this.getFinalStatuses().includes(status);
    },
};
