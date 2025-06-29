/**
 * @openapi
 * tags:
 *   name: Admin
 *   description: Administrative endpoints and dashboard
 */

/**
 * @openapi
 * /admin:
 *   get:
 *     summary: Bull Board UI for queue monitoring
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Bull Board UI HTML page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 * 
 * /admin/dashboard:
 *   get:
 *     summary: Admin dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalJobs:
 *                       type: integer
 *                       description: Total number of jobs
 *                       example: 1250
 *                     activeJobs:
 *                       type: integer
 *                       description: Number of active jobs
 *                       example: 25
 *                     completedJobs:
 *                       type: integer
 *                       description: Number of completed jobs
 *                       example: 1200
 *                     failedJobs:
 *                       type: integer
 *                       description: Number of failed jobs
 *                       example: 25
 *                     totalUsers:
 *                       type: integer
 *                       description: Total number of users
 *                       example: 100
 *                     totalWebhooks:
 *                       type: integer
 *                       description: Total number of webhooks
 *                       example: 50
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Export an empty object to make this file a valid module
export {};