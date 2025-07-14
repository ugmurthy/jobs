# Revised Implementation Plan: Dynamic and Validated Queue Routing

This plan outlines the steps to refactor the backend to use a pre-defined list of queues, make them accessible via the API, and update the routes to be queue-aware.

## 1. Executive Summary

The implementation will be updated to use a fixed list of queue names defined in a configuration file. This prevents queue proliferation and centralizes management. A new `GET /queues` endpoint will be added for the frontend to discover available queues. All job-related routes will be updated to accept a `queueName` parameter, which will be validated against the pre-defined list.

## 2. Finalized Route Structure

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/queues` | **(New)** Retrieves a list of all available queue names. |
| `POST` | `/jobs/:queueName/submit` | Submits a job to the specified, validated queue. |
| `GET` | `/jobs/:queueName/job/:jobId` | Retrieves a specific job from the specified queue. |
| `GET` | `/jobs/:queueName` | Retrieves all jobs from the specified queue. |
| `DELETE` | `/jobs/:queueName/job/:jobId` | Deletes a specific job from the specified queue. |
| `POST` | `/jobs/:queueName/schedule` | Schedules a job in the specified queue. |
| `GET` | `/jobs/:queueName/schedule` | Retrieves all scheduled jobs from the specified queue. |
| `DELETE` | `/jobs/:queueName/schedule/:jobId` | Deletes a specific scheduled job from the specified queue. |

## 3. Queue Management Strategy (Pre-defined Queues)

A new configuration file will be created to define the list of valid queue names. This ensures that only specific, pre-approved queues can be used.

*   **File:** `src/config/queues.ts`
*   **Content:** This file will export an array of allowed queue names.
    ```typescript
    export const allowedQueues = [
      'jobQueue', 
      'webhooks', 
      'schedQueue'
    ];
    ```

## 4. File-by-File Implementation Details

Here are the specific changes required for each file:

### A. `src/config/queues.ts` (New)
*   **Objective:** Create a centralized configuration for allowed queue names.
*   **Action:** Create the file and add the `allowedQueues` export as described above.

### B. `src/config/bull.ts` (Updated)
*   **Objective:** Replace the hardcoded queue initializations with a dynamic, memoized function that validates the queue name.
*   **Action:**
    1.  Remove the individual `jobQueue`, `webHookQueue`, and `schedQueue` exports.
    2.  Create a memoized `getQueue(queueName: string)` function. This function will:
        *   Check if `queueName` exists in the `allowedQueues` from `src/config/queues.ts`.
        *   If valid, return a cached `Queue` instance or create a new one.
        *   If invalid, throw an error.
    3.  Create similar `getQueueEvents` and `getJobScheduler` functions.

### C. `src/middleware/validateQueue.ts` (New)
*   **Objective:** Create a reusable middleware to validate the `:queueName` parameter in routes.
*   **Action:**
    *   Create a middleware function that checks if `req.params.queueName` is included in the `allowedQueues` list.
    *   If the queue name is invalid, it will respond with a `400 Bad Request` error.

### D. `src/routes/jobs.ts` & `src/routes/scheduler.ts` (Updated)
*   **Objective:** Update routes to use the new dynamic queue structure and validation middleware.
*   **Action:**
    1.  Import and apply the new `validateQueue` middleware to all routes that include the `:queueName` parameter.
    2.  Update all route paths (e.g., from `/submit` to `/:queueName/submit`).
    3.  In each route handler, use `getQueue(req.params.queueName)` to interact with the correct BullMQ queue.

### E. `src/routes/queues.ts` (New)
*   **Objective:** Implement the `GET /queues` endpoint.
*   **Action:**
    1.  Create a new router file.
    2.  Define a route for `GET /` that imports `allowedQueues` from `src/config/queues.ts` and returns it as a JSON response.

### F. `src/routes/index.ts` (Updated)
*   **Objective:** Register the new `queues` routes.
*   **Action:**
    1.  Import the router from `src/routes/queues.ts`.
    2.  Register it with the application using `app.use('/queues', queueRoutes);`.
    3.  The base path for jobs routes will now be `app.use('/jobs', authenticate, jobsRoutes);`, and the `/:queueName` part will be handled within `jobs.ts`.

### G. `src/docs/` (Updated)
*   **Objective:** Update API documentation.
*   **Action:**
    1.  Update the Swagger definition (`swagger.json` and related schemas) to reflect all route changes.
    2.  Add the new `GET /queues` endpoint.
    3.  Ensure the `:queueName` path parameter is documented for all relevant endpoints.