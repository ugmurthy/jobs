import { Request, Response, NextFunction } from 'express';
import { logger } from '@ugm/logger';
import apiKeyService from '../services/apiKeyService.js';
import userService, { AuthenticatedUser } from '../services/userService.js';

/**
 * Middleware to authenticate using API key
 * Extracts API key from X-API-Key header and validates it
 */
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Extract API key from header
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    // No API key provided, let the next middleware handle it
    return next();
  }
  
  try {
    // Validate the API key
    const result = await apiKeyService.validateApiKey(apiKey);
    
    if (!result) {
      // Invalid API key
      logger.warn('Invalid API key attempt');
      res.status(401).json({ message: 'Invalid API key' });
      return;
    }
    
    const { userId, permissions } = result;
    
    // Get user from database to ensure they still exist
    const user = await userService.getUserById(userId);
    if (!user) {
      logger.warn(`API key used for non-existent user ID: ${userId}`);
      res.status(401).json({ message: 'Invalid API key' });
      return;
    }
    
    // Attach user and permissions to request object
    req.user = {
      userId,
      username: user.username,
      // Add API key specific properties
      authMethod: 'apiKey',
      permissions
    } as AuthenticatedUser;
    
    logger.debug(`API key authentication successful for user ${userId}`);
    next();
  } catch (err) {
    logger.error('API key authentication error:', err);
    res.status(500).json({ message: 'Authentication error' });
  }
};

export default { authenticateApiKey };