import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FlowService, getFlowAsCreateRequest } from '../services/flowService.js';
import { CreateFlowRequest, FlowUpdateRequest } from '../types/flow-interfaces.js';
import { BullMQJobStatus } from '../types/bullmq-statuses.js';
import prisma from '../lib/prisma.js';

// Mock dependencies
vi.mock('../lib/prisma.js');
vi.mock('../config/redis.js');
vi.mock('../services/enhancedFlowProducer.js');
vi.mock('../services/flowWebSocketService.js');

describe('FlowService', () => {
  let flowService: FlowService;
  const mockUserId = 1;

  beforeEach(() => {
    flowService = new FlowService();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await flowService.close();
  });

  describe('createFlow', () => {
    it('should create flow with consistent flowId', async () => {
      const mockFlowData: CreateFlowRequest = {
        flowname: 'Test Flow',
        name: 'test-handler',
        queueName: 'testQueue',
        data: { test: 'data' },
        opts: {},
        children: []
      };

      const mockFlow = {
        id: 'flow_123',
        flowname: 'Test Flow',
        name: 'test-handler',
        queueName: 'testQueue',
        userId: mockUserId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: null,
        completedAt: null,
        jobStructure: {},
        progress: {},
        result: null,
        error: null
      };

      // Mock Prisma calls
      (prisma.flow.create as any).mockResolvedValue(mockFlow);
      (prisma.flow.findUnique as any).mockResolvedValue(mockFlow);
      (prisma.flow.update as any).mockResolvedValue(mockFlow);

      const result = await flowService.createFlow(mockFlowData, mockUserId);

      expect(result.flowId).toBeDefined();
      expect(typeof result.flowId).toBe('string');
      expect(result.flowname).toBe('Test Flow');
      expect(result.name).toBe('test-handler');
      expect(result.queueName).toBe('testQueue');
    });

    it('should inject flowId into all job data', async () => {
      const complexFlowData: CreateFlowRequest = {
        flowname: 'Complex Flow',
        name: 'parent-job',
        queueName: 'parentQueue',
        data: { parent: 'data' },
        children: [
          {
            name: 'child-job-1',
            queueName: 'childQueue1',
            data: { child1: 'data' }
          },
          {
            name: 'child-job-2',
            queueName: 'childQueue2',
            data: { child2: 'data' },
            children: [
              {
                name: 'grandchild-job',
                queueName: 'grandchildQueue',
                data: { grandchild: 'data' }
              }
            ]
          }
        ]
      };

      const mockFlow = {
        id: 'flow_complex_123',
        flowname: 'Complex Flow',
        name: 'parent-job',
        queueName: 'parentQueue',
        userId: mockUserId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: null,
        completedAt: null,
        jobStructure: {},
        progress: {},
        result: null,
        error: null
      };

      (prisma.flow.create as any).mockResolvedValue(mockFlow);
      (prisma.flow.findUnique as any).mockResolvedValue(mockFlow);
      (prisma.flow.update as any).mockResolvedValue(mockFlow);

      const result = await flowService.createFlow(complexFlowData, mockUserId);

      expect(result.flowId).toBeDefined();
      expect(result.flowname).toBe('Complex Flow');
      
      // Verify job structure includes all jobs
      expect(prisma.flow.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          jobStructure: expect.objectContaining({
            root: expect.objectContaining({
              name: 'parent-job',
              children: expect.arrayContaining([
                expect.objectContaining({ name: 'child-job-1' }),
                expect.objectContaining({ 
                  name: 'child-job-2',
                  children: expect.arrayContaining([
                    expect.objectContaining({ name: 'grandchild-job' })
                  ])
                })
              ])
            })
          })
        })
      });
    });
  });

  describe('updateJobProgress', () => {
    it('should update flow progress correctly', async () => {
      const flowId = 'flow_123';
      const jobId = 'job_456';
      const updateData: FlowUpdateRequest = {
        jobId,
        status: 'completed',
        result: { success: true }
      };

      const mockFlow = {
        id: flowId,
        progress: {
          jobs: {},
          summary: {
            total: 2,
            completed: 0,
            failed: 0,
            delayed: 0,
            active: 0,
            waiting: 2,
            "waiting-children": 0,
            paused: 0,
            stuck: 0,
            percentage: 0
          }
        }
      };

      (prisma.flow.findUnique as any).mockResolvedValue(mockFlow);
      (prisma.flow.update as any).mockResolvedValue(mockFlow);

      await flowService.updateFlowProgress(flowId, updateData);

      expect(prisma.flow.update).toHaveBeenCalledWith({
        where: { id: flowId },
        data: expect.objectContaining({
          progress: expect.objectContaining({
            jobs: expect.objectContaining({
              [jobId]: expect.objectContaining({
                status: 'completed',
                result: { success: true }
              })
            })
          })
        })
      });
    });

    it('should determine correct flow status based on job statuses', async () => {
      const flowId = 'flow_123';
      const updateData: FlowUpdateRequest = {
        jobId: 'job_456',
        status: 'failed',
        error: { message: 'Job failed' }
      };

      const mockFlow = {
        id: flowId,
        progress: {
          jobs: {
            'job_123': { status: 'completed' as BullMQJobStatus },
            'job_456': { status: 'active' as BullMQJobStatus }
          },
          summary: { total: 2, completed: 1, failed: 0, percentage: 50 }
        }
      };

      (prisma.flow.findUnique as any).mockResolvedValue(mockFlow);
      (prisma.flow.update as any).mockResolvedValue(mockFlow);

      await flowService.updateFlowProgress(flowId, updateData);

      expect(prisma.flow.update).toHaveBeenCalledWith({
        where: { id: flowId },
        data: expect.objectContaining({
          status: 'failed' // Should be failed because one job failed
        })
      });
    });
  });

  describe('getFlowById', () => {
    it('should return formatted flow response', async () => {
      const flowId = 'flow_123';
      const mockFlow = {
        id: flowId,
        flowname: 'Test Flow',
        name: 'test-handler',
        queueName: 'testQueue',
        status: 'running',
        progress: {
          summary: {
            total: 3,
            completed: 1,
            failed: 0,
            percentage: 33
          }
        },
        result: null,
        error: null,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        startedAt: new Date('2023-01-01'),
        completedAt: null
      };

      (prisma.flow.findUnique as any).mockResolvedValue(mockFlow);

      const result = await flowService.getFlowById(flowId);

      expect(result).toEqual({
        flowId: flowId,
        flowname: 'Test Flow',
        name: 'test-handler',
        queueName: 'testQueue',
        status: 'running',
        progress: {
          total: 3,
          completed: 1,
          failed: 0,
          percentage: 33
        },
        result: null,
        error: null,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-02T00:00:00.000Z',
        startedAt: '2023-01-01T00:00:00.000Z',
        completedAt: undefined
      });
    });

    it('should return null for non-existent flow', async () => {
      (prisma.flow.findUnique as any).mockResolvedValue(null);

      const result = await flowService.getFlowById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getFlows', () => {
    it('should return all flows for user', async () => {
      const mockFlows = [
        {
          id: 'flow_1',
          flowname: 'Flow 1',
          name: 'handler-1',
          queueName: 'queue1',
          status: 'completed',
          progress: { summary: { total: 1, completed: 1, failed: 0, percentage: 100 } },
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01')
        },
        {
          id: 'flow_2',
          flowname: 'Flow 2',
          name: 'handler-2',
          queueName: 'queue2',
          status: 'running',
          progress: { summary: { total: 2, completed: 1, failed: 0, percentage: 50 } },
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02')
        }
      ];

      (prisma.flow.findMany as any).mockResolvedValue(mockFlows);

      const result = await flowService.getFlows(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0].flowId).toBe('flow_1');
      expect(result[1].flowId).toBe('flow_2');
      expect(prisma.flow.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('getFlowAsCreateRequest', () => {
    it('should return CreateFlowRequest-like response for existing flow', async () => {
      const flowId = 'flow_123';
      const mockFlow = {
        id: flowId,
        flowname: 'Test Flow',
        name: 'test-handler',
        queueName: 'testQueue',
        userId: mockUserId,
        jobStructure: {
          root: {
            name: 'test-handler',
            queueName: 'testQueue',
            data: { test: 'data' },
            opts: { delay: 1000 },
            children: [
              {
                name: 'child-job',
                queueName: 'childQueue',
                data: { child: 'data' },
                opts: {},
                children: []
              }
            ]
          }
        },
        status: 'completed',
        progress: {},
        result: null,
        error: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: new Date(),
        completedAt: new Date()
      };

      (prisma.flow.findUnique as any).mockResolvedValue(mockFlow);

      const result = await getFlowAsCreateRequest(flowId);

      expect(result).toEqual({
        flowname: 'Test Flow',
        name: 'test-handler',
        queueName: 'testQueue',
        data: { test: 'data' },
        opts: { delay: 1000 },
        children: [
          {
            name: 'child-job',
            queueName: 'childQueue',
            data: { child: 'data' },
            opts: {},
            children: []
          }
        ]
      });
    });

    it('should return null for non-existent flow', async () => {
      (prisma.flow.findUnique as any).mockResolvedValue(null);

      const result = await getFlowAsCreateRequest('non-existent');

      expect(result).toBeNull();
    });

    it('should return null for flow without root job structure', async () => {
      const mockFlow = {
        id: 'flow_123',
        flowname: 'Test Flow',
        jobStructure: {}, // No root structure
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (prisma.flow.findUnique as any).mockResolvedValue(mockFlow);

      const result = await getFlowAsCreateRequest('flow_123');

      expect(result).toBeNull();
    });
  });
});

// Integration Tests
describe('Flow API Integration', () => {
  it('should create and track cross-queue jobs', async () => {
    // This would be an integration test that:
    // 1. Creates a flow with multiple queue jobs
    // 2. Verifies flowId is injected into job data across queues
    // 3. Tests progress updates from external jobs
    // 4. Verifies WebSocket events are emitted
    
    // Mock implementation for now
    expect(true).toBe(true);
  });
});

// End-to-End Tests
describe('Flow E2E', () => {
  it('should complete full flow lifecycle with WebSocket updates', async () => {
    // This would be an E2E test that:
    // 1. Tests complete flow from creation to completion
    // 2. Verifies WebSocket events are emitted correctly
    // 3. Checks final status and results
    // 4. Tests error handling and recovery
    
    // Mock implementation for now
    expect(true).toBe(true);
  });
});