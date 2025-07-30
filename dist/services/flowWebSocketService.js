import { logger } from '@ugm/logger';
export class FlowWebSocketService {
    constructor(io) {
        this.io = io;
    }
    /**
     * Emit flow creation event
     */
    emitFlowCreated(flow) {
        this.io.emit("flow:created", flow);
        logger.info(`Emitted flow:created for ${flow.flowId}`);
    }
    /**
     * Emit general flow update event
     */
    emitFlowUpdate(flowId, progress, status) {
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
    emitJobUpdate(flowId, jobId, update) {
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
    emitFlowCompleted(flowId, result, completedAt) {
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
    emitFlowDeleted(flowId, userId) {
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
    joinFlowRoom(socketId, flowId) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
            socket.join(`flow:${flowId}`);
            logger.info(`Socket ${socketId} joined flow room: ${flowId}`);
        }
    }
    /**
     * Leave a specific flow room
     */
    leaveFlowRoom(socketId, flowId) {
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
            socket.on('join-flow', (flowId) => {
                socket.join(`flow:${flowId}`);
                logger.info(`Socket ${socket.id} joined flow room: ${flowId}`);
            });
            // Handle leaving flow rooms
            socket.on('leave-flow', (flowId) => {
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
let flowWebSocketService = null;
export function initializeFlowWebSocketService(io) {
    if (!flowWebSocketService) {
        flowWebSocketService = new FlowWebSocketService(io);
        flowWebSocketService.setupFlowEventHandlers();
    }
    return flowWebSocketService;
}
export function getFlowWebSocketService() {
    return flowWebSocketService;
}
