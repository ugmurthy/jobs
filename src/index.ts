import express, {Request, Response, NextFunction} from 'express';
import http from 'http';
import {Server} from 'socket.io';
import got from 'got';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Queue, QueueEvents, Worker } from 'bullmq';
import {logger} from '@ugm/logger';
// Bull Board imports
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
import { ExpressAdapter } from "@bull-board/express";
import userService, { UserPayload } from './services/userService.js';
import prisma from './lib/prisma.js';

dotenv.config();
logger.level='debug';
const redisOptions = {host:'localhost', port: 6379};
const PORT = process.env.PORT || 4000;

// Update User interface to match our new structure
interface User {
    userId: number;
    username: string;
}

// Default job options
const defaultOptions = {removeOnComplete:{count:3}, removeOnFail:{count:5}}; // retain info on last 3/5 completed/failures

declare module 'express' {
    interface Request {
        user?:User;
    }
}

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

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

app.use(express.json());

// Set up Bull Board
const serverAdapter = new ExpressAdapter();
const bullBoard = createBullBoard({
  queues: [],  // We'll add the queue after it's created
  serverAdapter: serverAdapter,
});
serverAdapter.setBasePath('/admin');

// Updated authentication middleware
async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'] as string;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    res.sendStatus(401);
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET as string) as UserPayload;
    
    // Verify user exists in database
    const user = await userService.getUserById(decoded.userId);
    if (!user) {
      res.sendStatus(403);
      return;
    }
    
    req.user = {
      userId: decoded.userId,
      username: decoded.username
    };
    next();
  } catch (err) {
    res.sendStatus(403);
  }
}

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error"));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET as string) as UserPayload;
    const user = await userService.getUserById(decoded.userId);
    if (!user) {
      return next(new Error("User not found"));
    }
    
    socket.data.user = {
      userId: decoded.userId,
      username: decoded.username
    };
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  const userId = socket.data.user.userId;
  logger.info(`User ${userId} connected via Socket.IO`);
  
  // Join user-specific room
  socket.join(`user:${userId}`);
  
  // Allow subscribing to specific job updates
  socket.on('subscribe:job', (jobId) => {
    logger.info(`User ${userId} subscribed to job ${jobId}`);
    socket.join(`job:${jobId}`);
  });
  
  socket.on('unsubscribe:job', (jobId) => {
    logger.info(`User ${userId} unsubscribed from job ${jobId}`);
    socket.leave(`job:${jobId}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`User ${userId} disconnected`);
  });
});

// Initialize queues and events
const jobQueue = new Queue('jobQueue', { connection:redisOptions });
const webHookQueue = new Queue('webhooks',{connection:redisOptions});
const queueEvents = new QueueEvents('jobQueue', { connection:redisOptions });

// Connect queue events to Socket.IO and webhook processing
queueEvents.on('progress', async ({ jobId, data }) => {
  const progress = data;
  logger.info(`Job ${jobId} progress: ${progress}%`);
  
  try {
    const job = await jobQueue.getJob(jobId);
    if (job) {
      const userId = job.data.userId;
      
      // Emit to job-specific room
      io.to(`job:${jobId}`).emit(`job:${jobId}:progress`, { jobId, progress });
      
      // Emit to user-specific room
      io.to(`user:${userId}`).emit('job:progress', { 
        jobId, 
        jobName: job.name, 
        progress 
      });
      
      // Add progress update to webhook queue
      await webHookQueue.add('progress', {
        id: jobId,
        jobname: job.name,
        userId: userId,
        progress: progress
      });
    }
  } catch (error) {
    logger.error(`Error processing progress event for job ${jobId}:`, error);
  }
});

queueEvents.on('completed', async ({ jobId, returnvalue }) => {
  logger.info(`Job ${jobId} completed with result: ${returnvalue}`);
  
  try {
    const job = await jobQueue.getJob(jobId);
    if (job) {
      const userId = job.data.userId;
      
      // Emit to job-specific room
      io.to(`job:${jobId}`).emit(`job:${jobId}:completed`, { jobId, result: returnvalue });
      
      // Emit to user-specific room
      io.to(`user:${userId}`).emit('job:completed', { 
        jobId, 
        jobName: job.name, 
        result: returnvalue 
      });
      
      // Add completion update to webhook queue
      await webHookQueue.add('completed', {
        id: jobId,
        jobname: job.name,
        userId: userId,
        result: returnvalue
      });
    }
  } catch (error) {
    logger.error(`Error processing completed event for job ${jobId}:`, error);
  }
});

queueEvents.on('failed', async ({ jobId, failedReason }) => {
  logger.info(`Job ${jobId} failed: ${failedReason}`);
  
  try {
    const job = await jobQueue.getJob(jobId);
    if (job) {
      const userId = job.data.userId;
      
      // Emit to job-specific room
      io.to(`job:${jobId}`).emit(`job:${jobId}:failed`, { jobId, error: failedReason });
      
      // Emit to user-specific room
      io.to(`user:${userId}`).emit('job:failed', { 
        jobId, 
        jobName: job.name, 
        error: failedReason 
      });
      
      // Add failure update to webhook queue
      await webHookQueue.add('failed', {
        id: jobId,
        jobname: job.name,
        userId: userId,
        error: failedReason
      });
    }
  } catch (error) {
    logger.error(`Error processing failed event for job ${jobId}:`, error);
  }
});

// Enhanced webhook worker
const webHooksWorker = new Worker(
  "webhooks",
  async (job) => {
    const { id, jobname, userId, result, progress, error } = job.data;
    const eventType = job.name; // 'progress', 'completed', or 'failed'
    
    logger.info(`WORKER: webhooks ${job.id}/${job.name} active for ${userId}/${id}/${jobname}`);
    
    try {
      // Get user from database
      const user = await userService.getUserById(userId);
      if (!user) {
        logger.error(`User not found: ${userId}`);
        return;
      }
      
      // Get webhooks for this user and event type
      const webhooks = await prisma.webhook.findMany({
        where: {
          userId: userId,
          active: true,
          OR: [
            { eventType: eventType },
            { eventType: 'all' }
          ]
        }
      });
      
      // Legacy support for webhookUrl field
      if (webhooks.length === 0 && user.webhookUrl && eventType === 'completed') {
        webhooks.push({
          id: 0,
          url: user.webhookUrl,
          eventType: 'completed',
          active: true,
          userId: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          description: 'Legacy webhook'
        });
      }
      
      if (webhooks.length === 0) {
        logger.info(`No webhooks configured for user ${userId} and event ${eventType}`);
        return;
      }
      
      // Prepare payload based on event type
      let payload: any;
      switch (eventType) {
        case 'progress':
          payload = { id, jobname, userId, progress, eventType };
          break;
        case 'completed':
          payload = { id, jobname, userId, result, eventType };
          break;
        case 'failed':
          payload = { id, jobname, userId, error, eventType };
          break;
        default:
          payload = { id, jobname, userId, eventType };
      }
      
      // Send to all configured webhooks
      const promises = webhooks.map(async (webhook) => {
        try {
          logger.info(`Sending ${eventType} webhook to ${webhook.url} for job ${id}`);
          await got.post(webhook.url, { 
            json: payload,
            timeout: { request: 10000 }, // 10s timeout
            retry: { limit: 3 } // Retry 3 times
          });
          logger.info(`Successfully sent webhook to ${webhook.url}`);
          return true;
        } catch (error) {
          logger.error(`Failed to send webhook to ${webhook.url}: ${error}`);
          return false;
        }
      });
      
      await Promise.all(promises);
    } catch (error) {
      logger.error(`Webhook processing error: ${error}`);
    }
  },
  { connection: redisOptions }
);

logger.info("webhooks worker started...");
// Event listeners for the worker
webHooksWorker.on("completed", (job,returnvalue) => {
  logger.info(`WORKER : ${job.id} : ${job.name} : completed!`);
});

webHooksWorker.on("progress", (job, progress) => {
  logger.info(`WORKER : ${job.name} : progress ${progress}%`);
});

webHooksWorker.on("failed", (job, err) => {
  logger.error(`WORKER : ${job?.id} has failed with ${err.message}`);
});

// Add the queue to Bull Board
bullBoard.addQueue(new BullMQAdapter(jobQueue));
bullBoard.addQueue(new BullMQAdapter(webHookQueue));
// Set up Bull Board routes
app.use('/admin', serverAdapter.getRouter());

// Protected root route
app.get('/', authenticateToken, (req: Request, res: Response) => {
    res.json({message: "Hello World"});
});

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

// Updated login route
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

// Logout route
app.post('/logout', authenticateToken, async (req: Request, res: Response) => {
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

// Webhook URL update route (legacy)
app.put('/webhook-url', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    
    const { webhookUrl } = req.body;
    
    if (!webhookUrl) {
      res.status(400).json({ message: 'Webhook URL is required' });
      return;
    }
    
    const user = await userService.updateWebhookUrl(req.user.userId, webhookUrl);
    
    res.json({
      message: 'Webhook URL updated successfully',
      webhookUrl: user.webhookUrl
    });
  } catch (error) {
    logger.error('Webhook URL update error:', error);
    res.status(500).json({ message: 'An error occurred during webhook URL update' });
  }
});

// Get all webhooks for the authenticated user
app.get('/webhooks', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    
    const webhooks = await prisma.webhook.findMany({
      where: { userId }
    });
    
    res.json({ webhooks });
  } catch (error) {
    logger.error('Webhooks list error:', error);
    res.status(500).json({ message: 'An error occurred while fetching webhooks' });
  }
});

// Add a new webhook
app.post('/webhooks', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    
    const { url, eventType, description } = req.body;
    
    if (!url || !eventType) {
      res.status(400).json({ message: 'URL and event type are required' });
      return;
    }
    
    // Validate event type
    const validEventTypes = ['progress', 'completed', 'failed', 'all'];
    if (!validEventTypes.includes(eventType)) {
      res.status(400).json({ 
        message: `Invalid event type. Must be one of: ${validEventTypes.join(', ')}` 
      });
      return;
    }
    
    // Check if webhook already exists
    const existingWebhook = await prisma.webhook.findFirst({
      where: {
        userId,
        url,
        eventType
      }
    });
    
    if (existingWebhook) {
      res.status(409).json({ message: 'Webhook already exists' });
      return;
    }
    
    // Create new webhook
    const webhook = await prisma.webhook.create({
      data: {
        url,
        eventType,
        description,
        userId
      }
    });
    
    res.status(201).json({ webhook });
  } catch (error) {
    logger.error('Webhook creation error:', error);
    res.status(500).json({ message: 'An error occurred while creating webhook' });
  }
});

// Update a webhook
app.put('/webhooks/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const webhookId = parseInt(req.params.id);
    
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    
    // Check if webhook exists and belongs to user
    const webhook = await prisma.webhook.findFirst({
      where: {
        id: webhookId,
        userId
      }
    });
    
    if (!webhook) {
      res.status(404).json({ message: 'Webhook not found' });
      return;
    }
    
    const { url, eventType, description, active } = req.body;
    
    // Validate event type if provided
    if (eventType) {
      const validEventTypes = ['progress', 'completed', 'failed', 'all'];
      if (!validEventTypes.includes(eventType)) {
        res.status(400).json({ 
          message: `Invalid event type. Must be one of: ${validEventTypes.join(', ')}` 
        });
        return;
      }
    }
    
    // Update webhook
    const updatedWebhook = await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        url: url !== undefined ? url : webhook.url,
        eventType: eventType !== undefined ? eventType : webhook.eventType,
        description: description !== undefined ? description : webhook.description,
        active: active !== undefined ? active : webhook.active
      }
    });
    
    res.json({ webhook: updatedWebhook });
  } catch (error) {
    logger.error('Webhook update error:', error);
    res.status(500).json({ message: 'An error occurred while updating webhook' });
  }
});

// Delete a webhook
app.delete('/webhooks/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const webhookId = parseInt(req.params.id);
    
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    
    // Check if webhook exists and belongs to user
    const webhook = await prisma.webhook.findFirst({
      where: {
        id: webhookId,
        userId
      }
    });
    
    if (!webhook) {
      res.status(404).json({ message: 'Webhook not found' });
      return;
    }
    
    // Delete webhook
    await prisma.webhook.delete({
      where: { id: webhookId }
    });
    
    res.json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    logger.error('Webhook deletion error:', error);
    res.status(500).json({ message: 'An error occurred while deleting webhook' });
  }
});

// Get status of a specific job
app.get('/jobs/:jobId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    
    const job = await jobQueue.getJob(jobId);
    
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    
    // Ensure user can only access their own jobs
    if (job.data.userId !== userId) {
      res.status(403).json({ message: 'Unauthorized access to job' });
      return;
    }
    
    const state = await job.getState();
    const progress = job.progress || 0;
    const result = job.returnvalue;
    const failedReason = job.failedReason;
    
    res.json({
      id: job.id,
      name: job.name,
      state,
      progress,
      result,
      failedReason,
      timestamp: {
        created: job.timestamp,
        started: job.processedOn,
        finished: job.finishedOn
      }
    });
  } catch (error) {
    logger.error('Job status error:', error);
    res.status(500).json({ message: 'An error occurred while fetching job status' });
  }
});

// Get all jobs for the authenticated user
app.get('/jobs', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    
    // Pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Filter parameters
    const status = req.query.status as string; // 'completed', 'failed', 'active', 'waiting', 'delayed'
    
    // Get jobs from the queue
    let jobs;
    if (status) {
      // Map string status to JobType
      const validStatuses = ['completed', 'failed', 'active', 'waiting', 'delayed'] as const;
      if (validStatuses.includes(status as any)) {
        jobs = await jobQueue.getJobs([status as any]);
      } else {
        res.status(400).json({ message: 'Invalid status parameter' });
        return;
      }
    } else {
      jobs = await jobQueue.getJobs(['completed', 'failed', 'active', 'waiting', 'delayed']);
    }
    
    // Filter jobs by user ID
    const filteredJobs = jobs.filter(job => job.data.userId === userId);
    
    // Apply pagination
    const paginatedJobs = filteredJobs.slice(skip, skip + limit);
    
    // Format response
    const jobsData = await Promise.all(paginatedJobs.map(async (job) => {
      const state = await job.getState();
      return {
        id: job.id,
        name: job.name,
        state,
        progress: job.progress || 0,
        timestamp: {
          created: job.timestamp,
          started: job.processedOn,
          finished: job.finishedOn
        }
      };
    }));
    
    res.json({
      jobs: jobsData,
      pagination: {
        total: filteredJobs.length,
        page,
        limit,
        pages: Math.ceil(filteredJobs.length / limit)
      }
    });
  } catch (error) {
    logger.error('Jobs list error:', error);
    res.status(500).json({ message: 'An error occurred while fetching jobs' });
  }
});

app.get('/protected', authenticateToken, (req: Request, res: Response):void => {
  if (!req.user) { 
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }
  res.json({ message: 'This is a protected route', user: req.user });
});

/**
 * Validates if the provided options is a valid JSON object
 * @param options - The options to validate
 * @returns boolean indicating if the options are valid
 */
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
    logger.error("Invalid options",options);
    return false;
  }
}

// Updated job submission route
app.post('/submit-job', authenticateToken, async (req: Request, res: Response) => {
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
    userId: req.user?.userId // Use userId instead of username
  };
  
  
  const job = await jobQueue.add(requestedJob.name, jobData, jobOptions);
  logger.debug(`/submit-job: jobData: ${JSON.stringify(jobData)}`); 
  logger.info(`/submit-job: JOB SCHEDULED : ${job.id}/${requestedJob.name}`);
  
  res.json({ jobId: job.id });
});

// Protected webhook notification route
app.post("/:id", express.json(), (req, res) => {
  const ret_val = req.body;
  logger.info(`Received WEBHOOK notification ", ${ret_val.id}/${ret_val.jobname}`);
  logger.debug(`\n${ret_val.result}\n`);
  res.status(200).end();
});

httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Bull Board UI available at http://localhost:${PORT}/admin`);
  logger.info(`Socket.IO server ready for real-time job notifications`);
});
