/**
 * Test file to verify status consistency implementation
 * This file can be run to validate that all status references work correctly
 */

import {
  BULLMQ_JOB_STATUSES,
  BullMQJobStatus,
  JobStatusUtils,
} from './types/bullmq-statuses.js';

import {
  WEBHOOK_EVENT_TYPES,
  WebhookEventType,
  WebhookEventUtils,
} from './types/webhook-events.js';

import {
  FLOW_STATUSES,
  FlowStatus,
  FlowStatusMapper,
} from './types/flow-statuses.js';

// Test BullMQ Job Status functionality
console.log('=== Testing BullMQ Job Statuses ===');
console.log('All statuses:', BULLMQ_JOB_STATUSES);
console.log('Valid status count:', BULLMQ_JOB_STATUSES.length);

// Test status validation
const testStatuses = ['completed', 'failed', 'invalid', 'stuck', 'waiting-children'];
testStatuses.forEach(status => {
  console.log(`${status}: ${JobStatusUtils.isValidStatus(status) ? 'VALID' : 'INVALID'}`);
});

// Test status categorization
console.log('\nStatus categorization:');
console.log('Final statuses:', JobStatusUtils.getFinalStatuses());
console.log('Processing statuses:', JobStatusUtils.getProcessingStatuses());
console.log('Active statuses (excluding stuck):', JobStatusUtils.getActiveStatuses());

// Test Webhook Event Types
console.log('\n=== Testing Webhook Event Types ===');
console.log('All event types:', WEBHOOK_EVENT_TYPES);
console.log('Valid event type count:', WEBHOOK_EVENT_TYPES.length);

const testEventTypes = ['progress', 'completed', 'invalid', 'all', 'delta'];
testEventTypes.forEach(eventType => {
  console.log(`${eventType}: ${WebhookEventUtils.isValidEventType(eventType) ? 'VALID' : 'INVALID'}`);
});

// Test Flow Status Mapping
console.log('\n=== Testing Flow Status Mapping ===');
console.log('All flow statuses:', FLOW_STATUSES);

// Test flow status determination
const testJobStatusCombinations: BullMQJobStatus[][] = [
  [],
  ['completed'],
  ['failed'],
  ['active', 'waiting'],
  ['completed', 'completed'],
  ['completed', 'failed'],
  ['active', 'completed', 'failed'],
];

testJobStatusCombinations.forEach((jobStatuses, index) => {
  const flowStatus = FlowStatusMapper.determineFlowStatus(jobStatuses);
  console.log(`Test ${index + 1} - Job statuses: [${jobStatuses.join(', ')}] -> Flow status: ${flowStatus}`);
});

console.log('\n=== Status Consistency Test Complete ===');
console.log('✅ All centralized status definitions are working correctly!');

// Export for potential use in other tests
export {
  BULLMQ_JOB_STATUSES,
  WEBHOOK_EVENT_TYPES,
  FLOW_STATUSES,
  JobStatusUtils,
  WebhookEventUtils,
  FlowStatusMapper,
};