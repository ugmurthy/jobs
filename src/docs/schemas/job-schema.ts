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
 *           enum: [waiting, active, completed, failed, delayed]
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
 *           enum: [waiting, active, completed, failed, delayed]
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
 */

// Export an empty object to make this file a valid module
export {};