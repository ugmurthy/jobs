/**
 * @openapi
 * tags:
 *   name: Jobs
 *   description: Job management and processing
 */

/**
 * @openapi
 * /jobs/{queueName}/submit:
 *   post:
 *     summary: Submit a new job
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: queueName
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the queue to submit the job to
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobSubmitRequest'
 *     responses:
 *       201:
 *         description: Job submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JobResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /jobs/{queueName}/job/{jobId}:
 *   get:
 *     summary: Get status of a specific job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the queue
 *       - in: path
 *         name: jobId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the job to get
 *     responses:
 *       200:
 *         description: Job details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Job'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete a specific job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the queue
 *       - in: path
 *         name: jobId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the job to delete
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Job deleted successfully"
 *                 id:
 *                   type: string
 *                   description: ID of the deleted job
 *                   example: "123456789"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - User does not own this job
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * 
 * /jobs/{queueName}:
 *   get:
 *     summary: Get all jobs for the authenticated user
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the queue
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, delayed, completed, failed, paused, waiting-children]
 *         description: Filter jobs by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of jobs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of jobs to skip
 *     responses:
 *       200:
 *         description: Jobs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total number of jobs matching the criteria
 *                 jobs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/JobResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /jobs/{queueName}/schedule:
 *   post:
 *     summary: Schedule a new job
 *     description: Schedule a job to run at specified times using cron expressions or intervals
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the queue
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScheduleJobRequest'
 *     responses:
 *       200:
 *         description: Job scheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 schedulerId:
 *                   type: string
 *                   description: ID of the scheduled job
 *                   example: "1-dataExport-1625097600000"
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     summary: Get all scheduled jobs
 *     description: Get all scheduled jobs for the authenticated user
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the queue
 *     responses:
 *       200:
 *         description: List of scheduled jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scheduledJobs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ScheduledJob'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *
 * /jobs/{queueName}/schedule/{schedulerId}:
 *   get:
 *     summary: Get a specific scheduled job
 *     description: Get details of a specific scheduled job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the queue
 *       - in: path
 *         name: schedulerId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the scheduled job
 *     responses:
 *       200:
 *         description: Scheduled job details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScheduledJob'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Scheduled job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Remove a scheduled job
 *     description: Remove a specific scheduled job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: queueName
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the queue
 *       - in: path
 *         name: schedulerId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the scheduled job
 *     responses:
 *       200:
 *         description: Scheduled job removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Scheduled job removed successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Scheduled job not found or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Export an empty object to make this file a valid module
export {};