# Jobs Client

> **⚠️ DISCLAIMER: WORK IN PROGRESS ⚠️**
> This project is currently under active development and is not ready for production use.
> Features may be incomplete, contain bugs, or undergo significant changes without notice.
> Use at your own risk in development or testing environments only.

A modern, responsive web client for managing jobs and scheduled tasks.

## Features

### Job Management

- **Job List View**: Browse all jobs with filtering and sorting options
- **Job Details**: View comprehensive information about each job including status, runtime, and results
- **Job Submission**: Submit new jobs with custom parameters and data
- **Status Monitoring**: Real-time updates on job status (pending, running, completed, failed)

### Scheduler

- **Scheduled Jobs**: View and manage all scheduled jobs in a centralized dashboard
- **Flexible Scheduling Options**:
  - **Cron Expressions**: Schedule jobs using standard cron syntax (e.g., `0 0 * * *` for daily at midnight)
  - **Interval-based**: Run jobs at regular intervals (e.g., every hour, every 30 minutes)
  - **One-time Execution**: Schedule jobs to run once at a specific date and time
- **Job Control**:
  - Enable/disable scheduled jobs
  - Run scheduled jobs immediately
  - Edit existing schedules
  - Delete scheduled jobs
- **Advanced Options**:
  - Set job priority
  - Configure retry attempts
  - Customize job data parameters

### Authentication & Security

- **User Authentication**: Secure login/logout functionality
- **API Key Support**: Alternative authentication using API keys
- **Protected Routes**: Restricted access to authenticated users only

### User Interface

- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark/Light Mode**: Support for different theme preferences
- **Toast Notifications**: User-friendly feedback for actions and errors
- **Form Validation**: Comprehensive input validation with error messages
- **Interactive Tables**: Sortable and filterable data tables

## Technical Stack

- **Frontend Framework**: React with TypeScript
- **State Management**: Redux with Redux Toolkit
- **Routing**: React Router for navigation
- **API Communication**: Fetch API with custom wrapper for authentication and error handling
- **Styling**: Tailwind CSS for responsive design
- **Form Handling**: Custom validation with schema-based approach

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the jobs-client directory
3. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

### Development

Start the development server:

```
npm run dev
```

or

```
yarn dev
```

### Building for Production

Build the application for production:

```
npm run build
```

or

```
yarn build
```

## Configuration

The client can be configured to connect to different API endpoints by modifying the `.env` file:

```
VITE_API_BASE_URL=/api
```

## API Integration

The client integrates with the following API endpoints:

- **Jobs API**:
  - GET /jobs - List all jobs
  - GET /jobs/{jobId} - Get job details
  - POST /jobs/submit - Submit a new job
  - GET /jobs/{jobId}/logs - Get job logs

- **Scheduler API**:
  - GET /jobs/schedule - List scheduled jobs
  - POST /jobs/schedule - Create scheduled job
  - GET /jobs/schedule/{schedulerId} - Get scheduled job details
  - DELETE /jobs/schedule/{schedulerId} - Delete scheduled job

## Error Handling

The client includes robust error handling for:
- API communication errors
- Authentication failures
- Form validation errors
- Runtime exceptions

Errors are displayed to users via toast notifications and inline form messages.