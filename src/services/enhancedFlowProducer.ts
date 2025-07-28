import { FlowProducer, FlowJob as BullMQFlowJob, JobNode } from 'bullmq';
import { logger } from '@ugm/logger';
import { FlowJobData, EnhancedJobData } from '../types/flow-interfaces.js';

export class EnhancedFlowProducer {
  private flowProducer: FlowProducer;

  constructor(connection: any) {
    this.flowProducer = new FlowProducer({ connection });
  }

  async add(flowJob: BullMQFlowJob, flowId: string): Promise<JobNode> {
    // Recursively inject flowId into all jobs
    const enhancedJob = this.injectFlowId(flowJob, flowId);
    logger.info(`Adding flow ${flowId} with enhanced job data`);
    return await this.flowProducer.add(enhancedJob);
  }

  private injectFlowId(job: BullMQFlowJob, flowId: string): BullMQFlowJob {
    const enhancedData: EnhancedJobData = {
      ...job.data,
      flowId, // Inject flowId into job data
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

  async close(): Promise<void> {
    await this.flowProducer.close();
  }

  // Proxy other FlowProducer methods if needed
  async getFlow(opts: { id: string; queueName: string }) {
    return await this.flowProducer.getFlow(opts);
  }
}

// Utility function to generate unique flow IDs
export function generateFlowId(): string {
  return `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}