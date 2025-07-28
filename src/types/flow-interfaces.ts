import { BullMQJobStatus } from './bullmq-statuses.js';

// Create Flow Request
export interface CreateFlowRequest {
  flowname: string; // NEW: Human-readable flow name
  name: string; // Handler name for root job
  queueName: string; // Root job queue
  data?: Record<string, any>;
  opts?: Record<string, any>;
  children?: FlowJobData[];
}

// Flow Job Data structure
export interface FlowJobData {
  name: string;
  queueName: string;
  data?: Record<string, any>;
  opts?: Record<string, any>;
  children?: FlowJobData[];
}

// Unified Flow Response
export interface FlowResponse {
  flowId: string; // Consistent naming
  flowname: string; // NEW: Human-readable identifier
  name: string; // Handler name
  queueName: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  progress: {
    total: number;
    completed: number;
    failed: number;
    percentage: number;
  };
  result?: Record<string, any>;
  error?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

// Flow Update Request (for external job updates)
export interface FlowUpdateRequest {
  jobId: string; // BullMQ job ID
  status: "running" | "completed" | "failed";
  result?: Record<string, any>;
  error?: Record<string, any>;
}

// Progress tracking structure
export interface FlowProgress {
  jobs: {
    [jobId: string]: {
      name: string;
      queueName: string;
      status: BullMQJobStatus;
      result?: any;
      error?: any;
      startedAt?: string;
      completedAt?: string;
    };
  };
  summary: {
    total: number;
    completed: number;
    failed: number;
    delayed: number;
    active: number;
    waiting: number;
    "waiting-children": number;
    paused: number;
    stuck: number;
    percentage: number;
  };
}

// Enhanced Job Data with flowId injection
export interface EnhancedJobData {
  flowId?: string; // Automatically injected
  _flowMetadata?: {
    flowId: string;
    parentFlowName: string;
    injectedAt: string;
  };
  [key: string]: any;
}