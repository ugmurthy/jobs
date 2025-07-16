/**
 * @openapi
 * components:
 *   schemas:
 *     FlowJobData:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: 'Name of the job.'
 *         queueName:
 *           type: string
 *           description: 'The queue this job belongs to.'
 *         data:
 *           type: object
 *           description: 'Data for the job.'
 *           additionalProperties: true
 *         opts:
 *           type: object
 *           description: 'Job options.'
 *           additionalProperties: true
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FlowJobData'
 *           description: 'Nested child jobs.'
 *       required:
 *         - name
 *         - queueName
 *
 *     CreateFlowRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: 'Name for the entire flow.'
 *         queueName:
 *           type: string
 *           description: 'The queue for the root job of the flow.'
 *         data:
 *           type: object
 *           description: 'Data for the root job.'
 *           additionalProperties: true
 *         opts:
 *           type: object
 *           description: 'Options for the root job.'
 *           additionalProperties: true
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FlowJobData'
 *           description: 'The tree of child jobs for the flow.'
 *       required:
 *         - name
 *         - queueName
 *
 *     FlowResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 'The flow ID.'
 *         name:
 *           type: string
 *           description: 'The name of the flow.'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 'Creation timestamp.'
 *
 *     FlowJobResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 'The flow job ID from the database.'
 *         jobId:
 *           type: string
 *           description: 'The BullMQ job ID.'
 *         flowId:
 *           type: string
 *           description: 'The ID of the parent flow.'
 *         queueName:
 *           type: string
 *           description: 'The name of the queue.'
 *         data:
 *           type: object
 *           additionalProperties: true
 *           description: 'The job data.'
 *         opts:
 *           type: object
 *           additionalProperties: true
 *           description: 'The job options.'
 *         status:
 *           type: string
 *           description: 'The current status of the job.'
 *         result:
 *           type: object
 *           additionalProperties: true
 *           nullable: true
 *           description: 'The result of the job.'
 *         error:
 *           type: object
 *           additionalProperties: true
 *           nullable: true
 *           description: 'Error information if the job failed.'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export {};