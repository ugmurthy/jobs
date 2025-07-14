import { Express, Request, Response } from 'express';
import { logger } from '@ugm/logger';
import { authenticateToken } from '../middleware/auth.js';
import { authenticate } from '../middleware/combinedAuth.js';
import userService from '../services/userService.js';
import { getQueue, defaultOptions } from '../config/bull.js';
import prisma from '../lib/prisma.js';
import { notFoundHandler, errorHandler } from '../middleware/error.js';

// Import routers
import authRoutes from './auth.js';
import jobsRoutes from './jobs.js';
import webhooksRoutes from './webhooks.js';
import adminRoutes from './admin.js';
import schedulerRoutes from './scheduler.js';
import apiKeyRoutes from './apiKeys.js';
import dashboardRoutes from './dashboard.js';
import queueRoutes from './queues.js';

/**
 * Register all application routes
 */
export const registerRoutes = (app: Express): void => {
  // Add request logging middleware
  app.use((req, res, next) => {
    // Log basic request info
    const logInfo = {
      method: req.method,
      url: req.url,
      query: req.query,
      // Don't log full body to avoid logging sensitive info
      bodyKeys: req.body ? Object.keys(req.body) : []
    };
    
    logger.debug(`Request: ${JSON.stringify(logInfo)}`);
    
    // Add response logging
    const originalSend = res.send;
    res.send = function(body) {
      logger.debug(`Response: ${req.method} ${req.url} - Status: ${res.statusCode}`);
      return originalSend.call(this, body);
    };
    
    next();
  });

  // Root route
  app.get('/', (req, res) => {
    res.json({ message: 'API is running' });
  });

  // Register route modules with their prefixes
  app.use('/auth', authRoutes);
  app.use('/queues', authenticate, queueRoutes);
  app.use('/jobs', schedulerRoutes);
  app.use('/jobs', authenticate, jobsRoutes);
  app.use('/webhooks', authenticate, webhooksRoutes);
  app.use('/admin', authenticate, adminRoutes);
  app.use('/api-keys', authenticate, apiKeyRoutes);
  app.use('/dashboard', authenticate, dashboardRoutes);

  // Define legacy routes directly for backward compatibility
  
  // User registration route
  app.post('/register', async (req: Request, res: Response) => {
    try {
      const { username, password, email, webhookUrl } = req.body;
      
      // Validate input
      if (!username || !password) {
        res.status(400).json({ message: 'Username and password are required' });
        return;
      }
      
      // Check if user already exists
      const existingUser = await userService.getUserByUsername(username);
      if (existingUser) {
        res.status(409).json({ message: 'Username already exists' });
        return;
      }
      
      // Register user
      const user = await userService.register({ username, password, email, webhookUrl });
      
      // Generate tokens
      const tokens = await userService.login(username, password);
      
      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          webhookUrl: user.webhookUrl
        },
        ...tokens
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({ message: 'An error occurred during registration' });
    }
  });

  // User login route
  app.post('/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      // Validate input
      if (!username || !password) {
        res.status(400).json({ message: 'Username and password are required' });
        return;
      }
      
      // Authenticate user
      const tokens = await userService.login(username, password);
      
      if (!tokens) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }
      
      res.json({
        message: 'Login successful',
        ...tokens
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ message: 'An error occurred during login' });
    }
  });

  // User logout route
  app.post('/logout', authenticate, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }
      
      await userService.logout(req.user.userId);
      
      res.json({ message: 'Logout successful' });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ message: 'An error occurred during logout' });
    }
  });

  // Token refresh route
  app.post('/refresh-token', async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({ message: 'Refresh token is required' });
        return;
      }
      
      const accessToken = await userService.refreshToken(refreshToken);
      
      if (!accessToken) {
        res.status(401).json({ message: 'Invalid or expired refresh token' });
        return;
      }
      
      res.json({ accessToken });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(500).json({ message: 'An error occurred during token refresh' });
    }
  });

  // Submit job route
  app.post('/submit-job', authenticate, async (req: Request, res: Response) => {
    const requestedJob = req.body;
  
    logger.info(`/submit-job REQUESTED BY: ${JSON.stringify(req.user)}`);
    logger.debug(`/submit-job name: ${requestedJob.name}` );
    logger.debug(`/submit-job data: ${JSON.stringify(requestedJob.data)}`);
    
    // Check if options are provided in the request
    let jobOptions = defaultOptions;
    if (requestedJob.options) {
      // Validate the provided options
      if (isValidOptions(requestedJob.options)) {
        jobOptions = requestedJob.options;
        logger.info("Using custom options provided in the request");
      } else {
        logger.warn("Invalid options provided, using default options");
      }
    } else {
      logger.info("No options provided, using default options");
    }
    
    const jobData = {
      ...requestedJob.data,
      userId: req.user?.userId
    };
    
    //This is a legacy route, so we assume the default jobQueue
    const jobQueue = getQueue('jobQueue');
    const job = await jobQueue.add(requestedJob.name, jobData, jobOptions);
    logger.debug(`/submit-job: jobData: ${JSON.stringify(jobData)}`);
    logger.info(`/submit-job: JOB SCHEDULED : ${job.id}/${requestedJob.name}`);
    
    res.json({ jobId: job.id });
  });

  // Password reset request route
  app.post('/request-password-reset', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        res.status(400).json({ message: 'Email is required' });
        return;
      }
      
      const resetToken = await userService.generatePasswordResetToken(email);
      
      if (!resetToken) {
        // Don't reveal if email exists or not for security
        res.json({ message: 'If your email is registered, you will receive a password reset link' });
        return;
      }
      
      // In a real application, you would send an email with the reset link
      // For this example, we'll just return the token
      res.json({
        message: 'Password reset token generated',
        resetToken
      });
    } catch (error) {
      logger.error('Password reset request error:', error);
      res.status(500).json({ message: 'An error occurred during password reset request' });
    }
  });

  // Password reset route
  app.post('/reset-password', async (req: Request, res: Response) => {
    try {
      const { resetToken, newPassword } = req.body;
      
      if (!resetToken || !newPassword) {
        res.status(400).json({ message: 'Reset token and new password are required' });
        return;
      }
      
      const success = await userService.resetPassword(resetToken, newPassword);
      
      if (!success) {
        res.status(400).json({ message: 'Invalid or expired reset token' });
        return;
      }
      
      res.json({ message: 'Password reset successful' });
    } catch (error) {
      logger.error('Password reset error:', error);
      res.status(500).json({ message: 'An error occurred during password reset' });
    }
  });

  // Helper function for validating options
  function isValidOptions(options: unknown): boolean {
    // Check if options is an object and not null
    if (typeof options !== 'object' || options === null) {
      return false;
    }
    
    try {
      // Try to stringify and parse to ensure it's a valid JSON object
      JSON.parse(JSON.stringify(options));
      logger.debug(`options : ${JSON.stringify(options)}`);
      return true;
    } catch (error) {
      logger.error("Invalid options", options);
      return false;
    }
  }

  // Error handling middleware should be registered last
  app.use(notFoundHandler);
  app.use(errorHandler);

  logger.info('All routes registered successfully');
};

export default { registerRoutes };