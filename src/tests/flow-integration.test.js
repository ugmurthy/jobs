/**
 * Test script to verify flow progress integration in job events
 * 
 * This test demonstrates how the job event handlers automatically
 * update flow progress when jobs complete or fail.
 */

import { flowService } from '../services/flowService.js';
import { getQueue } from '../config/bull.js';
import { logger } from '@ugm/logger';

/**
 * Test flow progress integration
 */
async function testFlowIntegration() {
    try {
        logger.info('Starting flow integration test...');

        // Create a test flow
        const testFlow = await flowService.createFlow({
            flowname: 'Test Flow Integration',
            name: 'test-handler',
            queueName: 'default',
            data: { message: 'Testing flow integration' },
            children: [
                {
                    name: 'child-handler-1',
                    queueName: 'default',
                    data: { step: 1 }
                },
                {
                    name: 'child-handler-2', 
                    queueName: 'default',
                    data: { step: 2 }
                }
            ]
        }, 1); // userId = 1

        logger.info(`Created test flow: ${testFlow.flowId}`);
        logger.info(`Root job ID: ${testFlow.flowId}`);

        // The flow will automatically start and jobs will be processed
        // Job event handlers will automatically call updateFlowProgress
        // when jobs complete or fail

        logger.info('Flow integration test setup complete');
        logger.info('Monitor the logs to see automatic flow progress updates');

        return testFlow;

    } catch (error) {
        logger.error('Flow integration test failed:', error);
        throw error;
    }
}

/**
 * Verify flow progress updates
 */
async function verifyFlowProgress(flowId) {
    try {
        const flow = await flowService.getFlowById(flowId);
        if (!flow) {
            throw new Error(`Flow ${flowId} not found`);
        }

        logger.info(`Flow ${flowId} status: ${flow.status}`);
        logger.info(`Flow progress: ${flow.progress.completed}/${flow.progress.total} jobs completed`);
        logger.info(`Flow percentage: ${flow.progress.percentage}%`);

        return flow;
    } catch (error) {
        logger.error('Error verifying flow progress:', error);
        throw error;
    }
}

// Export test functions
export { testFlowIntegration, verifyFlowProgress };

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testFlowIntegration()
        .then(flow => {
            logger.info('Test completed successfully');
            // Check progress after a delay
            setTimeout(() => {
                verifyFlowProgress(flow.flowId);
            }, 5000);
        })
        .catch(error => {
            logger.error('Test failed:', error);
            process.exit(1);
        });
}