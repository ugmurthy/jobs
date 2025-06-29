import swaggerUi from 'swagger-ui-express';
import { swaggerSpec, swaggerUiOptions } from './config/index.js';
/**
 * Configure and setup Swagger documentation routes
 * @param app Express application instance
 */
export const setupApiDocs = (app) => {
    // Serve Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
    // Serve Swagger JSON
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
    console.log('API Documentation initialized at /api-docs');
};
// Export everything from submodules for easy imports
export * from './config/index.js';
export * from './middleware/index.js';
