/**
 * @openapi
 * tags:
 *   name: Flows
 *   description: BullMQ flow management
 */

/**
 * @openapi
 * /flows:
 *   post:
 *     summary: Create a new BullMQ flow
 *     tags: [Flows]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFlowRequest'
 *     responses:
 *       '201':
 *         description: Flow created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FlowResponse'
 *       '400':
 *         description: Invalid request body.
 *       '500':
 *         description: Internal server error.
 *   get:
 *     summary: Get a list of all flows
 *     tags: [Flows]
 *     responses:
 *       '200':
 *         description: A list of flows.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FlowResponse'
 *       '500':
 *         description: Internal server error.
 */

/**
 * @openapi
 * /flows/{flowId}:
 *   get:
 *     summary: Get a single flow by its ID
 *     tags: [Flows]
 *     parameters:
 *       - in: path
 *         name: flowId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the flow.
 *     responses:
 *       '200':
 *         description: The flow details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FlowResponse'
 *       '404':
 *         description: Flow not found.
 *       '500':
 *         description: Internal server error.
 */

/**
 * @openapi
 * /flows/{flowId}/jobs:
 *   get:
 *     summary: Get flow definition in CreateFlowRequest format
 *     description: Returns the original flow definition that was used to create the flow, in the same format as CreateFlowRequest
 *     tags: [Flows]
 *     parameters:
 *       - in: path
 *         name: flowId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the flow.
 *     responses:
 *       '200':
 *         description: The original flow definition in CreateFlowRequest format.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateFlowRequest'
 *       '404':
 *         description: Flow not found.
 *       '500':
 *         description: Internal server error.
 */

/**
 * @openapi
 * /flows/{flowId}/jobs/{jobId}:
 *   put:
 *     summary: Update flow job status
 *     description: Update the status of a specific job within a flow
 *     tags: [Flows]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: flowId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the flow.
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: The BullMQ job ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FlowUpdateRequest'
 *     responses:
 *       '200':
 *         description: Flow job status updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Flow updated successfully"
 *       '400':
 *         description: Invalid request body.
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Flow or job not found.
 *       '500':
 *         description: Internal server error.
 */

/**
 * @openapi
 * /flows/{flowId}/progress:
 *   get:
 *     summary: Get detailed flow progress
 *     description: Get detailed progress information for all jobs in a flow
 *     tags: [Flows]
 *     parameters:
 *       - in: path
 *         name: flowId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the flow.
 *     responses:
 *       '200':
 *         description: Detailed flow progress information.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FlowProgress'
 *       '404':
 *         description: Flow not found.
 *       '500':
 *         description: Internal server error.
 */
export {};