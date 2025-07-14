import { Request, Response, NextFunction } from 'express';
import { allowedQueues } from '../config/queues.js';

export const validateQueue = (req: Request, res: Response, next: NextFunction): void => {
  const { queueName } = req.params;

  if (!allowedQueues.includes(queueName)) {
    res.status(400).json({ message: `Queue '${queueName}' is not a valid queue.` });
    return;
  }

  next();
};