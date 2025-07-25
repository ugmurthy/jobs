# 🚀 JobRunner

> **⚠️ DISCLAIMER: WORK IN PROGRESS ⚠️**
> This project is currently under active development and is not ready for production use.
> Features may be incomplete, contain bugs, or undergo significant changes without notice.
> Use at your own risk in development or testing environments only.

<p align="center">
  <img src="_assets/logo.gif" alt="JobRunner Logo" width="900" height="250">
</p>

A modern, modular backend service for job queue management with robust authentication, real-time updates, and comprehensive API.

## Overview

JobRunner is a powerful Node.js/TypeScript service designed to handle asynchronous job processing with a focus on reliability, scalability, and developer experience. It provides a comprehensive API for job submission, monitoring, and management, with real-time updates via WebSockets and a visual dashboard for queue monitoring.

## Changelog

### Version 0.0.2
*   All routes relating jobs and schedule now include queueName as parameter

### Key Features

- **Modular Architecture**: Clean separation of concerns for improved maintainability
- **RESTful API**: Comprehensive endpoints for job and webhook management
- **Authentication Options**:
  - **JWT Authentication**: Secure API access with token-based authentication
  - **API Key Authentication**: Alternative authentication for machine-to-machine communication
- **Job Queue Processing**: Reliable job execution with BullMQ
- **Job Scheduling**: Flexible job scheduling with cron expressions and repeat intervals
- **Scheduler Workers**: Dedicated workers for processing scheduled jobs
- **Redis-backed Persistence**: Durable storage for jobs and state
- **WebSocket Support**: Real-time updates on job progress and completion
- **Bull Board UI**: Visual dashboard for monitoring and managing job queues
- **TypeScript**: Full type safety throughout the codebase
- **Job Flows**: Define and manage complex, multi-step job workflows

## Frontend Client

This project includes a frontend client located in the [`jobs-client/`](jobs-client/) directory. For detailed information on the frontend, including setup and usage, please see the [frontend README](jobs-client/README.md).

## Installation

### Prerequisites

- Node.js (v18+)
- Redis server (see [Redis Setup Guide](REDIS.md) for installation instructions)
- TypeScript

### Instructions

```bash
# Clone the repository
git clone https://github.com/yourusername/jobrunner.git
cd jobrunner

# Install dependencies (use pnpm or npm)
pnpm install
# or
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start Redis (if not already running)
pnpm run redis-start
# or
npm run redis-start

# Build the TypeScript code
pnpm run build
# or
npm run build

# Start the server
pnpm start
# or
npm start
```

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
TOKEN_SECRET=your_jwt_secret_key
PORT=4000  # Optional, defaults to 4000
REDIS_HOST=localhost  # Optional, defaults to localhost
REDIS_PORT=6379  # Optional, defaults to 6379
DATABASE_URL=postgresql://username:password@localhost:5432/jobrunner  # Required for Prisma ORM
```

### API Key Configuration

API keys are stored in the database using Prisma ORM. The system:
- Generates random 32-byte API keys encoded as base64 strings
- Uses the first 8 characters as a prefix for efficient lookups
- Stores bcrypt hashes of the full keys for security

No additional environment variables are required specifically for API key functionality, but ensure your database connection is properly configured via the `DATABASE_URL` environment variable.

## Project Structure

The codebase follows a modular architecture for better organization and maintainability:

```
src/
├── config/           # Configuration modules
│   ├── app.ts        # Express app setup
│   ├── socket.ts     # Socket.IO configuration
│   ├── bull.ts       # Bull/BullMQ configuration with job scheduler
│   ├── redis.ts      # Redis configuration
│   └── env.ts        # Environment variables
│
├── middleware/       # Express middleware
│   ├── auth.ts       # JWT authentication middleware
│   ├── apiKeyAuth.ts # API key authentication middleware
│   ├── combinedAuth.ts # Combined authentication middleware
│   └── error.ts      # Error handling middleware
│
├── routes/           # API route handlers
│   ├── index.ts      # Route registration
│   ├── auth.ts       # Authentication routes
│   ├── jobs.ts       # Job management routes
│   ├── scheduler.ts  # Job scheduler routes
│   ├── webhooks.ts   # Webhook management routes
│   ├── admin.ts      # Admin routes
│   ├── apiKeys.ts    # API key management routes
│   └── flows.ts      # Job flow management routes
│
├── services/         # Business logic
│   ├── userService.ts    # User management
│   ├── jobService.ts     # Job-related logic
│   ├── schedulerService.ts # Scheduler-related logic
│   ├── webhookService.ts # Webhook-related logic
│   ├── apiKeyService.ts  # API key management
│   └── flowService.ts    # Job flow management
│
├── workers/          # Background job workers
│   ├── index.ts          # Worker registration
│   ├── webhookWorker.ts  # Webhook processing worker
│   └── schedulerWorker.ts # Scheduler processing worker
│
├── events/           # Event handlers
│   ├── index.ts          # Event registration
│   ├── jobEvents.ts      # Job event handlers
│   └── socketEvents.ts   # Socket event handlers
│
├── utils/            # Utility functions
│   ├── validation.ts     # Input validation
│   └── logger.ts         # Logging utilities
│
└── index.ts          # Application entry point
```

### Benefits of Modular Architecture

- **Improved Maintainability**: Smaller, focused files are easier to understand and modify
- **Better Separation of Concerns**: Each module has a clear responsibility
- **Enhanced Testability**: Isolated components are easier to test
- **Simplified Onboarding**: New developers can more easily understand the codebase
- **More Scalable Architecture**: Adding new features is simpler with a modular structure

## API Endpoints

### Admin Routes

- `GET /admin` - Bull Board UI for queue monitoring
- `GET /admin/dashboard` - Admin dashboard

### API Keys Routes

- `GET /api-keys` - List all API keys for the authenticated user
- `POST /api-keys` - Create a new API key
- `PUT /api-keys/{id}` - Update an API key
- `DELETE /api-keys/{id}` - Revoke an API key

### Authentication Routes

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login with username and password
- `POST /auth/logout` - Logout the current user
- `POST /auth/refresh-token` - Refresh access token

### Dashboard Routes

- `GET /dashboard/stats` - Get dashboard statistics

### Flows Routes

- `GET /flows` - List all flows for the authenticated user
- `POST /flows` - Create a new flow
- `GET /flows/{flowId}` - Get a specific flow
- `PUT /flows/{flowId}` - Update a specific flow
- `DELETE /flows/{flowId}` - Delete a specific flow
- `POST /flows/{flowId}/run` - Manually trigger a flow run

### Jobs Routes

- `POST /jobs/{queueName}/submit` - Submit a new job
- `GET /jobs/{queueName}/job/{jobId}` - Get status of a specific job
- `DELETE /jobs/{queueName}/job/{jobId}` - Delete a specific job
- `GET /jobs/{queueName}` - Get all jobs for the authenticated user
- `POST /jobs/{queueName}/schedule` - Schedule a new job
- `GET /jobs/{queueName}/schedule` - Get all scheduled jobs
- `GET /jobs/{queueName}/schedule/{schedulerId}` - Get a specific scheduled job
- `DELETE /jobs/{queueName}/schedule/{schedulerId}` - Remove a scheduled job

### Queues Routes

- `GET /queues` - Get a list of available queue names

### Webhooks Routes

- `GET /webhooks` - Get all webhooks for the authenticated user
- `POST /webhooks` - Add a new webhook
- `PUT /webhooks/{id}` - Update a webhook
- `DELETE /webhooks/{id}` - Delete a webhook
- `POST /webhooks/{id}` - Protected webhook notification route

## Authentication

JobRunner supports two authentication methods:

### JWT Authentication

For user-based authentication, include a valid JWT token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

### API Key Authentication

For machine-to-machine communication, third-party integrations, and automated scripts, use API key authentication by including the API key in the `x-api-key` header (case-insensitive, but lowercase is recommended):

```
x-api-key: your_api_key
```

API keys can be created, managed, and revoked through the API key management endpoints. Each API key can have specific permissions and an optional expiration date.

#### API Key Structure and Validation

API keys in JobRunner follow a specific structure:
- Each API key is a unique, randomly generated string
- The first 8 characters of the key serve as a "prefix" that is stored in the database for quick lookups
- The full API key is only shown once when created and should be stored securely
- The system stores a bcrypt hash of the full key in the database, not the key itself

When validating an API key:
1. The system extracts the prefix (first 8 characters) from the provided key
2. It looks up API keys with matching prefixes in the database
3. For each matching key, it compares the full provided key with the stored hash using bcrypt
4. It verifies the key is active and not expired
5. If valid, it attaches the associated user and permissions to the request

This approach provides several security benefits:
- Even if the database is compromised, the actual API keys cannot be recovered
- The prefix system allows for efficient lookups without storing the full key
- Each key can have granular permissions, limiting access to only what's needed

**Note:** All protected routes, including job routes (`/jobs/*`), webhook routes (`/webhooks/*`), and other authenticated endpoints support both JWT and API key authentication methods. The system will first check for an API key, and if not present, fall back to JWT authentication.

**Important Implementation Detail:** If you're experiencing issues with API key authentication, ensure that individual route handlers in route files (e.g., `jobs.ts`, `webhooks.ts`) are not using the `authenticateToken` middleware directly. The combined authentication middleware is applied at the router level in `routes/index.ts`, but if route handlers also use `authenticateToken`, it will override the API key authentication.

See [API Key Usage](API_KEY_USAGE.md) for detailed information on using and managing API keys.

#### Troubleshooting API Key Authentication

If you're experiencing issues with API key authentication:

1. **Header Case Sensitivity**: While the header name is case-insensitive, ensure you're using `x-api-key` (lowercase is recommended for consistency).

2. **Middleware Conflicts**: Ensure that individual route handlers in route files (e.g., `jobs.ts`, `webhooks.ts`) are not using the `authenticateToken` middleware directly, as this will override the combined authentication middleware.

3. **Debug Logging**: Enable debug logging to see detailed information about the API key validation process:
   ```javascript
   // In your .env file
   LOG_LEVEL=debug
   ```

4. **Check API Key Status**: Verify that your API key is active and not expired by listing your API keys:
   ```bash
   curl -X GET http://localhost:4000/api-keys \
     -H "Authorization: Bearer your_jwt_token"
   ```

5. **Permissions**: Ensure your API key has the necessary permissions for the endpoint you're trying to access.

6. **Database Connection**: Verify that your database connection is working correctly, as API key validation requires database access.

If you continue to experience issues, check the server logs for more detailed error messages.

## Job Submission Example

Using JWT authentication:
```bash
curl -X POST http://localhost:4000/jobs/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "name": "dataExport",
    "data": {
      "format": "csv",
      "filters": {"date": "2025-06-28"}
    }
  }'
```

Using API key authentication:
```bash
curl -X POST http://localhost:4000/jobs/submit \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key" \
  -d '{
    "name": "dataExport",
    "data": {
      "format": "csv",
      "filters": {"date": "2025-06-28"}
    }
  }'
```

## Job Scheduling Example

Using JWT authentication:
```bash
curl -X POST http://localhost:4000/jobs/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "name": "dataExport",
    "data": {
      "format": "csv",
      "filters": {"date": "2025-06-28"}
    },
    "schedule": {
      "cron": "0 0 * * *",
      "tz": "America/New_York",
      "startDate": "2025-07-01T00:00:00.000Z",
      "endDate": "2025-12-31T00:00:00.000Z"
    },
    "options": {
      "removeOnComplete": { "count": 3 },
      "removeOnFail": { "count": 5 }
    }
  }'
```

Using API key authentication:
```bash
curl -X POST http://localhost:4000/jobs/schedule \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key" \
  -d '{
    "name": "dataExport",
    "data": {
      "format": "csv",
      "filters": {"date": "2025-06-28"}
    },
    "schedule": {
      "cron": "0 0 * * *",
      "tz": "America/New_York",
      "startDate": "2025-07-01T00:00:00.000Z",
      "endDate": "2025-12-31T00:00:00.000Z"
    },
    "options": {
      "removeOnComplete": { "count": 3 },
      "removeOnFail": { "count": 5 }
    }
  }'
```

## Job Deletion Example

Using JWT authentication:
```bash
curl -X DELETE http://localhost:4000/jobs/123456789 \
  -H "Authorization: Bearer your_jwt_token"
```

Using API key authentication:
```bash
curl -X DELETE http://localhost:4000/jobs/123456789 \
  -H "x-api-key: your_api_key"
```

The response will include a success message and the ID of the deleted job:
```json
{
  "message": "Job deleted successfully",
  "id": "123456789"
}
```

## API Key Examples

### Creating an API Key

```bash
# First, create an API key (requires JWT authentication)
curl -X POST http://localhost:4000/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{
    "name": "Integration Key",
    "permissions": ["jobs:read", "jobs:write"],
    "expiresAt": "2026-07-01T00:00:00.000Z"
  }'

# Response will include the full API key - save it securely as it will only be shown once
# {
#   "id": 1,
#   "name": "Integration Key",
#   "key": "jrn_5f9d7e3a2b1c8e4f6a0d9c8b7a6f5e4d3c2b1a",
#   "prefix": "jrn_5f9d7",
#   "permissions": ["jobs:read", "jobs:write"],
#   "createdAt": "2025-07-03T21:05:26.000Z",
#   "expiresAt": "2026-07-01T00:00:00.000Z"
# }
```

#### Understanding API Key Format

In the example above:
- The full API key is `jrn_5f9d7e3a2b1c8e4f6a0d9c8b7a6f5e4d3c2b1a`
- The prefix is `jrn_5f9d7` (first 8 characters)
- Only the prefix and a bcrypt hash of the full key are stored in the database
- The full key is only shown once at creation time

When you list your API keys later, you'll only see the prefix, not the full key:

```bash
# Listing API keys
curl -X GET http://localhost:4000/api-keys \
  -H "Authorization: Bearer your_jwt_token"

# Response will show only the prefixes
# [
#   {
#     "id": 1,
#     "name": "Integration Key",
#     "prefix": "jrn_5f9d7",
#     "permissions": ["jobs:read", "jobs:write"],
#     "lastUsed": "2025-07-03T22:15:42.000Z",
#     "createdAt": "2025-07-03T21:05:26.000Z",
#     "expiresAt": "2026-07-01T00:00:00.000Z",
#     "isActive": true
#   }
# ]
```

### Using an API Key

```bash
# Using API key instead of JWT token
curl -X POST http://localhost:4000/jobs/submit \
  -H "Content-Type: application/json" \
  -H "x-api-key: jrn_5f9d7e3a2b1c8e4f6a0d9c8b7a6f5e4d3c2b1a" \
  -d '{
    "name": "dataExport",
    "data": {
      "format": "csv",
      "filters": {"date": "2025-06-28"}
    }
  }'
```

When you use an API key, the system:
1. Extracts the prefix (`jrn_5f9d7`)
2. Finds all API keys with that prefix in the database
3. Compares the full key against the stored hash
4. Verifies the key is active and not expired
5. Grants access based on the key's permissions

## WebSocket Support

The application includes Socket.io for real-time updates. Clients can subscribe to job events:

```javascript
// Client-side example
const socket = io('http://localhost:4000', {
  auth: { token: 'your_jwt_token' }
});

// Subscribe to a specific job
socket.emit('subscribe:job', 'job_id_here');

// Listen for job progress
socket.on('job:progress', (data) => {
  console.log(`Job ${data.jobId} progress: ${data.progress}%`);
});

// Listen for job completion
socket.on('job:completed', (data) => {
  console.log(`Job ${data.jobId} completed with result:`, data.result);
});
```

## Bull Board UI

Access the Bull Board UI dashboard for monitoring and managing job queues at:
```
http://localhost:4000/admin
```

## Dependencies

- `@ugm/logger` - Logging utility
- `@bull-board/api` - Bull Board API for queue monitoring
- `@bull-board/express` - Express adapter for Bull Board
- `bullmq` - Job queue management
- `dotenv` - Environment variable management
- `express` - Web server framework
- `prisma` - Database ORM
- `jsonwebtoken` - JWT authentication
- `socket.io` - WebSocket support
- `got` - HTTP client for webhook delivery

## Documentation

- [Redis Setup Guide](REDIS.md) - Detailed instructions for setting up Redis locally or using Redis.io free tier
- [API Documentation Plan](API_DOCUMENTATION_PLAN.md) - Plan for implementing Swagger/OpenAPI documentation
- [API Key Implementation](API_KEY_IMPLEMENTATION.md) - Implementation plan for API key authentication
- [API Key Usage](API_KEY_USAGE.md) - Guide for using and managing API keys

## API Documentation

Interactive API documentation is available at:
```
http://localhost:4000/api-docs/
```
Note: Make sure to include the trailing slash in the URL.

The documentation is automatically generated from the codebase and includes:
- Detailed endpoint descriptions
- Request/response schemas
- Authentication requirements
- Example requests and responses

You can also download the OpenAPI specification at:
```
http://localhost:4000/api-docs.json
```

To build and run the application with the API documentation:
```bash
# Build the application (includes generating API documentation)
pnpm run build

# Start the server
pnpm start

# Or use the dev script to build and start in one command
pnpm run dev
```

## License

MIT License

Copyright (c) 2025 Muve Solutions LLP

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.