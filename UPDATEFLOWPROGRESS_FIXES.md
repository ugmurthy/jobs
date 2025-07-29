# UpdateFlowProgress Fixes - Simplified Approach

## Overview

This document outlines the simplified approach to fix the critical issues in `updateFlowProgress` based on WebSocket event-driven job tracking.

## Current Issues Identified

### 🚨 Issue 1: Job Count Mismatch

- **Problem**: Summary counts don't match total because only updated jobs are tracked in `progress.jobs`
- **Current**: `waiting: totalJobs` initially, but as jobs update, waiting count becomes 0 even if jobs haven't been processed
- **Result**: `sum(all_status_counts) ≠ total`

### 🚨 Issue 2: Premature Flow Completion

- **Problem**: Flow status becomes "completed" when only some jobs are completed
- **Root Cause**: `determineFlowStatus` only checks tracked jobs, not all jobs in the flow
- **Example**: Flow with 5 jobs, only 1 completed → Flow shows as "completed" ❌

### 🚨 Issue 3: Missing Job Metadata

- **Problem**: Jobs don't have name/queueName in progress tracking
- **Impact**: Poor visibility into which specific jobs are running/completed

## Simplified Solution Approach

### 1. Simple Job Initialization

```typescript
// KEEP SIMPLE: Initialize all jobs as 'waiting'
private initializeProgress(flowData: CreateFlowRequest): FlowProgress {
  const totalJobs = this.countTotalJobs(flowData);
  return {
    jobs: {}, // Start empty - populate via WebSocket events
    summary: {
      total: totalJobs,
      completed: 0,
      failed: 0,
      delayed: 0,
      active: 0,
      waiting: totalJobs, // All jobs start as waiting
      "waiting-children": 0,
      paused: 0,
      stuck: 0,
      percentage: 0,
    },
  };
}
```

### 2. WebSocket Event-Driven Updates

Use existing WebSocket events to track job progress:

#### A. Progress Event Handler

```typescript
// Add to jobEvents.ts - track job progress
queueEvents.on("progress", async ({ jobId, data }) => {
  const job = await queue.getJob(jobId);
  if (job?.data.flowId) {
    await flowService.updateFlowProgress(job.data.flowId, {
      jobId,
      status: "active", // Job is now active
      progress: data,
    });
  }
});
```

#### B. Active Event Handler (NEW)

```typescript
// Add to jobEvents.ts - track when jobs become active
queueEvents.on("active", async ({ jobId }) => {
  const job = await queue.getJob(jobId);
  if (job?.data.flowId) {
    await flowService.updateFlowProgress(job.data.flowId, {
      jobId,
      status: "active",
    });
  }
});
```

#### C. Enhanced Completed/Failed Handlers

```typescript
// Already exists but enhance with job metadata
queueEvents.on("completed", async ({ jobId, returnvalue }) => {
  const job = await queue.getJob(jobId);
  if (job?.data.flowId) {
    await flowService.updateFlowProgress(job.data.flowId, {
      jobId,
      status: "completed",
      result: returnvalue,
      jobName: job.name, // ADD: Job metadata
      queueName: job.opts.queue, // ADD: Queue metadata
    });
  }
});
```

### 3. Fixed Progress Calculation Logic

#### Key Fix: Proper Waiting Job Reduction

```typescript
private calculateProgress(
  currentProgress: FlowProgress,
  update: FlowUpdateRequest
): FlowProgress {
  const updatedJobs = { ...currentProgress.jobs };

  // Track if this is a new job (not previously tracked)
  const isNewJob = !updatedJobs[update.jobId];

  // Update/add job
  updatedJobs[update.jobId] = {
    name: update.jobName || updatedJobs[update.jobId]?.name || 'Unknown',
    queueName: update.queueName || updatedJobs[update.jobId]?.queueName || 'Unknown',
    status: update.status as BullMQJobStatus,
    result: update.result,
    error: update.error,
    completedAt: update.status === "completed" || update.status === "failed"
      ? new Date().toISOString()
      : undefined,
  };

  // Calculate status counts from tracked jobs
  const trackedJobStatuses = Object.values(updatedJobs).map(job => job.status);
  const trackedCounts = {
    completed: trackedJobStatuses.filter(s => s === "completed").length,
    failed: trackedJobStatuses.filter(s => s === "failed").length,
    delayed: trackedJobStatuses.filter(s => s === "delayed").length,
    active: trackedJobStatuses.filter(s => s === "active").length,
    "waiting-children": trackedJobStatuses.filter(s => s === "waiting-children").length,
    paused: trackedJobStatuses.filter(s => s === "paused").length,
    stuck: trackedJobStatuses.filter(s => s === "stuck").length,
  };

  // ✅ KEY FIX: Calculate waiting jobs correctly
  const trackedJobsCount = Object.keys(updatedJobs).length;
  const waitingJobs = Math.max(0, currentProgress.summary.total - trackedJobsCount);

  const summary = {
    total: currentProgress.summary.total,
    ...trackedCounts,
    waiting: waitingJobs, // ✅ FIXED: Proper waiting calculation
    percentage: Math.round((trackedCounts.completed / currentProgress.summary.total) * 100),
  };

  // ✅ VALIDATION: Ensure counts add up
  const totalCounted = Object.values(trackedCounts).reduce((sum, count) => sum + count, 0) + waitingJobs;
  if (totalCounted !== summary.total) {
    logger.warn(`Progress count mismatch: counted ${totalCounted}, expected ${summary.total}`);
  }

  return { jobs: updatedJobs, summary };
}
```

### 4. Fixed Flow Status Determination

#### Key Fix: Consider All Jobs, Not Just Tracked Ones

```typescript
private determineFlowStatus(progress: FlowProgress): FlowStatus {
  const trackedJobStatuses = Object.values(progress.jobs).map(job => job.status);
  const totalJobs = progress.summary.total;
  const trackedJobsCount = trackedJobStatuses.length;

  // ✅ KEY FIX: Account for untracked jobs (still waiting)
  const hasWaitingJobs = progress.summary.waiting > 0;
  const hasActiveJobs = trackedJobStatuses.some(status =>
    ["active", "delayed", "waiting-children", "paused"].includes(status)
  );
  const hasFailed = trackedJobStatuses.some(status => status === "failed");
  const hasStuck = trackedJobStatuses.some(status => status === "stuck");

  // ✅ CRITICAL FIX: Flow completed only when ALL jobs are completed
  const completedCount = trackedJobStatuses.filter(s => s === "completed").length;
  const allJobsCompleted = completedCount === totalJobs && !hasWaitingJobs;

  if (hasFailed || hasStuck) return "failed";
  if (allJobsCompleted) return "completed"; // ✅ Only when ALL jobs done
  if (hasActiveJobs || trackedJobsCount > 0) return "running";

  return "pending";
}
```

### 5. Enhanced FlowUpdateRequest Interface

```typescript
// Update FlowUpdateRequest to include job metadata
export interface FlowUpdateRequest {
  jobId: string;
  status: BullMQJobStatus; // Support all BullMQ statuses
  result?: Record<string, any>;
  error?: Record<string, any>;
  jobName?: string; // NEW: Job metadata
  queueName?: string; // NEW: Queue metadata
  progress?: number; // NEW: Job progress
}
```

## Implementation Steps

### Phase 1: Fix Core Logic ✅ PRIORITY

1. Update `calculateProgress` method with proper waiting job calculation
2. Fix `determineFlowStatus` to consider all jobs
3. Add validation to ensure counts match

### Phase 2: Enhance WebSocket Integration

1. Add 'active' event handler to jobEvents.ts
2. Enhance existing 'completed'/'failed' handlers with job metadata
3. Update FlowUpdateRequest interface

### Phase 3: Testing & Validation

1. Create comprehensive tests
2. Add logging for debugging
3. Monitor production behavior

## Key Benefits of This Approach

1. **Simple**: No complex job pre-population or ID mapping
2. **Event-Driven**: Uses existing WebSocket infrastructure
3. **Accurate**: Proper job counting and status determination
4. **Incremental**: Jobs are tracked as they become active
5. **Backward Compatible**: Works with existing flows

## Migration Considerations

- Existing flows will work correctly as jobs become active
- No database migration required
- Gradual improvement as jobs progress through the system
- Maintains existing WebSocket event structure
