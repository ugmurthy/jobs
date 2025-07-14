import { Router, Request, Response } from 'express';
import { allowedQueues } from '../config/queues.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ queues: allowedQueues });
});

export default router;