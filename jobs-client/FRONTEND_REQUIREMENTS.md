# JobRunner Frontend Requirements

This document outlines the requirements for developing a frontend application that interacts with the JobRunner backend API. It provides a high-level overview of the available endpoints and features that should be implemented in the frontend.

## 1. Authentication

The frontend must implement user authentication using JWT tokens.

### Key Features:
- User registration
- User login with username/password
- Token-based authentication (JWT)
- Token refresh mechanism
- Logout functionality

### API Endpoints:
- `POST /auth/register`: Register a new user
- `POST /auth/login`: Authenticate and receive access tokens
- `POST /auth/logout`: Invalidate current tokens
- `POST /auth/refresh-token`: Refresh access token

## 2. Job Management

The core functionality of the application is submitting and monitoring jobs.

### Key Features:
- Submit new jobs with custom parameters
- View job details and status
- List all jobs with filtering options
- Monitor job progress

### API Endpoints:
- `POST /jobs/submit`: Submit a new job
- `GET /jobs/{jobId}`: Get status of a specific job
- `GET /jobs`: Get all jobs with optional filtering

## 3. Job Scheduling

The application allows scheduling jobs to run at specified times.

### Key Features:
- Schedule jobs using cron expressions or intervals
- View scheduled jobs
- Manage (view/delete) scheduled jobs

### API Endpoints:
- `POST /jobs/schedule`: Schedule a new job
- `GET /jobs/schedule`: List all scheduled jobs
- `GET /jobs/schedule/{schedulerId}`: Get details of a scheduled job
- `DELETE /jobs/schedule/{schedulerId}`: Remove a scheduled job

## 4. Webhooks

The application supports webhooks for receiving notifications about job events.

### Key Features:
- Create webhooks for different event types
- Manage webhook configurations
- View webhook history

### API Endpoints:
- `GET /webhooks`: List all webhooks
- `POST /webhooks`: Create a new webhook
- `PUT /webhooks/{id}`: Update a webhook
- `DELETE /webhooks/{id}`: Delete a webhook

## 5. API Keys

The application supports API key management for programmatic access.

### Key Features:
- Create API keys with specific permissions
- View and manage existing API keys
- Revoke API keys

### API Endpoints:
- `GET /api-keys`: List all API keys
- `POST /api-keys`: Create a new API key
- `PUT /api-keys/{id}`: Update an API key
- `DELETE /api-keys/{id}`: Revoke an API key

## 6. Admin Dashboard

An administrative dashboard for monitoring system activity.

### Key Features:
- View system statistics
- Monitor active jobs
- View user activity

### API Endpoints:
- `GET /admin/dashboard`: Get admin dashboard data

## 7. Technical Requirements

### Authentication:
- The frontend must store JWT tokens securely
- Include the token in the Authorization header for authenticated requests
- Implement token refresh before expiration
- Support API key authentication for programmatic access

### Real-time Updates:
- Implement polling or WebSocket connections for real-time job status updates
- Monitor websocket events

### Error Handling:
- Properly handle and display API errors
- Implement retry mechanisms for transient failures

### Responsive Design:
- The UI should be responsive and work on desktop and mobile devices

## 8. User Experience Guidelines

### Dashboard:
- Provide a clear overview of jobs and their statuses
- Use visual indicators for job status (waiting, active, completed, failed)
- Show progress indicators for active jobs

### Job Submission:
- Provide a simple form for basic job submission
- Include advanced options in an expandable section
- Show validation errors inline

### Notifications:
- Notify users about job completion or failures
- Allow configuring notification preferences

### Frontend features 

- Real-time statistics cards showing active jobs, completion rates, and success metrics
- Interactive job submission form with validation
- Recent jobs grid with status indicators and progress bars
- Modern card-based layout with hover effects

#### 📅 Scheduled Jobs Management

- Clean table view of scheduled jobs with cron expressions
- Status toggles for enabling/disabling schedules
- Actions for editing and deleting scheduled jobs
- Next run time display

#### 🔗 Webhooks Configuration

- Card-based webhook management interface
- Event type badges and status indicators
- URL display with security masking
- Test, edit, and delete functionality

#### Websocket Events

*Real-time Event Stream*
- Live connection indicator with green/red status dot
- Event filtering by category (Job, Webhook, System, User events)
- Real-time timestamp display for each event
- Animated pulse indicator showing live connectivity

*Rich Event Display*
- Color-coded event badges with appropriate icons
- JSON payload preview in expandable code blocks
- Event status indicators (received, delivered, failed)
- Job ID and Webhook ID references where applicable

*Interactive Controls*
- Connect/Disconnect toggle for WebSocket connection
- Event filtering dropdown for focused monitoring
- Clear events button to reset the stream
- Connection status with last heartbeat timestamp 

#### 🔑 API Keys Management

- Secure API key display with partial masking
- Permission-based access control visualization
- Last used tracking
- Generate, edit, and revoke capabilities

#### 🎨 Modern Design Elements

- Glassmorphism effects with subtle shadows and borders
- Vibrant color scheme with blue accent colors
- Responsive grid layouts that adapt to different screen sizes
- Interactive animations on hover and focus states
- Status indicators with appropriate colors (green for completed, red for failed, blue for active, yellow for delayed, orange for paused, purple for waiting-children)
- Progress bars for active jobs
- Icon integration using Lucide React for consistency

#### 📱 User Experience Features

- Responsive design that works on desktop and mobile
- Real-time status updates simulation
- Clear navigation with active tab indicators
- Notification system with badge indicators
- Search and filtering capabilities
- Inline validation for forms

#### 🔐 Security & Authentication

- JWT token-based authentication framework
- API key management with permission scoping
- Secure display of sensitive information
- User profile integration

The interface should follow modern web design trends with a clean, professional appearance that would make users stop and say "wow!" The layout is intuitive, the interactions are smooth, and the visual hierarchy clearly guides users through their workflow management tasks.

### Technology Stack

- Programming Language: JavaScript
- Frontend Framework: React
- State Management: Redux
- Styling: TailWind CSS, lucide 
- API Requests: SWR React Hooks for Data Fetching
- Testing: vitest
- Real-Time Communication: Socket.IO 
- Development Environment: vite
- Additional Tools: ESLint, Prettier, React Router V7 framework

