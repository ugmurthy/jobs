import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec, swaggerUiOptions } from './config/index.js';

/**
 * Configure and setup Swagger documentation routes
 * @param app Express application instance
 */
export const setupApiDocs = (app: express.Application): void => {
  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  
  // Serve Swagger JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  
};

// Export everything from submodules for easy imports
export * from './config/index.js';
export * from './middleware/index.js';