import prisma from '../lib/prisma.js';
import redis from '../config/redis.js';
import { logger } from '@ugm/logger';
import { getQueue } from '../config/bull.js';
import { EnhancedFlowProducer, generateFlowId } from './enhancedFlowProducer.js';
import { getFlowWebSocketService } from './flowWebSocketService.js';
export class FlowService {
    constructor() {
        this.enhancedFlowProducer = new EnhancedFlowProducer(redis);
    }
    async createFlow(flowData, userId) {
        const flowId = generateFlowId(); // Generate unique string ID
        logger.info(`Creating flow "${flowData.flowname}" (${flowId}) for user ${userId}`);
        // Create single database record
        const flow = await prisma.flow.create({
            data: {
                id: flowId,
                flowname: flowData.flowname,
                name: flowData.name,
                queueName: flowData.queueName,
                userId,
                jobStructure: this.buildJobStructure(flowData),
                status: "pending",
                progress: this.initializeProgress(flowData),
            },
        });
        // Add to BullMQ with flowId injection
        const rootJob = this.buildBullMQJob(flowData, userId);
        const jobNode = await this.enhancedFlowProducer.add(rootJob, flowId);
        // Update with root job ID
        await prisma.flow.update({
            where: { id: flowId },
            data: {
                rootJobId: jobNode.job.id,
                status: "running",
                startedAt: new Date(),
            },
        });
        logger.info(`Flow ${flowId} created and started with root job ${jobNode.job.id}`);
        const createdFlow = this.formatFlowResponse(await prisma.flow.findUnique({ where: { id: flowId } }));
        // Emit WebSocket event for flow creation
        const webSocketService = getFlowWebSocketService();
        if (webSocketService) {
            webSocketService.emitFlowCreated(createdFlow);
        }
        return createdFlow;
    }
    async updateFlowProgress(flowId, update) {
        const flow = await prisma.flow.findUnique({ where: { id: flowId } });
        if (!flow)
            throw new Error("Flow not found");
        const updatedProgress = this.calculateProgress(flow.progress, update);
        const newStatus = this.determineFlowStatus(updatedProgress);
        // Check if the jobId is the root job
        const isRootJob = flow.rootJobId === update.jobId;
        // Prepare update data
        const updateData = {
            progress: updatedProgress,
            status: newStatus,
            completedAt: newStatus === "completed" ? new Date() : undefined,
        };
        // If this is the root job, update flow result and error
        if (isRootJob) {
            if (update.result !== undefined) {
                updateData.result = update.result;
            }
            if (update.error !== undefined) {
                updateData.error = update.error;
            }
            logger.info(`Root job ${update.jobId} update - updating flow ${flowId} result and error`);
        }
        await prisma.flow.update({
            where: { id: flowId },
            data: updateData,
        });
        logger.info(`Flow ${flowId} progress updated: ${newStatus}${isRootJob ? ' (root job)' : ''}`);
        // Emit WebSocket events for flow updates
        const webSocketService = getFlowWebSocketService();
        if (webSocketService) {
            webSocketService.emitJobUpdate(flowId, update.jobId, update);
            webSocketService.emitFlowUpdate(flowId, updatedProgress, newStatus);
            // Check if flow is completed
            if (newStatus === "completed") {
                const updatedFlow = await prisma.flow.findUnique({ where: { id: flowId } });
                if (updatedFlow) {
                    webSocketService.emitFlowCompleted(flowId, updatedFlow.result, updatedFlow.completedAt?.toISOString() || new Date().toISOString());
                }
            }
        }
    }
    async getFlowById(flowId) {
        const flow = await prisma.flow.findUnique({ where: { id: flowId } });
        if (!flow)
            return null;
        return this.formatFlowResponse(flow);
    }
    async getFlows(userId) {
        const flows = await prisma.flow.findMany({
            where: userId ? { userId } : undefined,
            orderBy: { createdAt: 'desc' }
        });
        return flows.map(flow => this.formatFlowResponse(flow));
    }
    buildJobStructure(flowData) {
        // Build complete job hierarchy as JSON
        return {
            root: {
                name: flowData.name,
                queueName: flowData.queueName,
                data: flowData.data,
                opts: flowData.opts,
                children: flowData.children || [],
            },
        };
    }
    buildBullMQJob(flowData, userId) {
        const childJobs = flowData.children ? this.processFlowJobs(flowData.children, userId) : undefined;
        return {
            name: flowData.name,
            queueName: flowData.queueName,
            data: { ...flowData.data, userId },
            opts: flowData.opts,
            children: childJobs,
        };
    }
    processFlowJobs(jobs, userId) {
        return jobs.map(jobData => ({
            name: jobData.name,
            queueName: jobData.queueName,
            data: { ...jobData.data, userId },
            opts: jobData.opts,
            children: jobData.children ? this.processFlowJobs(jobData.children, userId) : undefined,
        }));
    }
    initializeProgress(flowData) {
        const totalJobs = this.countTotalJobs(flowData);
        return {
            jobs: {},
            summary: {
                total: totalJobs,
                completed: 0,
                failed: 0,
                delayed: 0,
                active: 1,
                waiting: totalJobs - 1,
                "waiting-children": 0,
                paused: 0,
                stuck: 0,
                percentage: 0,
            },
        };
    }
    countTotalJobs(flowData) {
        let count = 1; // Root job
        if (flowData.children) {
            count += this.countJobsInChildren(flowData.children);
        }
        return count;
    }
    countJobsInChildren(children) {
        let count = children.length;
        for (const child of children) {
            if (child.children) {
                count += this.countJobsInChildren(child.children);
            }
        }
        return count;
    }
    calculateProgress(currentProgress, update) {
        // Update specific job status
        const updatedJobs = { ...currentProgress.jobs };
        // Track if this is a new job (not previously tracked)
        const isNewJob = !updatedJobs[update.jobId];
        // Update/add job with metadata
        updatedJobs[update.jobId] = {
            name: update.jobName || updatedJobs[update.jobId]?.name || 'Unknown',
            queueName: update.queueName || updatedJobs[update.jobId]?.queueName || 'Unknown',
            status: update.status,
            result: update.result,
            error: update.error,
            progress: update.progress,
            startedAt: update.startedAt || updatedJobs[update.jobId]?.startedAt,
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
        // KEY FIX: Calculate waiting jobs correctly
        const trackedJobsCount = Object.keys(updatedJobs).length;
        const waitingJobs = Math.max(0, currentProgress.summary.total - trackedJobsCount);
        const summary = {
            total: currentProgress.summary.total,
            ...trackedCounts,
            waiting: waitingJobs,
            percentage: Math.round((trackedCounts.completed / currentProgress.summary.total) * 100),
        };
        // VALIDATION: Ensure counts add up
        const totalCounted = Object.values(trackedCounts).reduce((sum, count) => sum + count, 0) + waitingJobs;
        if (totalCounted !== summary.total) {
            logger.warn(`Progress count mismatch for flow: counted ${totalCounted}, expected ${summary.total}. Tracked jobs: ${trackedJobsCount}`);
        }
        return {
            jobs: updatedJobs,
            summary,
        };
    }
    determineFlowStatus(progress) {
        const trackedJobStatuses = Object.values(progress.jobs).map((job) => job.status);
        const totalJobs = progress.summary.total;
        const trackedJobsCount = trackedJobStatuses.length;
        // KEY FIX: Account for untracked jobs (still waiting)
        const hasWaitingJobs = progress.summary.waiting > 0;
        const hasActiveJobs = trackedJobStatuses.some(status => ["active", "delayed", "waiting-children", "paused"].includes(status));
        const hasFailed = trackedJobStatuses.some(status => status === "failed");
        const hasStuck = trackedJobStatuses.some(status => status === "stuck");
        // CRITICAL FIX: Flow completed only when ALL jobs are completed
        const completedCount = trackedJobStatuses.filter(s => s === "completed").length;
        const allJobsCompleted = completedCount === totalJobs && !hasWaitingJobs;
        if (hasFailed || hasStuck)
            return "failed";
        if (allJobsCompleted)
            return "completed"; // Only when ALL jobs done
        if (hasActiveJobs || trackedJobsCount > 0)
            return "running";
        return "pending";
    }
    formatFlowResponse(flow) {
        const progress = flow.progress;
        return {
            flowId: flow.id,
            flowname: flow.flowname,
            name: flow.name,
            queueName: flow.queueName,
            status: flow.status,
            progress: progress?.summary || {
                total: 0,
                completed: 0,
                failed: 0,
                percentage: 0,
            },
            result: flow.result,
            error: flow.error,
            createdAt: flow.createdAt.toISOString(),
            updatedAt: flow.updatedAt.toISOString(),
            startedAt: flow.startedAt?.toISOString(),
            completedAt: flow.completedAt?.toISOString(),
        };
    }
    async deleteFlow(flowId, userId) {
        logger.info(`Starting deletion of flow ${flowId} for user ${userId}`);
        // Step 1: Validate flow exists and user has permission
        // Note: Using type assertion due to Prisma client type mismatch
        const flow = await prisma.flow.findUnique({ where: { id: flowId } });
        if (!flow) {
            throw new Error('Flow not found');
        }
        if (flow.userId !== userId) {
            throw new Error('Unauthorized');
        }
        // Step 2: Collect all job IDs that need to be deleted
        const jobIdsToDelete = this.collectJobIds(flow);
        logger.info(`Found ${jobIdsToDelete.size} jobs to delete for flow ${flowId}`);
        // Step 3: Delete jobs from Redis queues
        const jobDeletionResults = await this.deleteFlowJobs(Array.from(jobIdsToDelete), flow);
        // Step 4: Delete flow from database
        await prisma.flow.delete({ where: { id: flowId } });
        logger.info(`Flow ${flowId} deleted from database`);
        // Step 5: Emit WebSocket events
        const webSocketService = getFlowWebSocketService();
        if (webSocketService) {
            webSocketService.emitFlowDeleted(flowId, userId);
        }
        // Step 6: Return deletion summary
        const successful = jobDeletionResults.filter(r => r.status === 'success').length;
        const failed = jobDeletionResults.filter(r => r.status === 'failed').map(r => r.jobId);
        logger.info(`Flow ${flowId} deletion completed: ${successful}/${jobIdsToDelete.size} jobs deleted successfully`);
        return {
            total: jobIdsToDelete.size,
            successful,
            failed,
            details: jobDeletionResults
        };
    }
    // Helper method to collect root job ID only
    collectJobIds(flow) {
        const jobIds = new Set();
        // Only add root job ID - child jobs will be deleted automatically
        if (flow.rootJobId) {
            jobIds.add(flow.rootJobId);
            logger.debug(`Added root job ID: ${flow.rootJobId}`);
        }
        return jobIds;
    }
    // Helper method to delete jobs from Redis
    async deleteFlowJobs(jobIds, flow) {
        const results = [];
        // Only delete the root job - BullMQ will cascade delete all children
        if (!flow.rootJobId) {
            logger.warn(`No root job ID found for flow ${flow.id}`);
            return results;
        }
        try {
            // Use the flow's queue name for the root job
            const queueName = flow.queueName;
            logger.debug(`Attempting to delete root job ${flow.rootJobId} from queue ${queueName}`);
            // Get the queue and root job
            const queue = getQueue(queueName);
            const job = await queue.getJob(flow.rootJobId);
            if (!job) {
                logger.warn(`Root job ${flow.rootJobId} not found in queue ${queueName}`);
                results.push({
                    jobId: flow.rootJobId,
                    queueName,
                    status: 'not_found'
                });
                return results;
            }
            // Remove the root job - this will cascade delete all child jobs
            await job.remove();
            logger.info(`Successfully deleted root job ${flow.rootJobId} from queue ${queueName} - all child jobs will be automatically deleted`);
            results.push({
                jobId: flow.rootJobId,
                queueName,
                status: 'success'
            });
        }
        catch (error) {
            logger.error(`Failed to delete root job ${flow.rootJobId}:`, error);
            results.push({
                jobId: flow.rootJobId,
                queueName: flow.queueName,
                status: 'failed',
                error: error.message
            });
        }
        return results;
    }
    async close() {
        await this.enhancedFlowProducer.close();
    }
}
// Export singleton instance
export const flowService = new FlowService();
// Legacy exports for backward compatibility
export const createFlow = (flowData, userId) => flowService.createFlow(flowData, userId);
export const getFlows = () => flowService.getFlows();
export const getFlowById = (id) => flowService.getFlowById(id);
export const getFlowJobs = async (flowId) => {
    // This method is deprecated in the new unified approach
    // Flow jobs are now stored as JSON in the jobStructure field
    const flow = await prisma.flow.findUnique({ where: { id: flowId } });
    return flow?.jobStructure || [];
};
// New method to return CreateFlowRequest-like response
export const getFlowAsCreateRequest = async (flowId) => {
    const flow = await prisma.flow.findUnique({ where: { id: flowId } });
    if (!flow)
        return null;
    // Extract the root job structure and convert it back to CreateFlowRequest format
    const jobStructure = flow.jobStructure;
    if (!jobStructure?.root)
        return null;
    const root = jobStructure.root;
    return {
        flowname: flow.flowname,
        name: root.name,
        queueName: root.queueName,
        data: root.data,
        opts: root.opts,
        children: root.children || []
    };
};
