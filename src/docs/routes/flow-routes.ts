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
 * /flows/{id}:
 *   get:
 *     summary: Get a single flow by its ID
 *     tags: [Flows]
 *     parameters:
 *       - in: path
 *         name: id
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
 * /flows/{id}/jobs:
 *   get:
 *     summary: Get all jobs associated with a flow
 *     tags: [Flows]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the flow.
 *     responses:
 *       '200':
 *         description: A list of jobs for the flow.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FlowJobResponse'
 *       '404':
 *         description: Flow not found.
 *       '500':
 *         description: Internal server error.
 */
export {};