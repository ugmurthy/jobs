import { io, Socket } from 'socket.io-client';
import { store } from '@/app/store';
import {
  connected,
  disconnected,
  connectionError,
  eventReceived
} from '@/features/websocket/websocketSlice';
import { handleWebSocketEvent } from '@/features/jobs/jobsSlice';

// Socket.IO instance
let socket: Socket | null = null;

/**
 * Initialize Socket.IO connection with authentication
 */
export function initializeSocket(): Socket | null {
  // Get auth token from store
  const state = store.getState();
  const token = state.auth.token;
  const apiKey = state.auth.apiKey;
  
  if (!token && !apiKey) {
    console.warn('Cannot initialize socket: No authentication token or API key available');
    return null;
  }

  // Close existing connection if any
  if (socket) {
    socket.close();
  }

  // Create new socket connection with auth
  socket = io({
    auth: token
      ? { token }
      : apiKey
        ? { apiKey }
        : undefined,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  // Set up event handlers
  socket.on('connect', () => {
    store.dispatch(connected({ id: socket?.id }));
    console.log('Socket connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    store.dispatch(disconnected({ reason }));
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    store.dispatch(connectionError({ message: error.message }));
    console.error('Socket connection error:', error);
    console.error('Socket connection error details:', {
      message: error.message,
      context: {
        token: token ? 'Present' : 'Not present',
        apiKey: apiKey ? 'Present' : 'Not present',
        authMethod: token ? 'JWT' : apiKey ? 'API Key' : 'None'
      }
    });
  });

  // Job events
  socket.on('job:progress', (data) => {
    const event = {
      type: 'job:progress',
      payload: data,
      timestamp: new Date().toISOString()
    };
    store.dispatch(eventReceived(event));
    store.dispatch(handleWebSocketEvent(event));
  });

  socket.on('job:completed', (data) => {
    const event = {
      type: 'job:completed',
      payload: data,
      timestamp: new Date().toISOString()
    };
    store.dispatch(eventReceived(event));
    store.dispatch(handleWebSocketEvent(event));
  });

  socket.on('job:failed', (data) => {
    const event = {
      type: 'job:failed',
      payload: data,
      timestamp: new Date().toISOString()
    };
    store.dispatch(eventReceived(event));
    store.dispatch(handleWebSocketEvent(event));
  });

  socket.on('job:delta', (data) => {
    const event = {
      type: 'job:delta',
      payload: data,
      timestamp: new Date().toISOString()
    };
    store.dispatch(eventReceived(event));
    store.dispatch(handleWebSocketEvent(event));
  });

  // System events
  socket.on('system:event', (data) => {
    store.dispatch(eventReceived({
      type: 'system:event',
      payload: data,
      timestamp: new Date().toISOString()
    }));
  });

  // Webhook events
  socket.on('webhook:delivered', (data) => {
    store.dispatch(eventReceived({
      type: 'webhook:delivered',
      payload: data,
      timestamp: new Date().toISOString()
    }));
  });

  socket.on('webhook:failed', (data) => {
    store.dispatch(eventReceived({
      type: 'webhook:failed',
      payload: data,
      timestamp: new Date().toISOString()
    }));
  });

  return socket;
}

/**
 * Get the current socket instance
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Close the socket connection
 */
export function closeSocket(): void {
  if (socket) {
    socket.close();
    socket = null;
  }
}

/**
 * Subscribe to job-specific events
 */
export function subscribeToJob(jobId: string): void {
  if (socket && socket.connected) {
    socket.emit('subscribe:job', jobId);
  }
}

/**
 * Unsubscribe from job-specific events
 */
export function unsubscribeFromJob(jobId: string): void {
  if (socket && socket.connected) {
    socket.emit('unsubscribe:job', jobId);
  }
}

/**
 * Request job status update
 */
export function requestJobStatus(jobId: string): void {
  if (socket && socket.connected) {
    socket.emit('request:job-status', jobId);
  }
}