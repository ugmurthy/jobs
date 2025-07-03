# 🚀 JobRunner

<p align="center">
  <img src="_assets/logo.gif" alt="JobRunner Logo" width="900" height="250">
</p>

A modern, modular backend service for job queue management with robust authentication, real-time updates, and comprehensive API.

## Overview

JobRunner is a powerful Node.js/TypeScript service designed to handle asynchronous job processing with a focus on reliability, scalability, and developer experience. It provides a comprehensive API for job submission, monitoring, and management, with real-time updates via WebSockets and a visual dashboard for queue monitoring.

### Key Features

- **Modular Architecture**: Clean separation of concerns for improved maintainability
- **RESTful API**: Comprehensive endpoints for job and webhook management
- **JWT Authentication**: Secure API access with token-based authentication
- **Job Queue Processing**: Reliable job execution with BullMQ
- **Job Scheduling**: Flexible job scheduling with cron expressions and repeat intervals
- **Scheduler Workers**: Dedicated workers for processing scheduled jobs
- **Redis-backed Persistence**: Durable storage for jobs and state
- **WebSocket Support**: Real-time updates on job progress and completion
- **Bull Board UI**: Visual dashboard for monitoring and managing job queues
- **TypeScript**: Full type safety throughout the codebase

## Installation

### Prerequisites

- Node.js (v18+)
- Redis server (see [Redis Setup Guide](REDIS.md) for installation instructions)
- TypeScript

### Using pnpm (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/jobrunner.git
cd jobrunner

# Install dependencies
pnpm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start Redis (if not already running)
pnpm run redis-start

# Build the TypeScript code
pnpm run build

# Start the server
pnpm start
```

### Using npm

```bash
# Clone the repository
git clone https://github.com/yourusername/jobrunner.git
cd jobrunner

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start Redis (if not already running)
npm run redis-start

# Build the TypeScript code
npm run build

# Start the server
npm start
```

## Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
TOKEN_SECRET=your_jwt_secret_key
PORT=4000  # Optional, defaults to 4000
REDIS_HOST=localhost  # Optional, defaults to localhost
REDIS_PORT=6379  # Optional, defaults to 6379
```

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
│   ├── auth.ts       # Authentication middleware
│   └── error.ts      # Error handling middleware
│
├── routes/           # API route handlers
│   ├── index.ts      # Route registration
│   ├── auth.ts       # Authentication routes
│   ├── jobs.ts       # Job management routes
│   ├── scheduler.ts  # Job scheduler routes
│   ├── webhooks.ts   # Webhook management routes
│   └── admin.ts      # Admin routes
│
├── services/         # Business logic
│   ├── userService.ts    # User management
│   ├── jobService.ts     # Job-related logic
│   ├── schedulerService.ts # Scheduler-related logic
│   └── webhookService.ts # Webhook-related logic
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

### Authentication Routes

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout (requires authentication)
- `POST /auth/refresh-token` - Refresh access token
- `POST /auth/request-password-reset` - Request password reset
- `POST /auth/reset-password` - Reset password
- `GET /auth/protected` - Protected route example (requires authentication)

### Job Management Routes

- `POST /jobs/submit` - Submit a job (requires authentication)
- `GET /jobs/:jobId` - Get status of a specific job (requires authentication)
- `GET /jobs` - Get all jobs for the authenticated user (requires authentication)

### Job Scheduler Routes

- `POST /jobs/schedule` - Schedule a job for future execution (requires authentication)
- `GET /jobs/schedule` - Get all scheduled jobs for the authenticated user (requires authentication)
- `GET /jobs/schedule/:schedulerId` - Get status of a specific scheduled job (requires authentication)
- `DELETE /jobs/schedule/:schedulerId` - Remove a scheduled job (requires authentication)

### Webhook Routes

- `GET /webhooks` - Get all webhooks for the authenticated user (requires authentication)
- `POST /webhooks` - Add a new webhook (requires authentication)
- `PUT /webhooks/:id` - Update a webhook (requires authentication)
- `DELETE /webhooks/:id` - Delete a webhook (requires authentication)
- `PUT /webhooks/url` - Update webhook URL (legacy) (requires authentication)
- `POST /webhooks/:id` - Protected webhook notification route

### Admin Routes

- `GET /admin` - Bull Board UI
- `GET /admin/dashboard` - Admin dashboard (requires authentication)

### Legacy Routes (for backward compatibility)

- `GET /` - Root route that returns a simple message
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout (requires authentication)
- `POST /refresh-token` - Refresh access token
- `POST /request-password-reset` - Request password reset
- `POST /reset-password` - Reset password
- `POST /submit-job` - Submit a job (requires authentication)

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

## Job Submission Example

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

## Job Scheduling Example

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