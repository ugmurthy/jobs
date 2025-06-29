import express from 'express';
import { swaggerSpec } from '../config/index.js';

/**
 * Setup OpenAPI request/response validation middleware
 * This is optional and can be implemented with express-openapi-validator
 * @param app Express application instance
 */
export const setupValidatorMiddleware = (app: express.Application): void => {
  // This is a placeholder for the validator middleware
  // To implement validation, you would need to install express-openapi-validator:
  // pnpm add express-openapi-validator
  
  // Example implementation:
  // import * as OpenApiValidator from 'express-openapi-validator';
  // app.use(
  //   OpenApiValidator.middleware({
  //     apiSpec: swaggerSpec,
  //     validateRequests: true,
  //     validateResponses: true,
  //   })
  // );
  
  console.log('API validation middleware is not enabled. Install express-openapi-validator to enable it.');
};