import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '@ugm/logger';
import userService, { UserPayload, AuthenticatedUser } from '../services/userService.js';
import { TOKEN_SECRET } from '../config/env.js';

/**
 * Middleware to authenticate JWT token
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'] as string;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    res.sendStatus(401);
    return;
  }

  try {
    const decoded = jwt.verify(token, TOKEN_SECRET) as UserPayload;
    
    // Verify user exists in database
    const user = await userService.getUserById(decoded.userId);
    if (!user) {
      res.sendStatus(403);
      return;
    }
    
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      authMethod: 'jwt'
    } as AuthenticatedUser;
    next();
  } catch (err) {
    logger.error('Authentication error:', err);
    res.sendStatus(403);
  }
}

export default { authenticateToken };