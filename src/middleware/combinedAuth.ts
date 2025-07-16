import { Request, Response, NextFunction } from 'express';
import { authenticateToken } from './auth.js';
import { authenticateApiKey } from './apiKeyAuth.js';

import { logger } from '@ugm/logger';

/**
 * Combined authentication middleware that supports both API Key and JWT Token.
 * It prioritizes API Key authentication if an 'x-api-key' header is present.
 * If not, it falls back to JWT token authentication from the 'Authorization' header.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  const authHeader = req.headers['authorization'] as string;

  if (apiKey) {
    // API key is present, use API key authentication.
    logger.debug('Attempting authentication with API Key.');
    authenticateApiKey(req, res, next);
  } else if (authHeader) {
    // No API key, but an Authorization header is present, use JWT authentication.
    logger.debug('Attempting authentication with JWT Token.');
    authenticateToken(req, res, next);
  } else {
    // No authentication credentials provided.
    logger.warn('No API Key or JWT Token provided for authentication.');
    res.status(401).json({ message: 'Authentication credentials were not provided.' });
  }
};

export default { authenticate };