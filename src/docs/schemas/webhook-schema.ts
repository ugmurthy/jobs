/**
 * @openapi
 * components:
 *   schemas:
 *     Webhook:
 *       type: object
 *       required:
 *         - url
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated unique identifier
 *           example: "webhook_123456"
 *         url:
 *           type: string
 *           format: uri
 *           description: Webhook URL
 *           example: "https://example.com/webhooks/callback"
 *         events:
 *           type: array
 *           items:
 *             type: string
 *           description: Events to trigger this webhook
 *           example: ["job.completed", "job.failed"]
 *         active:
 *           type: boolean
 *           description: Whether the webhook is active
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           example: "2025-06-28T12:00:00Z"
 *
 *     WebhookCreateRequest:
 *       type: object
 *       required:
 *         - url
 *       properties:
 *         url:
 *           type: string
 *           format: uri
 *           description: Webhook URL
 *           example: "https://example.com/webhooks/callback"
 *         events:
 *           type: array
 *           items:
 *             type: string
 *           description: Events to trigger this webhook
 *           example: ["job.completed", "job.failed"]
 *         active:
 *           type: boolean
 *           description: Whether the webhook is active
 *           default: true
 *           example: true
 *
 *     WebhookUpdateRequest:
 *       type: object
 *       properties:
 *         url:
 *           type: string
 *           format: uri
 *           description: Webhook URL
 *           example: "https://example.com/webhooks/callback"
 *         events:
 *           type: array
 *           items:
 *             type: string
 *           description: Events to trigger this webhook
 *           example: ["job.completed", "job.failed"]
 *         active:
 *           type: boolean
 *           description: Whether the webhook is active
 *           example: true
 *
 *     WebhookResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated unique identifier
 *           example: "webhook_123456"
 *         url:
 *           type: string
 *           format: uri
 *           description: Webhook URL
 *           example: "https://example.com/webhooks/callback"
 *         events:
 *           type: array
 *           items:
 *             type: string
 *           description: Events to trigger this webhook
 *           example: ["job.completed", "job.failed"]
 *         active:
 *           type: boolean
 *           description: Whether the webhook is active
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           example: "2025-06-28T12:00:00Z"
 */

// Export an empty object to make this file a valid module
export {};