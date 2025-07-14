/**
 * @openapi
 * tags:
 *   name: Queues
 *   description: Operations related to job queues
 */

/**
 * @openapi
 * /queues:
 *   get:
 *     summary: Get a list of available queue names
 *     tags: [Queues]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: A list of queue names.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 queues:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["jobQueue", "webhooks", "schedQueue"]
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Export an empty object to make this file a valid module
export {};