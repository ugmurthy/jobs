# BullMQ Flow Implementation Plan (V4)

This document outlines the plan to implement a backend API for managing BullMQ flows. This version includes all previous clarifications and adds a section on future architectural unification.

### 1. High-Level Architecture

The target architecture for all job processing will follow this pattern:

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
        D[Queue]
        E[Producer]
        F[Worker(s) - Decoupled Process(es)]
    end

    subgraph Database (Single Source of Truth)
        G[Prisma]
        H[SQLite/Postgres]
    end

    A -- HTTP Requests --> B;
    B -- Add Job to Queue --> E;
    E -- Adds Job to --> D;
    F -- Processes Jobs from --> D;
    F -- Updates Job Status in --> G;
    G -- CRUD Operations --> H;
    G -- Triggers event --> C;
    C -- Real-time Updates --> A;
```

### 2. Clarifications & Core Concepts

(As detailed in V3)

### 3. Directory Structure

(As detailed in V3)

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

(As detailed in V3)

### 6. BullMQ Worker Implementation (`src/workers/flowWorker.ts`)

(As detailed in V3, with full code example)

### 7. Implementation Steps

1.  **Database Migration:** Create and run a Prisma migration for `Flow` and `FlowJob`.
2.  **API Routes & Docs:** Implement routes and OpenAPI schemas for flows.
3.  **Flow Service:** Implement business logic using `FlowProducer`.
4.  **WebSocket Events:** Integrate real-time events for flows.
5.  **BullMQ Worker:** Implement the `flowWorker`.
6.  **Integration:** Wire up all new components.

### 8. Future Architectural Unification (Post-Flow Implementation)

This section documents the plan to refactor existing queues to align with the robust `Worker -> Database -> WebSocket` pattern established by the `flowQueue` implementation. This will be handled as a separate follow-up task.

**Objective:** Ensure all stateful jobs are tracked in the database, making it the single source of truth across the entire system.

**Affected Queues:**
*   `jobQueue`
*   `schedQueue`
*   `webhooks`

**Proposed Refactoring Steps:**

1.  **Extend Database Schema:**
    *   Create a generic `Job` model in `prisma/schema.prisma` to track the state of individual, non-flow jobs. This model will be similar to `FlowJob` but without the relation to a `Flow`.

2.  **Refactor Workers:**
    *   **`jobQueue` Worker:** Modify its worker to find or create a `Job` record in the database at the start of processing and update its `status`, `result`, or `error` upon completion.
    *   **`schedulerWorker`:** This worker's logic will remain mostly the same, but the jobs it creates in `jobQueue` will now be tracked via this new system.
    *   **`webhookWorker`:** The trigger to add a job to the `webhooks` queue should originate from a database event/hook (e.g., after a `Job` or `FlowJob` status is updated) rather than being called imperatively from various places in the code.

3.  **Unify WebSocket Events:**
    *   Ensure that all real-time notifications for *any* job type are triggered consistently by database updates, providing a unified event pipeline.

This phased approach ensures the immediate delivery of the new flow feature while providing a clear, documented path to a more robust and maintainable system architecture.