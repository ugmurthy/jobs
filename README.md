# Runner

A backend module to run jobs using a queue-based architecture with JWT authentication.

## Description

Runner is a Node.js/TypeScript service that provides a simple API for submitting and processing jobs. It implements JWT-based authentication for secure API access and uses BullMQ with Redis for reliable job queue management.

## Features

- RESTful API for job submission and management
- JWT-based authentication
- Job queue processing with BullMQ
- Redis-backed persistence
- WebSocket support for real-time updates
- Bull Board UI for monitoring and managing job queues
- TypeScript for type safety

## Prerequisites

- Node.js (v18+)
- Redis server
- TypeScript

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
# or
pnpm install
```

3. Create a `.env` file in the root directory with the following variables:

```
TOKEN_SECRET=your_jwt_secret_key
PORT=4000  # Optional, defaults to 4000
```

## Redis Setup

The application requires a Redis server for job queue management. You can use the provided npm scripts to manage Redis:

```bash
# Start Redis server
npm run redis-start

# Check Redis server status
npm run redis-info

# Stop Redis server
npm run redis-stop
```

## Building and Running

```bash
# Build the TypeScript code
tsc

# Start the server
npm start
```

## API Endpoints

### Public Endpoints

#### `GET /`

Returns a simple "Hello World" message to verify the server is running.

**Response:**
```json
{
  "message": "Hello World"
}
```

#### `POST /login`

Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "username": "your_username"
}
```

**Response:**
```json
{
  "token": "jwt_token_here"
}
```

### Protected Endpoints

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

#### `GET /protected`

A test endpoint to verify authentication is working.

**Response:**
```json
{
  "message": "This is a protected route",
  "user": {
    "username": "your_username"
  }
}
```

#### `POST /submit-job`

Submits a job to the queue for processing.

**Request Body:**
```json
{
  "name": "jobName",
  "data": {
    "key1": "value1",
    "key2": "value2"
    // Any job-specific data
  }
}
```

**Response:**
```json
{
  "jobId": "job_id_here"
}
```

## Job Processing

The system uses BullMQ to manage job queues. Jobs are submitted via the API and processed asynchronously. The current implementation supports various job types as seen in the logs (e.g., "dataExport", "paint").

## WebSocket Support

The application includes Socket.io for real-time updates. This can be used to receive job progress and completion events.

## Bull Board UI

The application includes Bull Board, a UI dashboard for monitoring and managing BullMQ job queues. The dashboard provides the following features:

- View all queues and their jobs
- Monitor job statuses (completed, failed, delayed, etc.)
- View job details and data
- Retry failed jobs
- Promote delayed jobs
- Clean queues

Access the Bull Board UI at:
```
http://localhost:4000/admin
```

The UI is accessible without authentication, so be careful when deploying to production environments.

## Project Structure

- `src/index.ts` - Main application entry point
- `dist/` - Compiled JavaScript files
- `logs/` - Application logs

## Environment Variables

- `TOKEN_SECRET` - Secret key for JWT token generation and verification
- `PORT` - Server port (defaults to 4000)

## Dependencies

- `@ugm/logger` - Logging utility
- `@bull-board/api` - Bull Board API for queue monitoring
- `@bull-board/express` - Express adapter for Bull Board
- `bullmq` - Job queue management
- `dotenv` - Environment variable management
- `express` - Web server framework
- `ioredis` - Redis client
- `jsonwebtoken` - JWT authentication
- `socket.io` - WebSocket support

## License

[Add your license information here]