# 🚀 JobRunner: A Modern Job Queue Management System

> **⚠️ DISCLAIMER: WORK IN PROGRESS ⚠️**
> This project is currently under active development and is not ready for production use.
> Features may be incomplete, contain bugs, or undergo significant changes without notice.
> Use at your own risk in development or testing environments only.

<p align="center">
  <img src="_assets/logo.gif" alt="JobRunner Logo" width="900" height="250">
</p>

JobRunner is a powerful, modular, and extensible system for job queue management, designed for reliability, scalability, and an excellent developer experience. It includes a robust backend service, a dynamic job handler system, and a modern web-based client for managing jobs and schedules.

---

## Backend Service

The JobRunner backend is a Node.js/TypeScript service for handling asynchronous job processing. It offers a comprehensive API for job submission, monitoring, and management, with real-time updates via WebSockets and a visual dashboard for queue monitoring.

### Key Features

- **Modular Architecture**: Clean separation of concerns for improved maintainability.
- **RESTful API**: Comprehensive endpoints for job, webhook, and API key management.
- **Dual Authentication**: Secure access with both JWT and API Key authentication.
- **Reliable Job Processing**: Utilizes BullMQ for robust job queue management.
- **Flexible Job Scheduling**: Supports cron expressions and repeat intervals.
- **Real-time Updates**: WebSocket support for instant updates on job progress.
- **Visual Dashboard**: Integrated Bull Board UI for at-a-glance queue monitoring.
- **Type Safety**: Fully implemented in TypeScript for a more stable codebase.
- **Job Flows**: Define and manage complex, multi-step job workflows.

**[➡️ Learn more about the backend service in the `README-job-backend.md`](README-job-backend.md)**

---

## Job Handler System

The job handler system provides a modular and extensible way to process tasks. It dynamically discovers and loads job handlers at runtime, supports hot reloading for seamless updates, and can be extended with a powerful plugin system.

### Key Features

- **Dynamic Handler Registration**: Handlers are automatically discovered and loaded.
- **Hot Reloading**: Update job handlers without restarting the worker.
- **Extensible with Plugins**: Add new functionality through npm packages.
- **Multi-Queue Support**: Process jobs from multiple queues with different configurations.
- **Centralized Configuration**: Easily enable, disable, and configure handlers.

**[➡️ Learn more about the job handler system in the `job-handlers/README-job-handlers.md`](job-handlers/README-job-handlers.md)**

---

## Jobs Client (Frontend)

The Jobs Client is a modern, responsive web interface for interacting with the JobRunner backend. It provides a user-friendly way to manage jobs, view scheduled tasks, and monitor the system.

### Key Features

- **Comprehensive Job Management**: Browse, view details, and submit jobs with ease.
- **Real-time Status Monitoring**: Live updates on job status.
- **Advanced Scheduler**: Manage scheduled jobs with support for cron expressions, intervals, and one-time execution.
- **Secure Authentication**: Supports both user login and API key authentication.
- **Modern UI/UX**: Includes a responsive design, dark/light modes, and toast notifications.

**[➡️ Learn more about the jobs client in the `jobs-client/README-jobs-clients.md`](jobs-client/README-jobs-clients.md)**

---

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