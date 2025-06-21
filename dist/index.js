"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const got_1 = __importDefault(require("got"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const bullmq_1 = require("bullmq");
const logger_1 = require("@ugm/logger");
// Bull Board imports
const api_1 = require("@bull-board/api");
const bullMQAdapter_js_1 = require("@bull-board/api/bullMQAdapter.js");
const express_2 = require("@bull-board/express");
dotenv_1.default.config();
logger_1.logger.level = 'debug';
const redisOptions = { host: 'localhost', port: 6379 };
const PORT = process.env.PORT || 4000;
/////
const webHooksWorker = new bullmq_1.Worker("webhooks", async (job) => {
    logger_1.logger.info(`webhooks ${job.name}/${job.id} - of request job id: ${job.data.id} for ${job.data.user}`);
    const { id, jobname, user, result } = job.data;
    logger_1.logger.info(`id:${id},jobname:${jobname},user:${user}`);
    try {
        await got_1.default.post(`http://localhost:${PORT}/${user}`, { json: { id, jobname, user, result } });
    }
    catch (e) {
        logger_1.logger.error("got.post failed ....");
    }
}, { connection: redisOptions });
logger_1.logger.info("webhooks worker started...");
// Event listeners for the worker
webHooksWorker.on("completed", (job, returnvalue) => {
    logger_1.logger.info(`${job.id} : ${job.name} : completed!`);
});
webHooksWorker.on("progress", (job, progress) => {
    logger_1.logger.info(`\t ${job.name} : progress ${progress}%`);
});
// Event listener for failed jobs
webHooksWorker.on("failed", (job, err) => {
    logger_1.logger.error(`${job?.id} has failed with ${err.message}`);
});
// Default job options
const defaultOptions = { removeOnComplete: { count: 3 }, removeOnFail: { count: 5 } }; // retain info on last 3/5 completed/failures
// Repeat every 2000ms
const repeatOptions = { repeat: { every: 2000 } };
const app = (0, express_1.default)();
const httpServer = http_1.default.createServer(app);
const io = new socket_io_1.Server(httpServer);
app.use(express_1.default.json());
// Set up Bull Board
const serverAdapter = new express_2.ExpressAdapter();
const bullBoard = (0, api_1.createBullBoard)({
    queues: [], // We'll add the queue after it's created
    serverAdapter: serverAdapter,
});
serverAdapter.setBasePath('/admin');
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        res.sendStatus(401);
        return;
    }
    jsonwebtoken_1.default.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
            res.sendStatus(403);
            return;
        }
        req.user = decoded;
        next();
    });
}
app.get('/', (req, res) => {
    res.json({ message: "Hello World" });
});
app.post('/login', (req, res) => {
    const username = req.body.username;
    const token = jsonwebtoken_1.default.sign({ username }, process.env.TOKEN_SECRET, { expiresIn: '1800s' });
    res.json({ token });
});
app.get('/protected', authenticateToken, (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    res.json({ message: 'This is a protected route', user: req.user });
});
const jobQueue = new bullmq_1.Queue('jobQueue', { connection: redisOptions });
const webHookQueue = new bullmq_1.Queue('webhooks', { connection: redisOptions });
const queueEvents = new bullmq_1.QueueEvents('jobQueue', { connection: redisOptions });
// Add the queue to Bull Board
bullBoard.addQueue(new bullMQAdapter_js_1.BullMQAdapter(jobQueue));
bullBoard.addQueue(new bullMQAdapter_js_1.BullMQAdapter(webHookQueue));
// Set up Bull Board routes
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
        logger_1.logger.debug(`options : ${JSON.stringify(options)}`);
        return true;
    }
    catch (error) {
        logger_1.logger.error("Invalid options", options);
        return false;
    }
}
app.post('/submit-job', authenticateToken, async (req, res) => {
    const requestedJob = req.body;
    logger_1.logger.warn(req.body);
    logger_1.logger.info(`submit-job requestedJob: ${JSON.stringify(requestedJob)}`);
    logger_1.logger.debug(`submit-job  requested by :, ${JSON.stringify(req.user)}`);
    // Check if options are provided in the request
    let jobOptions = defaultOptions;
    if (requestedJob.options) {
        // Validate the provided options
        if (isValidOptions(requestedJob.options)) {
            jobOptions = requestedJob.options;
            logger_1.logger.info("Using custom options provided in the request");
        }
        else {
            logger_1.logger.warn("Invalid options provided, using default options");
        }
    }
    else {
        logger_1.logger.info("No options provided, using default options");
    }
    const jobData = { ...requestedJob, ...req.user };
    logger_1.logger.debug(`submit-job : jobData : ${JSON.stringify(jobData)}`);
    const job = await jobQueue.add(requestedJob.name, jobData, jobOptions);
    logger_1.logger.info(`/submit-job: Job: ${requestedJob.name} added, id: ${job.id}`);
    res.json({ jobId: job.id });
});
app.post("/:id", express_1.default.json(), (req, res) => {
    logger_1.logger.info(`Received notification with", ${JSON.stringify(req.body)}`);
    res.status(200).end();
});
// queueEvents.on('progress', ({ jobId, data }: { jobId: string; data: any }) => {
//   io.emit(`job:${jobId}:progress`, data);
// });
// queueEvents.on('completed', ({ jobId, returnvalue }: { jobId: string; returnvalue: string }) => {
//   io.emit(`job:${jobId}:completed`, returnvalue);
// });
// const worker = new Worker('jobQueue', async (j) => {
//   logger.info(`Processing job ${j.name}`);
//   for (let i = 0; i <= 100; i += 10) {
//     await new Promise(resolve => setTimeout(resolve, 1000));
//     await j.updateProgress(i);
//   }
//   return 'Job completed';
// },{host:'localhost',port:6379});
// const worker = new Worker("jobqueue",processJob,{connection:redisOptions});
// // Event listeners for the worker
// worker.on("completed", (job,returnvalue) => {
//   logger.info(`${job.name} : completed! ${JSON.stringify(returnvalue,null,2)}\n`);
// });
// worker.on("progress", (job, progress) => {
//   logger.info(`\t ${job.name} : progress ${progress}%`);
// });
// // Event listener for failed jobs
// worker.on("failed", (job, err) => {
//   logger.info(`${job?.id} has failed with ${err.message}`);
// });
httpServer.listen(PORT, () => {
    logger_1.logger.info(`Server running on port ${PORT}`);
    logger_1.logger.info(`Bull Board UI available at http://localhost:${PORT}/admin`);
});
