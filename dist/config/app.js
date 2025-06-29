import express from 'express';
import { logger } from '@ugm/logger';
import { serverAdapter } from './bull.js';
import { setupApiDocs } from '../docs/index.js';
// Initialize Express app
export const initializeApp = () => {
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
    // Set up API documentation
    setupApiDocs(app);
    logger.info('Express app initialized with middleware');
    logger.info('API Documentation available at /api-docs');
    return app;
};
export default { initializeApp };
