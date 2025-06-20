import express, {Request,Response,NextFunction} from 'express';
import http from 'http';
import {Server} from 'socket.io';
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { Queue, QueueEvents, Worker } from 'bullmq';
import {logger} from '@ugm/logger';
// Bull Board imports
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
import { ExpressAdapter } from "@bull-board/express";
dotenv.config();

interface User {
    username : string;
}

// Default job options
const defaultOptions = {removeOnComplete:{count:3}, removeOnFail:{count:5}} // retain info on last 3/5 completed/failures
// Repeat every 2000ms

const repeatOptions = {repeat: {every:2000}} 
declare module 'express' {
    interface Request {
        user?:User;
    }
}

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

app.use(express.json());

// Set up Bull Board
const serverAdapter = new ExpressAdapter();
const bullBoard = createBullBoard({
  queues: [],  // We'll add the queue after it's created
  serverAdapter: serverAdapter,
});
serverAdapter.setBasePath('/admin');

function authenticateToken(req: Request, res: Response, next: NextFunction):void {
  const authHeader = req.headers['authorization'] as string;
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null)  {
    res.sendStatus(401);
    return;
  }

  jwt.verify(token, process.env.TOKEN_SECRET as string, (err, decoded) => {
    if (err) {
        res.sendStatus(403);
        return;
    } 
    req.user = decoded as User;
    next();
  });
}

app.get('/',(req:Request,res:Response)=>{
    res.json({message:"Hello World"})
})

app.post('/login', (req: Request, res: Response) => {
  const username = req.body.username as string;
  const token = jwt.sign({ username }, process.env.TOKEN_SECRET as string, { expiresIn: '1800s' });
  res.json({ token });
});

app.get('/protected', authenticateToken , (req: Request, res: Response):void => {
  if (!req.user) { 
    res.status(401).json({ message: 'Not authenticated' });
    return;
}
  res.json({ message: 'This is a protected route', user: req.user });
});

const redisOptions = {host:'localhost', port: 6379}

const jobQueue = new Queue('jobQueue', { connection:redisOptions });
const queueEvents = new QueueEvents('jobQueue', { connection:redisOptions });

// Add the queue to Bull Board
bullBoard.addQueue(new BullMQAdapter(jobQueue));

// Set up Bull Board routes
app.use('/admin', serverAdapter.getRouter());

app.post('/submit-job', authenticateToken, async (req: Request, res: Response) => {
  const requestedJob= await req.body;
  logger.info("submit-job requestedJob.data: ",JSON.stringify(requestedJob));

  const job = await jobQueue.add(requestedJob.name,requestedJob,defaultOptions)
  logger.info(`/submit-job: Job: ${requestedJob.name} added, id: ${job.id}`);
  
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
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Bull Board UI available at http://localhost:${PORT}/admin`);
});
