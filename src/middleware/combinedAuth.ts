import { Request, Response, NextFunction } from 'express';
import { authenticateToken } from './auth.js';
import { authenticateApiKey } from './apiKeyAuth.js';

/**
 * Combined authentication middleware that tries API key authentication first,
 * then falls back to JWT token authentication if no API key is provided.
 * This allows either method to work for protected routes.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Store the original response methods
  const originalStatus = res.status;
  const originalJson = res.json;
  const originalSend = res.send;
  const originalSendStatus = res.sendStatus;
  
  // Create a flag to track if authentication has succeeded
  let authSucceeded = false;
  
  // Override response methods to prevent them from ending the request during API key auth
  res.status = function(code: number) {
    if (code === 401) {
      // Don't actually set the status yet, just store it
      (res as any).storedStatusCode = code;
      return res;
    }
    return originalStatus.call(this, code);
  };
  
  res.json = function(body: any) {
    if ((res as any).storedStatusCode === 401) {
      // Don't send the response, just store it
      (res as any).storedResponseBody = body;
      return res;
    }
    return originalJson.call(this, body);
  };
  
  res.send = function(body: any) {
    if ((res as any).storedStatusCode === 401) {
      // Don't send the response, just store it
      (res as any).storedResponseBody = body;
      return res;
    }
    return originalSend.call(this, body);
  };
  
  res.sendStatus = function(code: number) {
    if (code === 401) {
      // Don't send the status, just store it
      (res as any).storedStatusCode = code;
      return res;
    }
    return originalSendStatus.call(this, code);
  };
  
  // Create a next function that sets the authSucceeded flag
  const successNext = () => {
    authSucceeded = true;
    next();
  };
  
  // Try API key authentication first
  await authenticateApiKey(req, res, () => {
    // If req.user is set, API key auth succeeded
    if (req.user) {
      authSucceeded = true;
      next();
    } else {
      // API key auth didn't succeed, try JWT auth
      // Restore original response methods
      res.status = originalStatus;
      res.json = originalJson;
      res.send = originalSend;
      res.sendStatus = originalSendStatus;
      
      // Try JWT authentication
      authenticateToken(req, res, next);
    }
  });
};

export default { authenticate };