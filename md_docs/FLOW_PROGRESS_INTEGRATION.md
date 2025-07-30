# Flow Progress Integration

This document describes the automatic flow progress integration implemented in the job event handlers.

## Overview

The job event system now automatically updates flow progress when jobs that belong to flows complete or fail. This integration provides real-time flow tracking without requiring manual intervention from job handlers.

## How It Works

### Automatic Detection

- Jobs that belong to flows are identified by the presence of `flowId` in their job data (`job.data.flowId`)
- This `flowId` is automatically injected by the `EnhancedFlowProducer` when flows are created

### Event Integration

The integration is implemented in `src/events/jobEvents.ts` for two key events:

#### 1. Job Completed Event

```javascript
queueEvents.on("completed", async ({ jobId, returnvalue }) => {
  // ... existing code ...

  // Update flow progress if this job belongs to a flow
  if (flowId) {
    await flowService.updateFlowProgress(flowId, {
      jobId,
      status: "completed",
      result:
        typeof returnvalue === "object" ? returnvalue : { value: returnvalue },
    });
  }

  // ... rest of event handling ...
});
```

#### 2. Job Failed Event

```javascript
queueEvents.on("failed", async ({ jobId, failedReason }) => {
  // ... existing code ...

  // Update flow progress if this job belongs to a flow
  if (flowId) {
    await flowService.updateFlowProgress(flowId, {
      jobId,
      status: "failed",
      error:
        typeof failedReason === "object"
          ? failedReason
          : { message: failedReason },
    });
  }

  // ... rest of event handling ...
});
```

## Features

### ✅ Automatic Flow Tracking

- No manual intervention required from job handlers
- Works with any job that has a `flowId` in its data

### ✅ Real-time Updates

- Flow progress is updated immediately when jobs complete/fail
- WebSocket events are automatically emitted for flow updates

### ✅ Error Handling

- Flow progress update failures don't break job event processing
- Comprehensive error logging for debugging

### ✅ Type Safety

- Proper type conversion for `result` and `error` fields
- Handles both string and object return values

### ✅ Backward Compatibility

- Non-flow jobs continue to work unchanged
- Existing job handlers require no modifications

## Data Flow

```
Job Completes/Fails
       ↓
Job Event Handler
       ↓
Check for flowId
       ↓
Call updateFlowProgress()
       ↓
Update Database
       ↓
Emit WebSocket Events
       ↓
Client Receives Updates
```

## Benefits

1. **Automatic Tracking**: Flows are tracked without manual code in job handlers
2. **Real-time Updates**: Clients receive immediate progress updates
3. **Centralized Logic**: All flow progress logic is in one place
4. **Error Resilience**: Flow update failures don't affect job processing
5. **Easy Debugging**: Comprehensive logging for troubleshooting

## Testing

A test script is available at `src/tests/flow-integration.test.js` to verify the integration:

```bash
node src/tests/flow-integration.test.js
```

This test:

- Creates a sample flow with child jobs
- Monitors automatic progress updates
- Verifies flow status changes

## Configuration

No additional configuration is required. The integration works automatically for:

- All queues defined in `allowedQueues`
- Any job with `flowId` in its data
- Both completed and failed job events

## Monitoring

Monitor the integration through logs:

```
Flow ${flowId} progress updated for completed job ${jobId}
Flow ${flowId} progress updated for failed job ${jobId}
```

Error logs will indicate any issues:

```
Error updating flow progress for job ${jobId} in flow ${flowId}: ${error}
```

## Implementation Details

### Type Conversions

- `returnvalue` (string) → `{ value: returnvalue }` (Record<string, any>)
- `failedReason` (string) → `{ message: failedReason }` (Record<string, any>)

### Error Isolation

Flow progress update errors are caught and logged separately to prevent disruption of:

- Socket.IO event emissions
- Webhook queue additions
- Other job event processing

### Performance Impact

- Minimal overhead: Only one additional database call per flow job
- Conditional execution: Only runs for jobs with `flowId`
- Async execution: Doesn't block other event processing
