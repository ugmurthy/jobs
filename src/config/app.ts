import express, { Express } from 'express';
import { logger } from '@ugm/logger';
import { serverAdapter } from './bull.js';

// Initialize Express app
export const initializeApp = (): Express => {
  const app = express();

  // CORS middleware to allow requests from any origin (including file:// protocol)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    
    next();
  });

  // Body parser middleware
  app.use(express.json());

  // Set up Bull Board routes
  app.use('/admin', serverAdapter.getRouter());

  logger.info('Express app initialized with middleware');
  return app;
};

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        username: string;
      };
    }
  }
}

export default { initializeApp };