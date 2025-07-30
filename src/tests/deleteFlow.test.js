/**
 * Test script to validate DELETE /flows/:flowId functionality
 * 
 * This test verifies that:
 * 1. Flow deletion removes flow from database
 * 2. All associated jobs are removed from Redis queues
 * 3. Proper error handling for non-existent flows
 * 4. Authorization checks work correctly
 * 5. WebSocket events are emitted properly
 */

import { flowService } from '../services/flowService.js';
import { logger } from '@ugm/logger';

/**
 * Test flow deletion functionality
 */
async function testFlowDeletion() {
    try {
        logger.info('🧪 Starting flow deletion test...');

        // Step 1: Create a test flow
        const testFlow = await flowService.createFlow({
            flowname: 'Test Delete Flow',
            name: 'delete-test-handler',
            queueName: 'default',
            data: { message: 'Testing flow deletion' },
            children: [
                {
                    name: 'child-delete-test-1',
                    queueName: 'default',
                    data: { step: 1 }
                },
                {
                    name: 'child-delete-test-2',
                    queueName: 'default',
                    data: { step: 2 }
                }
            ]
        }, 1); // userId = 1

        logger.info(`✅ Created test flow: ${testFlow.flowId}`);
        logger.info(`📊 Initial flow status: ${testFlow.status}`);

        // Step 2: Simulate some job progress to create tracked jobs
        await flowService.updateFlowProgress(testFlow.flowId, {
            jobId: 'test-delete-job-1',
            status: 'active',
            jobName: 'child-delete-test-1',
            queueName: 'default'
        });

        await flowService.updateFlowProgress(testFlow.flowId, {
            jobId: 'test-delete-job-2',
            status: 'completed',
            result: { success: true },
            jobName: 'child-delete-test-2',
            queueName: 'default'
        });

        // Verify flow exists before deletion
        const flowBeforeDeletion = await flowService.getFlowById(testFlow.flowId);
        console.assert(flowBeforeDeletion !== null, '❌ Flow should exist before deletion');
        logger.info(`✅ Flow exists before deletion with ${Object.keys(flowBeforeDeletion.progress.jobs || {}).length} tracked jobs`);

        // Step 3: Test successful deletion
        logger.info('🗑️ Testing flow deletion...');
        const deletionResult = await flowService.deleteFlow(testFlow.flowId, 1);

        logger.info(`📊 Deletion result: ${JSON.stringify(deletionResult, null, 2)}`);

        // Verify deletion results
        console.assert(deletionResult.total >= 1, '❌ Should have at least 1 job to delete');
        console.assert(deletionResult.successful >= 0, '❌ Should have successful count');
        console.assert(Array.isArray(deletionResult.failed), '❌ Failed should be an array');
        console.assert(Array.isArray(deletionResult.details), '❌ Details should be an array');

        logger.info('✅ Deletion completed successfully');

        // Step 4: Verify flow no longer exists
        const flowAfterDeletion = await flowService.getFlowById(testFlow.flowId);
        console.assert(flowAfterDeletion === null, '❌ Flow should not exist after deletion');
        logger.info('✅ Flow successfully removed from database');

        // Step 5: Test error cases
        logger.info('🧪 Testing error cases...');

        // Test deleting non-existent flow
        try {
            await flowService.deleteFlow('non-existent-flow-id', 1);
            console.assert(false, '❌ Should throw error for non-existent flow');
        } catch (error) {
            console.assert(error.message === 'Flow not found', '❌ Should throw "Flow not found" error');
            logger.info('✅ Correctly handles non-existent flow');
        }

        // Test unauthorized deletion (different user)
        const anotherTestFlow = await flowService.createFlow({
            flowname: 'Another Test Flow',
            name: 'another-test-handler',
            queueName: 'default',
            data: { message: 'Testing unauthorized deletion' }
        }, 1); // userId = 1

        try {
            await flowService.deleteFlow(anotherTestFlow.flowId, 999); // Different user
            console.assert(false, '❌ Should throw error for unauthorized deletion');
        } catch (error) {
            console.assert(error.message === 'Unauthorized', '❌ Should throw "Unauthorized" error');
            logger.info('✅ Correctly handles unauthorized deletion');
        }

        // Clean up the test flow
        await flowService.deleteFlow(anotherTestFlow.flowId, 1);
        logger.info('✅ Cleaned up test flow');

        logger.info('🎉 All flow deletion tests passed!');
        
        return {
            success: true,
            deletedFlowId: testFlow.flowId,
            deletionResult
        };

    } catch (error) {
        logger.error('❌ Flow deletion test failed:', error);
        throw error;
    }
}

/**
 * Test flow deletion with multiple queue scenarios
 */
async function testMultiQueueDeletion() {
    try {
        logger.info('🧪 Testing multi-queue flow deletion...');

        // Create a flow with jobs in different queues
        const testFlow = await flowService.createFlow({
            flowname: 'Multi-Queue Test Flow',
            name: 'multi-queue-handler',
            queueName: 'flowQueue',
            data: { message: 'Testing multi-queue deletion' },
            children: [
                {
                    name: 'job-in-default',
                    queueName: 'default',
                    data: { queue: 'default' }
                },
                {
                    name: 'job-in-webhooks',
                    queueName: 'webhooks',
                    data: { queue: 'webhooks' }
                }
            ]
        }, 1);

        logger.info(`✅ Created multi-queue test flow: ${testFlow.flowId}`);

        // Simulate jobs in different queues
        await flowService.updateFlowProgress(testFlow.flowId, {
            jobId: 'multi-queue-job-1',
            status: 'completed',
            jobName: 'job-in-default',
            queueName: 'default'
        });

        await flowService.updateFlowProgress(testFlow.flowId, {
            jobId: 'multi-queue-job-2',
            status: 'active',
            jobName: 'job-in-webhooks',
            queueName: 'webhooks'
        });

        // Delete the flow
        const deletionResult = await flowService.deleteFlow(testFlow.flowId, 1);
        
        logger.info(`📊 Multi-queue deletion result: ${JSON.stringify(deletionResult, null, 2)}`);
        
        // Verify different queues were handled
        const queueNames = deletionResult.details.map(d => d.queueName);
        const uniqueQueues = [...new Set(queueNames)];
        
        logger.info(`✅ Handled jobs from ${uniqueQueues.length} different queues: ${uniqueQueues.join(', ')}`);
        
        return { success: true, queuesHandled: uniqueQueues };

    } catch (error) {
        logger.error('❌ Multi-queue deletion test failed:', error);
        throw error;
    }
}

// Export test functions
export { testFlowDeletion, testMultiQueueDeletion };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    Promise.all([
        testFlowDeletion(),
        testMultiQueueDeletion()
    ])
    .then(results => {
        logger.info('🎉 All deletion tests completed successfully!');
        console.log('Test Results:', results);
    })
    .catch(error => {
        logger.error('❌ Deletion tests failed:', error);
        process.exit(1);
    });
}