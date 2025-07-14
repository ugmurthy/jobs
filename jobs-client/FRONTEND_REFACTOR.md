## The backend route have changed
Refer : swagger.json

## Align Frontend to backend routes

### Dashboard
- Should now show list of queues and their statistics
- the recent jobs continues to show what it was showing before.
- the list of queues will be presented as rows containing
     - queuename, number of jobs by status i.e. completed, failed, paused etc

### Jobs and Schedulers
- on clicking queuename in the dashboard - the frontend will display list of jobs in that queue as it was showing prior to this change. i.e. jobs will show as per earlier route /jobs for all queues except queuename = 'schedQueue'

- provide a link or icon to return to dashboard.

### Implementation Details:

- **`dashboardSlice.ts`**: Updated to include `QueueStats`, `SchedulerStats` and `WebhookStats` interfaces. The `DashboardState` and `fetchDashboardStats` thunk were updated to handle the new data structure from the `/dashboard/stats` endpoint.
- **`DashboardPage.tsx`**: Updated to display the new queue, scheduler, and webhook statistics. A new table for queue stats and cards for the other stats were added.
- **`jobsSlice.ts`**: Updated to be queue-aware. `queueName` was added to the jobs state and the thunks were updated to use the `queueName` in their API calls.
- **`JobsPage.tsx`**: Updated to use the `queueName` from the URL to fetch and display jobs for that specific queue. A link to navigate back to the dashboard was also added.
- **`schedulerSlice.ts`**: Updated to be queue-aware. `queueName` was added to the scheduler state and the thunks were updated to use the `queueName` in their API calls.
- **`SchedulerPage.tsx`**: Updated to use the `queueName` from the URL to fetch and display scheduled jobs for that specific queue. A link to navigate back to the dashboard was also added.
- **`App.tsx`**: Updated the routes for the jobs and scheduler pages to include the `queueName` parameter.

### Alternatives

Suggest any better alternative to the flow above.
