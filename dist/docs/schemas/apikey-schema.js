/**
 * @openapi
 * components:
 *   schemas:
 *     ApiKey:
 *       type: object
 *       required:
 *         - name
 *         - permissions
 *       properties:
 *         name:
 *           type: string
 *           description: A descriptive name for the API key
 *           example: "My API Key"
 *         permissions:
 *           type: array
 *           description: Array of permissions granted to this key
 *           items:
 *             type: string
 *           example: ["read:jobs", "write:jobs"]
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Optional expiration date for the API key
 *           example: "2025-12-31T23:59:59Z"
 *
 *     ApiKeyResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the API key
 *           example: 1
 *         userId:
 *           type: integer
 *           description: ID of the user who owns this API key
 *           example: 42
 *         name:
 *           type: string
 *           description: A descriptive name for the API key
 *           example: "My API Key"
 *         prefix:
 *           type: string
 *           description: First few characters of the key (for display)
 *           example: "abc12345"
 *         permissions:
 *           type: array
 *           description: Array of permissions granted to this key
 *           items:
 *             type: string
 *           example: ["read:jobs", "write:jobs"]
 *         lastUsed:
 *           type: string
 *           format: date-time
 *           description: When the API key was last used
 *           example: "2025-07-01T12:34:56Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the API key was created
 *           example: "2025-06-01T00:00:00Z"
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: When the API key expires (null if never)
 *           example: "2025-12-31T23:59:59Z"
 *         isActive:
 *           type: boolean
 *           description: Whether the API key is active
 *           example: true
 *
 *     ApiKeyWithSecretResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *           example: "API key created successfully"
 *         apiKey:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               description: Unique identifier for the API key
 *               example: 1
 *             userId:
 *               type: integer
 *               description: ID of the user who owns this API key
 *               example: 42
 *             name:
 *               type: string
 *               description: A descriptive name for the API key
 *               example: "My API Key"
 *             prefix:
 *               type: string
 *               description: First few characters of the key (for display)
 *               example: "abc12345"
 *             permissions:
 *               type: array
 *               description: Array of permissions granted to this key
 *               items:
 *                 type: string
 *               example: ["read:jobs", "write:jobs"]
 *             lastUsed:
 *               type: string
 *               format: date-time
 *               description: When the API key was last used
 *               example: null
 *             createdAt:
 *               type: string
 *               format: date-time
 *               description: When the API key was created
 *               example: "2025-06-01T00:00:00Z"
 *             expiresAt:
 *               type: string
 *               format: date-time
 *               description: When the API key expires (null if never)
 *               example: "2025-12-31T23:59:59Z"
 *             isActive:
 *               type: boolean
 *               description: Whether the API key is active
 *               example: true
 *             key:
 *               type: string
 *               description: The full API key (only shown once upon creation)
 *               example: "abc12345def67890ghi12345jkl67890mno12345pqr67890"
 */
export {};
