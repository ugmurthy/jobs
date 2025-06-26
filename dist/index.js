import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import got from 'got';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Queue, QueueEvents, Worker } from 'bullmq';
import { logger } from '@ugm/logger';
// Bull Board imports
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
import { ExpressAdapter } from "@bull-board/express";
import userService from './services/userService.js';
dotenv.config();
logger.level = 'debug';
const redisOptions = { host: 'localhost', port: 6379 };
const PORT = process.env.PORT || 4000;
/////
const webHooksWorker = new Worker("webhooks", async (job) => {
    const { id, jobname, userId, result } = job.data;
    logger.info(`WORKER: webhooks ${JSON.stringify(job.id)}/${job.name} active for ${userId}/${id}/${jobname}`);
    try {
        // Get user from database to get their webhook URL
        const user = await userService.getUserById(userId);
        if (!user || !user.webhookUrl) {
            logger.error("User not found or webhook URL not set");
            return;
        }
    }
    catch (e) {
        logger.error(`Could not get user details : ${userId}`);
    }
    try {
        const url = `http://localhost:${PORT}/${userId}`;
        await got.post(url, { json: { id, jobname, userId, result } });
    }
    catch (e) {
        logger.error("got.post failed ....");
    }
}, { connection: redisOptions });
logger.info("webhooks worker started...");
// Event listeners for the worker
webHooksWorker.on("completed", (job, returnvalue) => {
    logger.info(`WORKER : ${job.id} : ${job.name} : completed!`);
});
webHooksWorker.on("progress", (job, progress) => {
    logger.info(`WORKER : ${job.name} : progress ${progress}%`);
});
// Event listener for failed jobs
webHooksWorker.on("failed", (job, err) => {
    logger.error(`WORKER : ${job?.id} has failed with ${err.message}`);
});
// Default job options
const defaultOptions = { removeOnComplete: { count: 3 }, removeOnFail: { count: 5 } }; // retain info on last 3/5 completed/failures
// Repeat every 2000ms
const repeatOptions = { repeat: { every: 2000 } };
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);
app.use(express.json());
// Set up Bull Board
const serverAdapter = new ExpressAdapter();
const bullBoard = createBullBoard({
    queues: [], // We'll add the queue after it's created
    serverAdapter: serverAdapter,
});
serverAdapter.setBasePath('/admin');
// Updated authentication middleware
async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.sendStatus(401);
        return;
    }
    try {
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
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
    }
    catch (err) {
        res.sendStatus(403);
    }
}
// Protected root route
app.get('/', authenticateToken, (req, res) => {
    res.json({ message: "Hello World" });
});
// User registration route
app.post('/register', async (req, res) => {
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
    }
    catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({ message: 'An error occurred during registration' });
    }
});
// Updated login route
app.post('/login', async (req, res) => {
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
    }
    catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ message: 'An error occurred during login' });
    }
});
// Logout route
app.post('/logout', authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        await userService.logout(req.user.userId);
        res.json({ message: 'Logout successful' });
    }
    catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({ message: 'An error occurred during logout' });
    }
});
// Token refresh route
app.post('/refresh-token', async (req, res) => {
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
    }
    catch (error) {
        logger.error('Token refresh error:', error);
        res.status(500).json({ message: 'An error occurred during token refresh' });
    }
});
// Password reset request route
app.post('/request-password-reset', async (req, res) => {
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
    }
    catch (error) {
        logger.error('Password reset request error:', error);
        res.status(500).json({ message: 'An error occurred during password reset request' });
    }
});
// Password reset route
app.post('/reset-password', async (req, res) => {
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
    }
    catch (error) {
        logger.error('Password reset error:', error);
        res.status(500).json({ message: 'An error occurred during password reset' });
    }
});
// Webhook URL update route
app.put('/webhook-url', authenticateToken, async (req, res) => {
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
    }
    catch (error) {
        logger.error('Webhook URL update error:', error);
        res.status(500).json({ message: 'An error occurred during webhook URL update' });
    }
});
app.get('/protected', authenticateToken, (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    res.json({ message: 'This is a protected route', user: req.user });
});
const jobQueue = new Queue('jobQueue', { connection: redisOptions });
const webHookQueue = new Queue('webhooks', { connection: redisOptions });
const queueEvents = new QueueEvents('jobQueue', { connection: redisOptions });
// Add the queue to Bull Board
bullBoard.addQueue(new BullMQAdapter(jobQueue));
bullBoard.addQueue(new BullMQAdapter(webHookQueue));
// Set up Bull Board routes - now protected
app.use('/admin', serverAdapter.getRouter());
/**
 * Validates if the provided options is a valid JSON object
 * @param options - The options to validate
 * @returns boolean indicating if the options are valid
 */
function isValidOptions(options) {
    // Check if options is an object and not null
    if (typeof options !== 'object' || options === null) {
        return false;
    }
    try {
        // Try to stringify and parse to ensure it's a valid JSON object
        JSON.parse(JSON.stringify(options));
        logger.debug(`options : ${JSON.stringify(options)}`);
        return true;
    }
    catch (error) {
        logger.error("Invalid options", options);
        return false;
    }
}
// Updated job submission route
app.post('/submit-job', authenticateToken, async (req, res) => {
    const requestedJob = req.body;
    logger.info(`submit-job requested by: ${JSON.stringify(req.user)} requestedJob: ${JSON.stringify(requestedJob)}`);
    logger.debug(`/submit-job ${JSON.stringify(req.body)}`);
    // Check if options are provided in the request
    let jobOptions = defaultOptions;
    if (requestedJob.options) {
        // Validate the provided options
        if (isValidOptions(requestedJob.options)) {
            jobOptions = requestedJob.options;
            logger.info("Using custom options provided in the request");
        }
        else {
            logger.warn("Invalid options provided, using default options");
        }
    }
    else {
        logger.info("No options provided, using default options");
    }
    const jobData = {
        ...requestedJob,
        userId: req.user?.userId // Use userId instead of username
    };
    const job = await jobQueue.add(requestedJob.name, jobData, jobOptions);
    logger.info(`/submit-job: JOB SCHEDULED : ${job.id}/${requestedJob.name}`);
    logger.debug(`submit-job: jobData: ${JSON.stringify(jobData)}`);
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
});
