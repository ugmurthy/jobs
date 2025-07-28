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
 *         flowname:
 *           type: string
 *           description: 'Human-readable flow name.'
 *         name:
 *           type: string
 *           description: 'Handler name for root job.'
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
 *         - flowname
 *         - name
 *         - queueName
 *
 *     FlowResponse:
 *       type: object
 *       properties:
 *         flowId:
 *           type: string
 *           description: 'The flow ID.'
 *         flowname:
 *           type: string
 *           description: 'Human-readable flow name.'
 *         name:
 *           type: string
 *           description: 'Handler name for root job.'
 *         queueName:
 *           type: string
 *           description: 'The queue name.'
 *         status:
 *           type: string
 *           enum: [pending, running, completed, failed, cancelled]
 *           description: 'Current flow status.'
 *         progress:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: 'Total number of jobs in the flow.'
 *             completed:
 *               type: integer
 *               description: 'Number of completed jobs.'
 *             failed:
 *               type: integer
 *               description: 'Number of failed jobs.'
 *             percentage:
 *               type: number
 *               description: 'Completion percentage.'
 *           required:
 *             - total
 *             - completed
 *             - failed
 *             - percentage
 *           description: 'Flow progress information.'
 *         result:
 *           type: object
 *           additionalProperties: true
 *           nullable: true
 *           description: 'Flow result data.'
 *         error:
 *           type: object
 *           additionalProperties: true
 *           nullable: true
 *           description: 'Error information if the flow failed.'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 'Creation timestamp.'
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 'Last update timestamp.'
 *         startedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: 'Flow start timestamp.'
 *         completedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: 'Flow completion timestamp.'
 *       required:
 *         - flowId
 *         - flowname
 *         - name
 *         - queueName
 *         - status
 *         - progress
 *         - createdAt
 *         - updatedAt
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
 *
 *     FlowUpdateRequest:
 *       type: object
 *       properties:
 *         jobId:
 *           type: string
 *           description: 'BullMQ job ID.'
 *         status:
 *           type: string
 *           enum: [running, completed, failed]
 *           description: 'Updated job status.'
 *         result:
 *           type: object
 *           additionalProperties: true
 *           nullable: true
 *           description: 'Job result data.'
 *         error:
 *           type: object
 *           additionalProperties: true
 *           nullable: true
 *           description: 'Error information if the job failed.'
 *       required:
 *         - jobId
 *         - status
 *
 *     FlowProgress:
 *       type: object
 *       properties:
 *         jobs:
 *           type: object
 *           additionalProperties:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 'Job handler name.'
 *               queueName:
 *                 type: string
 *                 description: 'Queue name.'
 *               status:
 *                 type: string
 *                 description: 'BullMQ job status.'
 *               result:
 *                 type: object
 *                 additionalProperties: true
 *                 nullable: true
 *                 description: 'Job result.'
 *               error:
 *                 type: object
 *                 additionalProperties: true
 *                 nullable: true
 *                 description: 'Job error.'
 *               startedAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: 'Job start timestamp.'
 *               completedAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: 'Job completion timestamp.'
 *             required:
 *               - name
 *               - queueName
 *               - status
 *           description: 'Individual job progress by job ID.'
 *         summary:
 *           type: object
 *           properties:
 *             total:
 *               type: integer
 *               description: 'Total jobs.'
 *             completed:
 *               type: integer
 *               description: 'Completed jobs.'
 *             failed:
 *               type: integer
 *               description: 'Failed jobs.'
 *             delayed:
 *               type: integer
 *               description: 'Delayed jobs.'
 *             active:
 *               type: integer
 *               description: 'Active jobs.'
 *             waiting:
 *               type: integer
 *               description: 'Waiting jobs.'
 *             waiting-children:
 *               type: integer
 *               description: 'Jobs waiting for children.'
 *             paused:
 *               type: integer
 *               description: 'Paused jobs.'
 *             stuck:
 *               type: integer
 *               description: 'Stuck jobs.'
 *             percentage:
 *               type: number
 *               description: 'Completion percentage.'
 *           required:
 *             - total
 *             - completed
 *             - failed
 *             - delayed
 *             - active
 *             - waiting
 *             - waiting-children
 *             - paused
 *             - stuck
 *             - percentage
 *           description: 'Summary of job statuses.'
 *       required:
 *         - jobs
 *         - summary
 */
export {};