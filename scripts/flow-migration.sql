-- Flow Refactor Migration Script
-- This script migrates from the old dual-table structure (Flow + FlowJob) 
-- to the new unified Flow table structure

-- Step 1: Create backup of existing data
CREATE TABLE IF NOT EXISTS "Flow_backup" AS SELECT * FROM "Flow";
CREATE TABLE IF NOT EXISTS "FlowJob_backup" AS SELECT * FROM "FlowJob";

-- Step 2: Create new unified Flow table
CREATE TABLE "Flow_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flowname" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "queueName" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "jobStructure" TEXT NOT NULL,
    "rootJobId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" TEXT NOT NULL DEFAULT '{}',
    "result" TEXT,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    CONSTRAINT "Flow_new_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Step 3: Data migration with proper JSON aggregation
INSERT INTO "Flow_new" (
    id, flowname, name, queueName, userId, jobStructure,
    status, progress, createdAt, updatedAt
)
SELECT
    CAST(f.id AS TEXT) as id,
    f.name as flowname,  -- Use existing name as flowname
    f.name,              -- Keep original name
    COALESCE(
        (SELECT fj.queueName FROM "FlowJob" fj WHERE fj.flowId = f.id LIMIT 1), 
        'flowQueue'
    ) as queueName,
    f.userId,
    COALESCE(
        (SELECT json_group_array(
            json_object(
                'jobId', fj.jobId,
                'queueName', fj.queueName,
                'data', fj.data,
                'opts', fj.opts,
                'status', fj.status,
                'result', fj.result,
                'error', fj.error,
                'children', fj.children
            )
        ) FROM "FlowJob" fj WHERE fj.flowId = f.id),
        '[]'
    ) as jobStructure,
    'completed' as status,  -- Assume existing flows are completed
    json_object(
        'jobs', json_object(),
        'summary', json_object(
            'total', COALESCE((SELECT COUNT(*) FROM "FlowJob" fj WHERE fj.flowId = f.id), 0),
            'completed', COALESCE((SELECT COUNT(*) FROM "FlowJob" fj WHERE fj.flowId = f.id), 0),
            'failed', 0,
            'delayed', 0,
            'active', 0,
            'waiting', 0,
            'waiting-children', 0,
            'paused', 0,
            'stuck', 0,
            'percentage', 100
        )
    ) as progress,
    f.createdAt,
    f.updatedAt
FROM "Flow" f;

-- Step 4: Drop old tables and rename new one
PRAGMA foreign_keys=off;
DROP TABLE "FlowJob";
DROP TABLE "Flow";
ALTER TABLE "Flow_new" RENAME TO "Flow";
PRAGMA foreign_keys=on;

-- Step 5: Create indexes for performance
CREATE INDEX "Flow_userId_status_idx" ON "Flow"("userId", "status");
CREATE INDEX "Flow_flowname_idx" ON "Flow"("flowname");

-- Step 6: Verify migration
SELECT 
    COUNT(*) as total_flows,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_flows,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_flows,
    COUNT(CASE WHEN status = 'running' THEN 1 END) as running_flows,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_flows
FROM "Flow";

-- Step 7: Sample query to verify data integrity
SELECT 
    id,
    flowname,
    name,
    queueName,
    status,
    json_extract(progress, '$.summary.total') as total_jobs,
    json_extract(progress, '$.summary.completed') as completed_jobs,
    json_extract(progress, '$.summary.percentage') as percentage,
    createdAt,
    updatedAt
FROM "Flow"
LIMIT 5;

-- Migration completed successfully
-- The backup tables (Flow_backup, FlowJob_backup) can be dropped after verification
-- DROP TABLE "Flow_backup";
-- DROP TABLE "FlowJob_backup";