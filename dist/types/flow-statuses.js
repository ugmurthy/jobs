/**
 * Flow-specific statuses that map to BullMQ job statuses
 */
export const FLOW_STATUSES = [
    "pending",
    "running",
    "completed",
    "failed",
    "cancelled", // Flow was manually cancelled
];
/**
 * Mapping between BullMQ job statuses and flow statuses
 */
export const FlowStatusMapper = {
    /**
     * Determine flow status based on job statuses
     */
    determineFlowStatus(jobStatuses) {
        if (jobStatuses.length === 0)
            return "pending";
        const hasActive = jobStatuses.some((status) => ["active", "waiting", "delayed", "waiting-children"].includes(status));
        const hasFailed = jobStatuses.some((status) => status === "failed");
        const allCompleted = jobStatuses.every((status) => status === "completed");
        if (hasFailed)
            return "failed";
        if (allCompleted)
            return "completed";
        if (hasActive)
            return "running";
        return "pending";
    },
};
