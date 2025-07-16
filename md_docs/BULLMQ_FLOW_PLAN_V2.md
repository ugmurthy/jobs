# BullMQ Flow Implementation Plan (V2)

This document outlines the plan to implement a backend API for managing BullMQ flows, enabling parent-child job relationships with return value passing, and providing real-time updates via WebSockets. This version includes clarifications based on user feedback.

### 1. High-Level Architecture

The following diagram illustrates the architecture of the flow management system:

```mermaid
graph TD
    subgraph Client
        A[User Interface]
    end

    subgraph Backend API
        B[REST API]
        C[WebSocket Server]
    end

    subgraph BullMQ
        D[flowQueue]
        E[FlowProducer]
        F[Worker(s) - Decoupled Process(es)]
    end

    subgraph Database (Single Source of Truth)
        G[Prisma]
        H[SQLite/Postgres]
    end

    A -- HTTP Requests --> B;
    B -- Add Flow to Queue --> E;
    E -- Adds Flow to --> D;
    F -- Processes Jobs from --> D;
    F -- Updates Job Status in --> G;
    G -- CRUD Operations --> H;
    G -- Triggers event --> C;
    C -- Real-time Updates --> A;
```

### 2. Clarifications

#### 2.1. `FlowProducer` and Return Values
The `FlowProducer` is used to create a tree of jobs. Child jobs execute first, and their return values are passed to their parent job. This allows for creating complex workflows where steps depend on the output of previous steps. For a detailed explanation, refer to the conversation history.

#### 2.2. Decoupled Worker
The `flowWorker` is designed to run as a separate, independent process for scalability. For initial development, it will be initialized within the main backend, but it can be detached and run separately without code modification.

#### 2.3. Database as the Single Source of Truth
The Prisma-managed database is the single source of truth for all flow and job data. This is crucial for:
- **Persistence:** Data survives server restarts and crashes.
- **State Recovery:** Clients can fetch the current state upon connection.
- **History and Auditing:** Provides a queryable log of all activities.

WebSockets are the *notification mechanism* to inform clients of changes to the data in the database, not the data store itself.

### 3. Directory Structure

The following files will be created or modified:

*   **New Files:**
    *   `src/routes/flow.ts`: Defines the API routes for managing flows.
    *   `src/docs/routes/flow-routes.ts`: OpenAPI documentation for flow routes.
    *   `src/docs/schemas/flow-schema.ts`: OpenAPI schemas for flow data structures.
    *   `src/workers/flowWorker.ts`: The BullMQ worker to process jobs in the `flowQueue`.
    *   `src/services/flowService.ts`: Business logic for managing flows.
*   **Modified Files:**
    *   `src/config/queues.ts`: Add `flowQueue` to the list of allowed queues.
    *   `src/docs/routes/index.ts`: Export the new flow routes documentation.
    *   `src/workers/index.ts`: Import and initialize the `flowWorker`.
    *   `prisma/schema.prisma`: Add `Flow` and `FlowJob` models.

### 4. Database Schema

The following models will be added to the [`prisma/schema.prisma`](prisma/schema.prisma) file.

```prisma
model Flow {
  id        String    @id @default(cuid())
  name      String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  jobs      FlowJob[]
  userId    String
  user      User      @relation(fields: [userId], references: [id])
}

model FlowJob {
  id        String   @id @default(cuid())
  jobId     String   @unique
  flowId    String
  flow      Flow     @relation(fields: [flowId], references: [id])
  queueName String
  data      Json
  opts      Json
  status    String   @default("waiting")
  result    Json?
  error     Json?
  children  Json?    // Store children job keys
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 5. API Specification

The following RESTful API endpoints will be created to manage flows.

#### 5.1. Flow APIs

*   **`POST /flows`**
    *   **Description:** Create a new flow with a tree of jobs.
    *   **Request Body:** `CreateFlowRequest`
    *   **Response:** `FlowResponse`

*   **`GET /flows`**
    *   **Description:** Get a list of all flows.
    *   **Response:** `FlowResponse[]`

*   **`GET /flows/:id`**
    *   **Description:** Get a single flow by its ID.
    *   **Response:** `FlowResponse`

*   **`GET /flows/:id/jobs`**
    *   **Description:** Get all jobs associated with a flow.
    *   **Response:** `FlowJobResponse[]`

#### 5.2. API Data Structures

```typescript
// schemas/flow-schema.ts

// A job in a flow
interface FlowJobData {
  name: string;
  queueName: string;
  data?: any;
  opts?: any;
  children?: FlowJobData[];
}

// Request to create a new flow
interface CreateFlowRequest {
  name: string;
  queueName: string; // The queue for the root job
  data?: any; // Data for the root job
  opts?: any; // Options for the root job
  children?: FlowJobData[]; // Children jobs
}

// Response for a single flow
interface FlowResponse {
  id: string;
  name: string;
  createdAt: string;
}

// Response for a single job in a flow
interface FlowJobResponse {
  id: string;
  jobId: string;
  flowId: string;
  queueName: string;
  data: any;
  opts: any;
  status: string;
  result: any;
  error: any;
  createdAt: string;
  updatedAt: string;
}
```

### 6. WebSocket Integration

Real-time updates for flow and job status changes will be broadcasted via WebSockets.

*   **`flow:created`**: Emitted when a new flow is created.
    *   **Payload:** `FlowResponse`
*   **`flow:job:updated`**: Emitted when a job within a flow is updated.
    *   **Payload:** `FlowJobResponse`

### 7. BullMQ Configuration

*   **`src/config/queues.ts`**: Add `flowQueue` to the `allowedQueues` array.

    ```typescript
    export const allowedQueues = [
      'jobQueue',
      'webhooks',
      'schedQueue',
      'flowQueue'
    ];
    ```

*   **`src/workers/flowWorker.ts`**: The worker will process jobs added to `flowQueue`.

    ```typescript
    import { Job, Worker } from 'bullmq';
    import { logger } from '@ugm/logger';
    import { redis } from '../config/redis';

    export const flowWorker = new Worker('flowQueue', async (job: Job) => {
      logger.info(`Processing flow job ${job.id} with name ${job.name}`);
      // Business logic for the job
      // The return value will be passed to the parent job
      return { result: `Job ${job.id} completed` };
    }, { connection: redis });
    ```

### 8. Implementation Steps

1.  **Database Migration:** Create and run a Prisma migration to add the `Flow` and `FlowJob` tables.
2.  **API Routes:** Implement the flow routes in `src/routes/flow.ts`.
3.  **API Documentation:** Create OpenAPI documentation for the new routes.
4.  **Flow Service:** Implement the business logic for managing flows in `src/services/flowService.ts`.
5.  **WebSocket Events:** Integrate WebSocket events for real-time updates.
6.  **BullMQ Worker:** Implement the `flowWorker`.
7.  **Integration:** Wire up all the new components.