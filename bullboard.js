import { Worker ,Queue} from "bullmq";

import {logger} from '@ugm/logger'
/// for bull board express
import express from "express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
import { ExpressAdapter } from "@bull-board/express";
//

logger.level = 'debug'
const redisOptions = { host: "localhost", port: 6379 };
const jobQueue= new Queue("jobQueue", { connection: redisOptions });

const serverAdapter = new ExpressAdapter();

const bullBoard = createBullBoard({
  queues: [new BullMQAdapter(jobQueue)],
  serverAdapter: serverAdapter,
});

serverAdapter.setBasePath("/admin");

const app = express();
app.use("/admin", serverAdapter.getRouter());

app.listen(4001, function () {
  logger.info("Server running on port 4001");
});