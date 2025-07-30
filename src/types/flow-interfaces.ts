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

// Flow Update Request (for external job updates) - ENHANCED
export interface FlowUpdateRequest {
  jobId: string; // BullMQ job ID
  status: BullMQJobStatus; // Support all 8 BullMQ statuses
  result?: Record<string, any>;
  error?: Record<string, any>;
  progress?: number; // Job-level progress tracking
  startedAt?: string; // Timing information
  jobName?: string;    // NEW: Job metadata for better tracking
  queueName?: string;  // NEW: Queue metadata for better tracking
}

// Enhanced job progress interface
export interface FlowJobProgress {
  name: string;
  queueName: string;
  status: BullMQJobStatus;
  result?: any;
  error?: any;
  progress?: number; // Job-level progress
  startedAt?: string;
  completedAt?: string;
  attempts?: number; // Retry tracking
  delay?: number; // Delay information
}

// Progress tracking structure - ENHANCED
export interface FlowProgress {
  jobs: {
    [jobId: string]: FlowJobProgress;
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

// Job metadata for initialization
export interface JobMetadata {
  tempId: string;        // Predictable ID for initialization
  name: string;
  queueName: string;
  level: number;         // Depth in flow hierarchy
  parentTempId?: string; // Parent job temp ID
  data?: Record<string, any>;
  opts?: Record<string, any>;
}

// Job tracking with multiple ID strategies
export interface JobTracker extends JobMetadata {
  actualJobId?: string;  // BullMQ job ID when available
  status: BullMQJobStatus;
  createdAt: string;
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

// Flow deletion result interfaces
export interface FlowDeletionJobResult {
  jobId: string;
  queueName: string;
  status: 'success' | 'failed' | 'not_found';
  error?: string;
}

export interface FlowDeletionResult {
  total: number;
  successful: number;
  failed: string[];
  details: FlowDeletionJobResult[];
}

export interface FlowDeletionResponse {
  message: string;
  flowId: string;
  deletedJobs: FlowDeletionResult;
}