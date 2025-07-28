/**
 * @openapi
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *         code:
 *           type: string
 *           description: Error code
 *       example:
 *         message: "Invalid input data"
 *         code: "VALIDATION_ERROR"
 *
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indicates if the operation was successful
 *           example: true
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Operation completed successfully"
 */
export {};
