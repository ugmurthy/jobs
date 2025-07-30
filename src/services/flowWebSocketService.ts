import { Server } from 'socket.io';
import { logger } from '@ugm/logger';
import { FlowResponse, FlowUpdateRequest, FlowProgress } from '../types/flow-interfaces.js';

// WebSocket event types
export interface FlowWebSocketEvents {
  "flow:created": FlowResponse;
  "flow:updated": {
    flowId: string;
    status: string;
    progress: FlowProgress["summary"];
    updatedAt: string;
  };
  "flow:job:updated": {
    flowId: string;
    jobId: string;
    jobStatus: string;
    result?: any;
    error?: any;
  };
  "flow:completed": {
    flowId: string;
    result: any;
    completedAt: string;
  };
  "flow:deleted": {
    flowId: string;
    timestamp: string;
    message: string;
  };
}

export class FlowWebSocketService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * Emit flow creation event
   */
  emitFlowCreated(flow: FlowResponse) {
    this.io.emit("flow:created", flow);
    logger.info(`Emitted flow:created for ${flow.flowId}`);
  }

  /**
   * Emit general flow update event
   */
  emitFlowUpdate(flowId: string, progress: FlowProgress, status: string) {
    const updateEvent = {
      flowId,
      status,
      progress: progress.summary,
      updatedAt: new Date().toISOString(),
    };

    this.io.emit("flow:updated", updateEvent);

    // Emit to specific flow room
    this.io.to(`flow:${flowId}`).emit("flow:progress", {
      flowId,
      progress,
      status,
    });

    logger.info(`Emitted flow:updated for ${flowId} with status ${status}`);
  }

  /**
   * Emit job-specific update event
   */
  emitJobUpdate(
    flowId: string,
    jobId: string,
    update: FlowUpdateRequest
  ) {
    const jobUpdateEvent = {
      flowId,
      jobId,
      jobStatus: update.status,
      result: update.result,
      error: update.error,
    };

    this.io.emit("flow:job:updated", jobUpdateEvent);
    
    // Emit to specific flow room
    this.io.to(`flow:${flowId}`).emit("flow:job:progress", jobUpdateEvent);

    logger.info(`Emitted flow:job:updated for ${flowId}/${jobId} with status ${update.status}`);
  }

  /**
   * Emit flow completion event
   */
  emitFlowCompleted(flowId: string, result: any, completedAt: string) {
    const completionEvent = {
      flowId,
      result,
      completedAt,
    };

    this.io.emit("flow:completed", completionEvent);
    
    // Emit to specific flow room
    this.io.to(`flow:${flowId}`).emit("flow:finished", completionEvent);

    logger.info(`Emitted flow:completed for ${flowId}`);
  }

  /**
   * Emit flow deletion event
   */
  emitFlowDeleted(flowId: string, userId: number): void {
    const deletionEvent = {
      flowId,
      timestamp: new Date().toISOString(),
      message: 'Flow has been deleted'
    };

    logger.info(`Emitting flow deleted event for flow ${flowId}`);
    
    // Emit to user's room
    this.io.to(`user:${userId}`).emit('flow:deleted', deletionEvent);
    
    // Emit to flow-specific room (if anyone is subscribed)
    this.io.to(`flow:${flowId}`).emit('flow:deleted', deletionEvent);
  }

  /**
   * Join a specific flow room for targeted updates
   */
  joinFlowRoom(socketId: string, flowId: string) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.join(`flow:${flowId}`);
      logger.info(`Socket ${socketId} joined flow room: ${flowId}`);
    }
  }

  /**
   * Leave a specific flow room
   */
  leaveFlowRoom(socketId: string, flowId: string) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.leave(`flow:${flowId}`);
      logger.info(`Socket ${socketId} left flow room: ${flowId}`);
    }
  }

  /**
   * Setup WebSocket event handlers for flow management
   */
  setupFlowEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Handle joining flow rooms
      socket.on('join-flow', (flowId: string) => {
        socket.join(`flow:${flowId}`);
        logger.info(`Socket ${socket.id} joined flow room: ${flowId}`);
      });

      // Handle leaving flow rooms
      socket.on('leave-flow', (flowId: string) => {
        socket.leave(`flow:${flowId}`);
        logger.info(`Socket ${socket.id} left flow room: ${flowId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }
}

// Singleton instance
let flowWebSocketService: FlowWebSocketService | null = null;

export function initializeFlowWebSocketService(io: Server): FlowWebSocketService {
  if (!flowWebSocketService) {
    flowWebSocketService = new FlowWebSocketService(io);
    flowWebSocketService.setupFlowEventHandlers();
  }
  return flowWebSocketService;
}

export function getFlowWebSocketService(): FlowWebSocketService | null {
  return flowWebSocketService;
}