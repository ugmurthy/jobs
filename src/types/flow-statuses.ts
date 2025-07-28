import { BullMQJobStatus } from './bullmq-statuses.js';

/**
 * Flow-specific statuses that map to BullMQ job statuses
 */
export const FLOW_STATUSES = [
  "pending", // Flow created but not started
  "running", // Flow is actively processing
  "completed", // All jobs in flow completed successfully
  "failed", // One or more jobs in flow failed
  "cancelled", // Flow was manually cancelled
] as const;

export type FlowStatus = (typeof FLOW_STATUSES)[number];

/**
 * Mapping between BullMQ job statuses and flow statuses
 */
export const FlowStatusMapper = {
  /**
   * Determine flow status based on job statuses
   */
  determineFlowStatus(jobStatuses: BullMQJobStatus[]): FlowStatus {
    if (jobStatuses.length === 0) return "pending";

    const hasActive = jobStatuses.some((status) =>
      ["active", "waiting", "delayed", "waiting-children"].includes(status)
    );
    const hasFailed = jobStatuses.some((status) => status === "failed");
    const allCompleted = jobStatuses.every((status) => status === "completed");

    if (hasFailed) return "failed";
    if (allCompleted) return "completed";
    if (hasActive) return "running";

    return "pending";
  },
};