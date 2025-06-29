import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import { logger } from '@ugm/logger';
import { UserPayload } from '../services/userService.js';
import userService from '../services/userService.js';
import { TOKEN_SECRET } from './env.js';

// User interface for socket data
interface User {
  userId: number;
  username: string;
}

// Initialize Socket.IO server
export const initializeSocketIO = (httpServer: http.Server): SocketIOServer => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }
    
    try {
      const decoded = jwt.verify(token, TOKEN_SECRET) as UserPayload;
      const user = await userService.getUserById(decoded.userId);
      if (!user) {
        return next(new Error("User not found"));
      }
      
      socket.data.user = {
        userId: decoded.userId,
        username: decoded.username
      };
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    const userId = socket.data.user.userId;
    logger.info(`User ${userId} connected via Socket.IO`);
    
    // Join user-specific room
    socket.join(`user:${userId}`);
    
    // Allow subscribing to specific job updates
    socket.on('subscribe:job', (jobId) => {
      logger.info(`User ${userId} subscribed to job ${jobId}`);
      socket.join(`job:${jobId}`);
    });
    
    socket.on('unsubscribe:job', (jobId) => {
      logger.info(`User ${userId} unsubscribed from job ${jobId}`);
      socket.leave(`job:${jobId}`);
    });
    
    socket.on('disconnect', () => {
      logger.info(`User ${userId} disconnected`);
    });
  });

  logger.info('Socket.IO server initialized');
  return io;
};

export default { initializeSocketIO };