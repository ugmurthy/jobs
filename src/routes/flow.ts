import { Router, Request, Response } from 'express';
import * as flowService from '../services/flowService.js';
import { logger } from '@ugm/logger';
import { authenticate } from '../middleware/combinedAuth.js';

const router = Router();
//logger.level = 'debug'
// Create a new flow
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    const flow = await flowService.createFlow(req.body, userId);
    res.status(201).json(flow);
  } catch (error: any) {
    logger.error('Error creating flow:', error);
    res.status(500).json({ message: 'Error creating flow', error: error.message });
  }
});

// Get all flows
router.get('/', async (req: Request, res: Response) => {
  try {
    const flows = await flowService.getFlows();
    res.status(200).json(flows);
  } catch (error: any) {
    logger.error('Error getting flows:', error);
    res.status(500).json({ message: 'Error getting flows', error: error.message });
  }
});

// Get a single flow by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const flow = await flowService.getFlowById(id);
    if (flow) {
      res.status(200).json(flow);
    } else {
      res.status(404).json({ message: 'Flow not found' });
    }
  } catch (error: any) {
    logger.error(`Error getting flow ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error getting flow', error: error.message });
  }
});

// Get all jobs for a flow
router.get('/:id/jobs', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const jobs = await flowService.getFlowJobs(id);
    res.status(200).json(jobs);
  } catch (error: any) {
    logger.error(`Error getting jobs for flow ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error getting jobs for flow', error: error.message });
  }
});

export default router;