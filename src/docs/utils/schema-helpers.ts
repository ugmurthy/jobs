import { BULLMQ_JOB_STATUSES } from '../../types/bullmq-statuses.js';
import { WEBHOOK_EVENT_TYPES } from '../../types/webhook-events.js';

/**
 * Utility functions for generating OpenAPI schema enums
 */
export const SchemaHelpers = {
  /**
   * Get BullMQ job statuses as a formatted string for OpenAPI enum
   * Filters out 'stuck' as it's not a standard BullMQ JobType
   */
  getBullMQJobStatusesEnum(): string {
    const validStatuses = BULLMQ_JOB_STATUSES.filter(status => status !== 'stuck');
    return `[${validStatuses.join(', ')}]`;
  },

  /**
   * Get webhook event types as a formatted string for OpenAPI enum
   */
  getWebhookEventTypesEnum(): string {
    return `[${WEBHOOK_EVENT_TYPES.join(', ')}]`;
  },

  /**
   * Get BullMQ job statuses as an array (filtered)
   */
  getBullMQJobStatusesArray(): readonly string[] {
    return BULLMQ_JOB_STATUSES.filter(status => status !== 'stuck');
  },

  /**
   * Get webhook event types as an array
   */
  getWebhookEventTypesArray(): readonly string[] {
    return WEBHOOK_EVENT_TYPES;
  },
};