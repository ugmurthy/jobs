/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated unique identifier
 *           example: "user_123456"
 *         username:
 *           type: string
 *           description: User's username
 *           example: "johndoe"
 *         email:
 *           type: string
 *           format: email
 *           description: User's email
 *           example: "john.doe@example.com"
 *         password:
 *           type: string
 *           format: password
 *           description: User's password (hashed)
 *           example: "********"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           example: "2025-06-28T12:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *           example: "2025-06-28T12:00:00Z"
 *
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated unique identifier
 *           example: "user_123456"
 *         username:
 *           type: string
 *           description: User's username
 *           example: "johndoe"
 *         email:
 *           type: string
 *           format: email
 *           description: User's email
 *           example: "john.doe@example.com"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           example: "2025-06-28T12:00:00Z"
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: Username
 *           example: "johndoe"
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *           example: "securePassword123"
 *
 *     LoginResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT access token
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         user:
 *           $ref: '#/components/schemas/UserResponse'
 */

// Export an empty object to make this file a valid module
export {};