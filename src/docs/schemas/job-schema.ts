/**
 * @openapi
 * components:
 *   schemas:
 *     Job:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated unique identifier
 *           example: "job_123456"
 *         name:
 *           type: string
 *           description: Job name
 *           example: "dataExport"
 *         data:
 *           type: object
 *           description: Job data payload
 *           example:
 *             format: "csv"
 *             filters:
 *               date: "2025-06-28"
 *         status:
 *           type: string
 *           enum: [active, delayed, completed, failed, paused, waiting-children]
 *           description: Current job status
 *           example: "active"
 *         progress:
 *           type: number
 *           description: Job progress percentage (0-100)
 *           example: 75
 *         result:
 *           type: object
 *           description: Job execution result
 *           example:
 *             fileUrl: "https://example.com/exports/data.csv"
 *             recordCount: 1250
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           example: "2025-06-28T12:00:00Z"
 *
 *     JobSubmitRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Job name
 *           example: "dataExport"
 *         data:
 *           type: object
 *           description: Job data payload
 *           example:
 *             format: "csv"
 *             filters:
 *               date: "2025-06-28"
 *
 *     JobResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated unique identifier
 *           example: "job_123456"
 *         name:
 *           type: string
 *           description: Job name
 *           example: "dataExport"
 *         status:
 *           type: string
 *           enum: [active, delayed, completed, failed, paused, waiting-children]
 *           description: Current job status
 *           example: "active"
 *         progress:
 *           type: number
 *           description: Job progress percentage (0-100)
 *           example: 75
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           example: "2025-06-28T12:00:00Z"
 *
 *     ScheduleOptions:
 *       type: object
 *       properties:
 *         cron:
 *           type: string
 *           description: Cron expression (e.g., "0 0 * * *" for daily at midnight)
 *           example: "0 0 * * *"
 *         repeat:
 *           type: object
 *           properties:
 *             every:
 *               type: number
 *               description: Repeat interval in milliseconds
 *               example: 3600000
 *             limit:
 *               type: number
 *               description: Maximum number of repetitions
 *               example: 24
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: When to start the job
 *           example: "2025-07-01T00:00:00.000Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: When to stop scheduling the job
 *           example: "2025-12-31T00:00:00.000Z"
 *         tz:
 *           type: string
 *           description: Timezone for cron expressions
 *           example: "America/New_York"
 *
 *     ScheduledJob:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Scheduler ID
 *           example: "1-dataExport-1625097600000"
 *         name:
 *           type: string
 *           description: Job name
 *           example: "dataExport"
 *         data:
 *           type: object
 *           description: Job data
 *           example:
 *             format: "csv"
 *             filters:
 *               date: "2025-06-28"
 *         options:
 *           type: object
 *           description: Job options
 *           example:
 *             removeOnComplete: { count: 3 }
 *             removeOnFail: { count: 5 }
 *         nextRun:
 *           type: string
 *           format: date-time
 *           description: Next scheduled run time
 *           example: "2025-07-01T00:00:00.000Z"
 *
 *     ScheduleJobRequest:
 *       type: object
 *       required:
 *         - name
 *         - data
 *         - schedule
 *       properties:
 *         name:
 *           type: string
 *           description: Job name
 *           example: "dataExport"
 *         data:
 *           type: object
 *           description: Job data payload
 *           example:
 *             format: "csv"
 *             filters:
 *               date: "2025-06-28"
 *         schedule:
 *           $ref: '#/components/schemas/ScheduleOptions'
 *         options:
 *           type: object
 *           description: Job options (same as regular jobs)
 *           example:
 *             removeOnComplete: { count: 3 }
 *             removeOnFail: { count: 5 }
 */

// Export an empty object to make this file a valid module
export {};