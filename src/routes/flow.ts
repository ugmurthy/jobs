import { Router, Request, Response } from 'express';
import { flowService, getFlowJobs, getFlowAsCreateRequest } from '../services/flowService.js';
import { logger } from '@ugm/logger';
import { authenticate } from '../middleware/combinedAuth.js';
import { CreateFlowRequest, FlowUpdateRequest } from '../types/flow-interfaces.js';

const router = Router();

// Create a new flow
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    const flowData: CreateFlowRequest = req.body;
    const flow = await flowService.createFlow(flowData, userId);
    
    res.status(201).json({
      flowId: flow.flowId, // Consistent naming
      message: "Flow created successfully",
      flow,
    });
  } catch (error: any) {
    logger.error('Error creating flow:', error);
    res.status(500).json({ message: 'Error creating flow', error: error.message });
  }
});

// Get all flows
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.userId;
    const flows = await flowService.getFlows(userId);
    res.status(200).json(flows);
  } catch (error: any) {
    logger.error('Error getting flows:', error);
    res.status(500).json({ message: 'Error getting flows', error: error.message });
  }
});

// Get a single flow by ID
router.get('/:flowId', async (req: Request, res: Response) => {
  try {
    const flowId = req.params.flowId; // Use flowId parameter name
    const flow = await flowService.getFlowById(flowId);
    if (flow) {
      res.status(200).json(flow);
    } else {
      res.status(404).json({ message: 'Flow not found' });
    }
  } catch (error: any) {
    logger.error(`Error getting flow ${req.params.flowId}:`, error);
    res.status(500).json({ message: 'Error getting flow', error: error.message });
  }
});

// Update flow progress (new endpoint for external job updates)
router.put('/:flowId/jobs/:jobId', authenticate, async (req: Request, res: Response) => {
  try {
    const { flowId, jobId } = req.params;
    const update: FlowUpdateRequest = req.body;

    await flowService.updateFlowProgress(flowId, { ...update, jobId });
    res.status(200).json({ message: "Flow updated successfully" });
  } catch (error: any) {
    logger.error("Error updating flow progress:", error);
    res.status(500).json({ message: "Error updating flow", error: error.message });
  }
});

// Get all jobs for a flow (refactored to return CreateFlowRequest-like response)
router.get('/:flowId/jobs', async (req: Request, res: Response) => {
  try {
    const flowId = req.params.flowId;
    const flowRequest = await getFlowAsCreateRequest(flowId);
    
    if (!flowRequest) {
      res.status(404).json({ message: 'Flow not found' });
      return;
    }
    
    res.status(200).json(flowRequest);
  } catch (error: any) {
    logger.error(`Error getting jobs for flow ${req.params.flowId}:`, error);
    res.status(500).json({ message: 'Error getting jobs for flow', error: error.message });
  }
});

export default router;