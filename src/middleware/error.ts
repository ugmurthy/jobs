import { Request, Response, NextFunction } from 'express';
import { logger } from '@ugm/logger';

/**
 * Error interface for custom application errors
 */
export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Middleware to handle not found routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error: AppError = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

/**
 * Middleware to handle all errors
 */
export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction): void {
  const statusCode = err.statusCode || 500;
  
  // Log error details
  logger.error(`Error ${statusCode}: ${err.message}`);
  if (statusCode === 500) {
    logger.error(err.stack);
  }
  
  // Send error response
  res.status(statusCode).json({
    message: err.message,
    code: err.code || 'error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

export default {
  notFoundHandler,
  errorHandler
};