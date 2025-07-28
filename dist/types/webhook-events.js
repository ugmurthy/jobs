/**
 * Valid webhook event types
 * Single source of truth for webhook events
 */
export const WEBHOOK_EVENT_TYPES = [
    "progress",
    "completed",
    "failed",
    "delta",
    "all", // All events
];
export const WebhookEventUtils = {
    isValidEventType(eventType) {
        return WEBHOOK_EVENT_TYPES.includes(eventType);
    },
    getAllEventTypes() {
        return WEBHOOK_EVENT_TYPES;
    },
};
