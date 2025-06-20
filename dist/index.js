"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const bullmq_1 = require("bullmq");
const logger_1 = require("@ugm/logger");
dotenv_1.default.config();
// const delay = (duration:number, ...args:any) => new Promise(resolve => {
//   // Convert duration from seconds to milliseconds and set the timeout
//   setTimeout(resolve, duration * 1000, ...args);
// });
// const welcomeMessage = (job:any) => {
//   logger.info("welcome message : ", job.data);
//   return {status:'done',jobid: job.id};
// }
// const  dataExport = async (job:any) => {
//   const {name,path} = job.data.jobData;
//   // Simulate data export
//   await delay(0.5);
//   job.updateProgress(50);
//   // Simulate some delay
//   await delay(1);
//   job.updateProgress(100);
//   // Simulate data export completion
//   logger.info("1. Data export completed");
//   logger.info(`2. Exporting ${name} data to ${path}`);
//   const tstamp = new Date().toLocaleTimeString();
//   return {status: 'done' ,duration: 1000, name,path,completedAt: tstamp};
// };
// const jobHandlers = {
//   welcomeMessage: welcomeMessage,
//   dataExport: dataExport,
// };
// const processJob = async (job: Record<string,unknown>) => {
//   const name = job.name as string ? job.name as string : ""
//   const handler = jobHandlers[name as string];
//   if (handler) {
//     logger.info(`Processing job: ${job.name}`);
//      const retval = await handler(job);
//      if (retval) {
//       logger.info(`Job ${job.name} returned:`, retval);
//       return retval;
//      }
//   }
// };
// Default job options
const defaultOptions = { removeOnComplete: { count: 3 }, removeOnFail: { count: 5 } }; // retain info on last 3/5 completed/failures
// Repeat every 2000ms
const repeatOptions = { repeat: { every: 2000 } };
const app = (0, express_1.default)();
const httpServer = http_1.default.createServer(app);
const io = new socket_io_1.Server(httpServer);
app.use(express_1.default.json());
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
const redisOptions = { host: 'localhost', port: 6379 };
const jobQueue = new bullmq_1.Queue('jobQueue', { connection: redisOptions });
const queueEvents = new bullmq_1.QueueEvents('jobQueue', { connection: redisOptions });
app.post('/submit-job', authenticateToken, async (req, res) => {
    const requestedJob = await req.body;
    logger_1.logger.info("submit-job requestedJob.data: ", JSON.stringify(requestedJob));
    const job = await jobQueue.add(requestedJob.name, requestedJob, defaultOptions);
    logger_1.logger.info(`/submit-job: Job: ${requestedJob.name} added, id: ${job.id}`);
    //const job = await jobQueue.add('job', { data: req.body.data as string });
    res.json({ jobId: job.id });
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
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
    logger_1.logger.info(`Server running on port ${PORT}`);
});
