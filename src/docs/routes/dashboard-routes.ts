/**
 * @openapi
 * tags:
 *   name: Dashboard
 *   description: Dashboard statistics and data
 */

/**
 * @openapi
 * /dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jobStats:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of jobs
 *                       example: 1250
 *                     active:
 *                       type: integer
 *                       description: Number of active jobs
 *                       example: 8
 *                     delayed:
 *                       type: integer
 *                       description: Number of delayed jobs
 *                       example: 15
 *                     paused:
 *                       type: integer
 *                       description: Number of paused jobs
 *                       example: 2
 *                     waiting-children:
 *                       type: integer
 *                       description: Number of jobs waiting for children
 *                       example: 1
 *                     completed:
 *                       type: integer
 *                       description: Number of completed jobs
 *                       example: 1180
 *                     failed:
 *                       type: integer
 *                       description: Number of failed jobs
 *                       example: 47
 *                     completionRate:
 *                       type: number
 *                       description: Job completion rate percentage
 *                       example: 94.4
 *                 recentJobs:
 *                   type: array
 *                   description: List of recent jobs
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: Job ID
 *                         example: "job-123456"
 *                       name:
 *                         type: string
 *                         description: Job name
 *                         example: "Data Export"
 *                       status:
 *                         type: string
 *                         description: Job status (from BULLMQ_JOB_STATUSES, excluding 'stuck')
 *                         enum: [completed, failed, delayed, active, waiting, waiting-children, paused]
 *                         example: "completed"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Job creation timestamp
 *                         example: "2025-07-06T12:30:45Z"
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *                         description: Job completion timestamp
 *                         example: "2025-07-06T12:35:12Z"
 *                       duration:
 *                         type: integer
 *                         description: Job duration in seconds
 *                         example: 267
 *                 schedulerStats:
 *                   type: object
 *                   properties:
 *                     activeSchedules:
 *                       type: integer
 *                       description: Number of active scheduled jobs
 *                       example: 8
 *                     totalSchedules:
 *                       type: integer
 *                       description: Total number of scheduled jobs
 *                       example: 12
 *                     nextScheduledJob:
 *                       type: string
 *                       format: date-time
 *                       description: Next scheduled job timestamp
 *                       example: "2025-07-06T18:00:00Z"
 *                 webhookStats:
 *                   type: object
 *                   properties:
 *                     totalWebhooks:
 *                       type: integer
 *                       description: Total number of webhooks
 *                       example: 15
 *                     activeWebhooks:
 *                       type: integer
 *                       description: Number of active webhooks
 *                       example: 12
 *                     deliveryRate:
 *                       type: number
 *                       description: Webhook delivery success rate percentage
 *                       example: 98.5
 *                     totalDeliveries:
 *                       type: integer
 *                       description: Total number of webhook deliveries
 *                       example: 1250
 *                     failedDeliveries:
 *                       type: integer
 *                       description: Number of failed webhook deliveries
 *                       example: 19
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Export an empty object to make this file a valid module
export {};