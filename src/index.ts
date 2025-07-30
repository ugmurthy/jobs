import http from 'http';
import { logger } from '@ugm/logger';
import { PORT } from './config/env.js';
import { initializeApp } from './config/app.js';
import { initializeSocketIO } from './config/socket.js';
import { initializeBull } from './config/bull.js';
import { registerRoutes } from './routes/index.js';
import { initializeEvents } from './events/index.js';
import { initializeWorkers } from './workers/index.js';


// Set logger level to debug for detailed job tracking
logger.level = process.env.LOGGER_LEVEL || 'info';
logger.info(`Logger level is ${logger.level}`)

/**
 * Main application entry point
 */
async function startServer() {
  try {
    // Initialize Bull/BullMQ
    initializeBull();
    
    // Initialize Express app
    const app = initializeApp();
    
    // Create HTTP server
    const httpServer = http.createServer(app);
    
    // Initialize Socket.IO
    const io = initializeSocketIO(httpServer);
    
    // Register routes
    registerRoutes(app);
    
    // Initialize event handlers
    initializeEvents(io);
    
    // Initialize workers
    initializeWorkers();
    
    // Start server
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Bull Board UI available at http://localhost:${PORT}/admin`);
      logger.info(`Socket.IO server ready for real-time job notifications`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch(error => {
  logger.error('Unhandled error during server startup:', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Export for testing
export {};
