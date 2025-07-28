import { FlowProducer } from 'bullmq';
import { logger } from '@ugm/logger';
export class EnhancedFlowProducer {
    constructor(connection) {
        this.flowProducer = new FlowProducer({ connection });
    }
    async add(flowJob, flowId) {
        // Recursively inject flowId into all jobs
        const enhancedJob = this.injectFlowId(flowJob, flowId);
        logger.info(`Adding flow ${flowId} with enhanced job data`);
        return await this.flowProducer.add(enhancedJob);
    }
    injectFlowId(job, flowId) {
        const enhancedData = {
            ...job.data,
            flowId,
            _flowMetadata: {
                flowId,
                parentFlowName: job.name,
                injectedAt: new Date().toISOString(),
            },
        };
        return {
            ...job,
            data: enhancedData,
            children: job.children?.map((child) => this.injectFlowId(child, flowId)),
        };
    }
    async close() {
        await this.flowProducer.close();
    }
    // Proxy other FlowProducer methods if needed
    async getFlow(opts) {
        return await this.flowProducer.getFlow(opts);
    }
}
// Utility function to generate unique flow IDs
export function generateFlowId() {
    return `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
