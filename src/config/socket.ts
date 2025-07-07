import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import { logger } from '@ugm/logger';
import { UserPayload } from '../services/userService.js';
import userService from '../services/userService.js';
import apiKeyService from '../services/apiKeyService.js';
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
    // Check for token or API key in auth object
    const authToken = socket.handshake.auth.token;
    const apiKey = socket.handshake.auth.apiKey;
    
    // If neither token nor API key is provided
    if (!authToken && !apiKey) {
      logger.warn("Socket connection attempt without authentication");
      return next(new Error("Authentication error: No credentials provided"));
    }
    
    try {
      // First try JWT token authentication
      if (authToken) {
        try {
          const decoded = jwt.verify(authToken, TOKEN_SECRET) as UserPayload;
          const user = await userService.getUserById(decoded.userId);
          
          if (!user) {
            logger.warn(`User not found for token: ${decoded.userId}`);
            return next(new Error("User not found"));
          }
          
          socket.data.user = {
            userId: decoded.userId,
            username: decoded.username,
            authMethod: 'jwt'
          };
          
          logger.debug(`Socket authenticated via JWT for user ${decoded.userId}`);
          return next();
        } catch (tokenErr) {
          // If token is actually an API key, it will fail JWT verification
          // We'll try API key authentication next
          logger.debug("JWT verification failed, trying as API key");
        }
      }
      
      // Try API key authentication if JWT failed or if apiKey was explicitly provided
      const keyToValidate = apiKey || authToken;
      if (keyToValidate) {
        const result = await apiKeyService.validateApiKey(keyToValidate);
        
        if (!result) {
          logger.warn("Invalid API key used for socket connection");
          return next(new Error("Invalid API key"));
        }
        
        const { userId, permissions } = result;
        
        // Get user from database to ensure they still exist
        const user = await userService.getUserById(userId);
        if (!user) {
          logger.warn(`API key used for non-existent user ID: ${userId}`);
          return next(new Error("User not found"));
        }
        
        socket.data.user = {
          userId,
          username: user.username,
          authMethod: 'apiKey',
          permissions
        };
        
        logger.debug(`Socket authenticated via API key for user ${userId}`);
        return next();
      }
      
      // If we get here, authentication failed
      return next(new Error("Authentication failed"));
    } catch (err) {
      logger.error("Socket authentication error:", err);
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