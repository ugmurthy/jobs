# Job Progress and Completion Notification System

This document describes the comprehensive job feedback system that provides real-time updates on job progress and completion through multiple channels: Socket.IO, REST API polling, and webhooks.

## Overview

The system supports three notification methods:

1. **Socket.IO Real-time Updates** - Instant notifications via WebSocket connections
2. **REST API Polling** - Client-initiated status checks with pagination and filtering
3. **Webhooks** - Server-initiated HTTP callbacks to client-specified URLs

## Features

### Real-time Notifications
- ✅ Socket.IO integration with authentication
- ✅ User-specific and job-specific event rooms
- ✅ Progress, completion, and failure events
- ✅ Automatic subscription management

### REST API Endpoints
- ✅ Job status polling (`GET /jobs/:jobId`)
- ✅ Job listing with pagination (`GET /jobs`)
- ✅ Status filtering (completed, failed, active, waiting, delayed)
- ✅ User-specific job access control

### Webhook Management
- ✅ Multiple webhook URLs per user
- ✅ Event-specific webhooks (progress, completed, failed, all)
- ✅ Webhook CRUD operations
- ✅ Retry logic with timeout handling
- ✅ Legacy webhook URL support

### Security
- ✅ JWT authentication for all channels
- ✅ User isolation (users can only access their own jobs)
- ✅ Socket.IO authentication middleware
- ✅ Protected webhook endpoints

## API Reference

### Authentication

All endpoints require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

### Socket.IO Events

#### Client to Server Events
- `subscribe:job` - Subscribe to specific job updates
- `unsubscribe:job` - Unsubscribe from job updates

#### Server to Client Events
- `job:progress` - Job progress update for user
- `job:completed` - Job completion for user
- `job:failed` - Job failure for user
- `job:<jobId>:progress` - Specific job progress
- `job:<jobId>:completed` - Specific job completion
- `job:<jobId>:failed` - Specific job failure

### REST Endpoints

#### Job Status and Management

##### Get Job Status
```http
GET /jobs/:jobId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "123",
  "name": "jobName",
  "state": "active|completed|failed|waiting|delayed",
  "progress": 75,
  "result": "job result (if completed)",
  "failedReason": "error message (if failed)",
  "timestamp": {
    "created": 1640995200000,
    "started": 1640995210000,
    "finished": 1640995300000
  }
}
```

##### List Jobs
```http
GET /jobs?page=1&limit=10&status=completed
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)
- `status` (optional) - Filter by status: completed, failed, active, waiting, delayed

**Response:**
```json
{
  "jobs": [
    {
      "id": "123",
      "name": "jobName",
      "state": "completed",
      "progress": 100,
      "timestamp": {
        "created": 1640995200000,
        "started": 1640995210000,
        "finished": 1640995300000
      }
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

#### Webhook Management

##### List Webhooks
```http
GET /webhooks
Authorization: Bearer <token>
```

**Response:**
```json
{
  "webhooks": [
    {
      "id": 1,
      "url": "https://example.com/webhook",
      "eventType": "completed",
      "description": "Job completion webhook",
      "active": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

##### Create Webhook
```http
POST /webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://example.com/webhook",
  "eventType": "completed",
  "description": "Job completion webhook"
}
```

**Event Types:**
- `progress` - Job progress updates
- `completed` - Job completion
- `failed` - Job failure
- `all` - All events

##### Update Webhook
```http
PUT /webhooks/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://example.com/new-webhook",
  "eventType": "all",
  "description": "Updated webhook",
  "active": false
}
```

##### Delete Webhook
```http
DELETE /webhooks/:id
Authorization: Bearer <token>
```

### Webhook Payload Format

Webhooks receive POST requests with the following payload structure:

#### Progress Event
```json
{
  "id": "123",
  "jobname": "exampleJob",
  "userId": 1,
  "progress": 75,
  "eventType": "progress"
}
```

#### Completion Event
```json
{
  "id": "123",
  "jobname": "exampleJob",
  "userId": 1,
  "result": "job result data",
  "eventType": "completed"
}
```

#### Failure Event
```json
{
  "id": "123",
  "jobname": "exampleJob",
  "userId": 1,
  "error": "error message",
  "eventType": "failed"
}
```

## Client Integration

### Socket.IO Client (JavaScript)

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:4000', {
  auth: {
    token: 'your_jwt_token'
  }
});

// Listen for job events
socket.on('job:progress', (data) => {
  console.log(`Job ${data.jobId} progress: ${data.progress}%`);
});

socket.on('job:completed', (data) => {
  console.log(`Job ${data.jobId} completed!`, data.result);
});

socket.on('job:failed', (data) => {
  console.log(`Job ${data.jobId} failed!`, data.error);
});

// Subscribe to specific job
socket.emit('subscribe:job', 'job123');
```

### REST API Client (JavaScript)

```javascript
// Poll job status
async function pollJobStatus(jobId, token) {
  const response = await fetch(`http://localhost:4000/jobs/${jobId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const status = await response.json();
  console.log('Job status:', status);
  
  if (status.state === 'active') {
    // Continue polling
    setTimeout(() => pollJobStatus(jobId, token), 2000);
  }
}
```

### Webhook Receiver (Express.js)

```javascript
const express = require('express');
const app = express();
app.use(express.json());

app.post('/webhook', (req, res) => {
  const { id, jobname, eventType } = req.body;
  
  switch (eventType) {
    case 'progress':
      console.log(`Job ${id} progress: ${req.body.progress}%`);
      break;
    case 'completed':
      console.log(`Job ${id} completed:`, req.body.result);
      break;
    case 'failed':
      console.log(`Job ${id} failed:`, req.body.error);
      break;
  }
  
  res.status(200).json({ received: true });
});

app.listen(3000);
```

## Usage Examples

### 1. Real-time Job Monitoring

```javascript
// Submit a job
const jobResponse = await fetch('http://localhost:4000/submit-job', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'dataProcessing',
    data: { file: 'data.csv' }
  })
});

const { jobId } = await jobResponse.json();

// Subscribe to real-time updates
socket.emit('subscribe:job', jobId);

// Also setup webhook for reliability
await fetch('http://localhost:4000/webhooks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    url: 'https://myapp.com/job-webhook',
    eventType: 'all',
    description: 'Job monitoring webhook'
  })
});
```

### 2. Job Dashboard with Polling

```javascript
// Fetch all jobs with pagination
async function loadJobsDashboard(page = 1) {
  const response = await fetch(`http://localhost:4000/jobs?page=${page}&limit=20`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  
  // Update UI with jobs
  updateJobsTable(data.jobs);
  updatePagination(data.pagination);
  
  // Poll active jobs for updates
  const activeJobs = data.jobs.filter(job => job.state === 'active');
  activeJobs.forEach(job => {
    setTimeout(() => refreshJobStatus(job.id), 5000);
  });
}
```

### 3. Webhook-based Integration

```javascript
// Setup webhooks for different environments
const webhooks = [
  {
    url: 'https://api.myapp.com/webhooks/progress',
    eventType: 'progress',
    description: 'Progress tracking'
  },
  {
    url: 'https://notifications.myapp.com/job-complete',
    eventType: 'completed',
    description: 'Completion notifications'
  },
  {
    url: 'https://alerts.myapp.com/job-failed',
    eventType: 'failed',
    description: 'Failure alerts'
  }
];

for (const webhook of webhooks) {
  await fetch('http://localhost:4000/webhooks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(webhook)
  });
}
```

## Configuration

### Environment Variables

```bash
# Server configuration
PORT=4000
TOKEN_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_secret

# Database
DATABASE_URL="file:./dev.db"

# Redis (for job queues)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Socket.IO Configuration

The Socket.IO server is configured with CORS enabled for development:

```javascript
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
```

For production, configure CORS appropriately:

```javascript
const io = new Server(httpServer, {
  cors: {
    origin: ["https://yourdomain.com"],
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

## Error Handling

### Socket.IO Errors

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
  // Handle authentication errors, network issues, etc.
});
```

### REST API Errors

```javascript
try {
  const response = await fetch('/jobs/123', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
} catch (error) {
  console.error('API Error:', error.message);
}
```

### Webhook Delivery Failures

The system automatically retries failed webhook deliveries up to 3 times with a 10-second timeout. Failed deliveries are logged but don't affect job processing.

## Performance Considerations

### Socket.IO
- Users are automatically placed in user-specific rooms for efficient message routing
- Job-specific subscriptions allow fine-grained control over notifications
- Connection pooling is handled automatically by Socket.IO

### REST API
- Pagination limits response sizes
- Database queries are optimized with proper indexing
- Job filtering reduces unnecessary data transfer

### Webhooks
- Asynchronous delivery prevents blocking job processing
- Timeout and retry logic handles unreliable endpoints
- Multiple webhooks per user allow for redundancy

## Security Best Practices

1. **Authentication**: All channels require valid JWT tokens
2. **Authorization**: Users can only access their own jobs and webhooks
3. **Input Validation**: All inputs are validated and sanitized
4. **Rate Limiting**: Consider implementing rate limiting for API endpoints
5. **HTTPS**: Use HTTPS for webhook URLs in production
6. **Webhook Verification**: Consider implementing webhook signature verification

## Troubleshooting

### Common Issues

1. **Socket.IO Connection Fails**
   - Check JWT token validity
   - Verify CORS configuration
   - Ensure WebSocket support in client environment

2. **Webhooks Not Received**
   - Verify webhook URL is accessible
   - Check webhook endpoint returns 200 status
   - Review server logs for delivery attempts

3. **Job Status Not Updating**
   - Ensure job worker is running
   - Check Redis connection
   - Verify queue event listeners are active

### Debug Logging

Enable debug logging to troubleshoot issues:

```javascript
// Set logger level to debug
logger.level = 'debug';
```

This will provide detailed logs for:
- Socket.IO connections and events
- Webhook delivery attempts
- Job queue events
- Authentication attempts

## Migration from Legacy System

If you have existing webhook URLs in the `webhookUrl` field, they will continue to work for completion events. To migrate to the new system:

1. Create new webhooks using the `/webhooks` endpoint
2. Test the new webhooks
3. Remove the legacy `webhookUrl` field when ready

The system maintains backward compatibility during the transition period.