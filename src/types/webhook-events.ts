/**
 * Valid webhook event types
 * Single source of truth for webhook events
 */
export const WEBHOOK_EVENT_TYPES = [
  "progress", // Job progress updates
  "completed", // Job completed successfully
  "failed", // Job failed
  "delta", // Job state changes
  "all", // All events
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export const WebhookEventUtils = {
  isValidEventType(eventType: string): eventType is WebhookEventType {
    return WEBHOOK_EVENT_TYPES.includes(eventType as WebhookEventType);
  },

  getAllEventTypes(): readonly WebhookEventType[] {
    return WEBHOOK_EVENT_TYPES;
  },
};