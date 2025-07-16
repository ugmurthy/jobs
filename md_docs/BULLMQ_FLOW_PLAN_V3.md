# BullMQ Flow Implementation Plan (V3)

This document outlines the plan to implement a backend API for managing BullMQ flows, enabling parent-child job relationships with return value passing, and providing real-time updates via WebSockets. This version includes clarifications and a detailed code example based on user feedback.

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
The `FlowProducer` is used to create a tree of jobs. Child jobs execute first, and their return values are passed to their parent job. This allows for creating complex workflows where steps depend on the output of previous steps.

#### 2.2. Decoupled Worker
The `flowWorker` is designed to run as a separate, independent process for scalability. For initial development, it will be initialized within the main backend, but it can be detached and run separately without code modification.

#### 2.3. Database as the Single Source of Truth
The Prisma-managed database is the single source of truth for all flow and job data. WebSockets are the *notification mechanism* to inform clients of changes to the data in the database, not the data store itself.

### 3. Directory Structure

*   **New Files:**
    *   `src/routes/flow.ts`
    *   `src/docs/routes/flow-routes.ts`
    *   `src/docs/schemas/flow-schema.ts`
    *   `src/workers/flowWorker.ts`
    *   `src/services/flowService.ts`
*   **Modified Files:**
    *   `src/config/queues.ts`
    *   `src/docs/routes/index.ts`
    *   `src/workers/index.ts`
    *   `prisma/schema.prisma`

### 4. Database Schema (`prisma/schema.prisma`)

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
  children  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 5. API Specification

#### 5.1. Flow APIs

*   **`POST /flows`**: Create a new flow.
*   **`GET /flows`**: Get a list of all flows.
*   **`GET /flows/:id`**: Get a single flow by its ID.
*   **`GET /flows/:id/jobs`**: Get all jobs for a flow.

#### 5.2. API Data Structures (`schemas/flow-schema.ts`)

```typescript
interface FlowJobData {
  name: string;
  queueName: string;
  data?: any;
  opts?: any;
  children?: FlowJobData[];
}

interface CreateFlowRequest {
  name: string;
  queueName: string;
  data?: any;
  opts?: any;
  children?: FlowJobData[];
}

// ... other response interfaces
```

### 6. BullMQ Worker Implementation (`src/workers/flowWorker.ts`)

The worker will process jobs for the `flowQueue`. A single worker can handle multiple job types by using a `switch` statement on `job.name`.

#### 6.1. Code Example: Parent-Child Data Passing

This example shows how a parent job (`watermark-video`) uses the return value from a child job (`download-video`).

```typescript
import { Job, Worker } from 'bullmq';
import { logger } from '@ugm/logger';
import { redis } from '../config/redis';

// Mock functions for demonstration
const downloadVideo = async (videoId: string) => {
  logger.info(`Downloading video ${videoId}...`);
  await new Promise(resolve => setTimeout(resolve, 2000));
  const filePath = `/tmp/videos/${videoId}.mp4`;
  logger.info(`Video ${videoId} downloaded to ${filePath}`);
  return { filePath }; // This is the return value
};

const generateThumbnail = async (filePath: string) => {
  logger.info(`Generating thumbnail for ${filePath}...`);
  await new Promise(resolve => setTimeout(resolve, 1000));
  const thumbnailPath = filePath.replace('.mp4', '.jpg');
  logger.info(`Thumbnail generated at ${thumbnailPath}`);
  return { thumbnailPath };
};

const applyWatermark = async (filePath: string, watermarkText: string) => {
  logger.info(`Applying watermark "${watermarkText}" to ${filePath}...`);
  await new Promise(resolve => setTimeout(resolve, 3000));
  const watermarkedPath = filePath.replace('.mp4', '_watermarked.mp4');
  logger.info(`Watermarked video saved to ${watermarkedPath}`);
  return { watermarkedPath };
};

export const flowWorker = new Worker('flowQueue', async (job: Job) => {
  logger.info(`Processing job "${job.name}" (ID: ${job.id})`);
  const childJobResults = job.dependencies;

  switch (job.name) {
    case 'download-video':
      // Child job: performs a task and returns a value.
      return await downloadVideo(job.data.videoId);

    case 'generate-thumbnail':
      // Another child job.
      return await generateThumbnail(job.data.videoId);

    case 'watermark-video':
      // PARENT job: runs after children complete.
      logger.info('Parent job "watermark-video" has received results from children:');
      console.log(childJobResults);

      const downloadResult = childJobResults['download-video'];
      if (!downloadResult || !downloadResult.filePath) {
        throw new Error('Video file path not received from child job.');
      }
      
      const { filePath } = downloadResult;
      const watermarkText = job.data.watermarkText || 'My Watermark';

      // Use the child's return value to perform its own task.
      return await applyWatermark(filePath, watermarkText);

    default:
      throw new Error(`Unknown job name: ${job.name}`);
  }
}, { connection: redis });

// Event listeners for logging and monitoring
flowWorker.on('completed', (job, returnValue) => {
    logger.info(`Job "${job.name}" (ID: ${job.id}) completed successfully.`);
    console.log('Return Value:', returnValue);
});

flowWorker.on('failed', (job, err) => {
    logger.error(`Job "${job.name}" (ID: ${job.id}) failed with error: ${err.message}`);
});
```

### 7. Implementation Steps

1.  **Database Migration:** Create and run a Prisma migration.
2.  **API Routes & Docs:** Implement routes and OpenAPI schemas.
3.  **Flow Service:** Implement business logic using `FlowProducer`.
4.  **WebSocket Events:** Integrate real-time events.
5.  **BullMQ Worker:** Implement the `flowWorker` as detailed above.
6.  **Integration:** Wire up all new components.