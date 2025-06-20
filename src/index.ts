import express, {Request,Response,NextFunction} from 'express';
import http from 'http';
import {Server} from 'socket.io';
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { Queue, QueueEvents ,Worker} from 'bullmq';
import {logger} from '@ugm/logger';
dotenv.config();

interface User {
    username : string;
}


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
});
