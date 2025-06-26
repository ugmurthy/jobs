// Client Examples for Job Feedback System
// This file demonstrates how to use Socket.IO, REST polling, and webhooks

// ============================================================================
// 1. Socket.IO Real-time Client Example
// ============================================================================

const io = require('socket.io-client');

class SocketIOJobClient {
  constructor(serverUrl, token) {
    this.socket = io(serverUrl, {
      auth: {
        token: token
      }
    });
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to server via Socket.IO');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });
    
    // Job progress events
    this.socket.on('job:progress', (data) => {
      console.log(`Job ${data.jobId} (${data.jobName}) progress: ${data.progress}%`);
      this.updateProgressBar(data.jobId, data.progress);
    });
    
    // Job completion events
    this.socket.on('job:completed', (data) => {
      console.log(`Job ${data.jobId} (${data.jobName}) completed!`);
      console.log('Result:', data.result);
      this.showCompletionMessage(data.jobId, data.result);
    });
    
    // Job failure events
    this.socket.on('job:failed', (data) => {
      console.log(`Job ${data.jobId} (${data.jobName}) failed!`);
      console.log('Error:', data.error);
      this.showErrorMessage(data.jobId, data.error);
    });
  }
  
  // Subscribe to specific job updates
  subscribeToJob(jobId) {
    console.log(`Subscribing to job ${jobId}`);
    this.socket.emit('subscribe:job', jobId);
    
    // Listen for job-specific events
    this.socket.on(`job:${jobId}:progress`, (data) => {
      console.log(`Specific job ${jobId} progress: ${data.progress}%`);
    });
    
    this.socket.on(`job:${jobId}:completed`, (data) => {
      console.log(`Specific job ${jobId} completed with result:`, data.result);
    });
    
    this.socket.on(`job:${jobId}:failed`, (data) => {
      console.log(`Specific job ${jobId} failed with error:`, data.error);
    });
  }
  
  // Unsubscribe from job updates
  unsubscribeFromJob(jobId) {
    console.log(`Unsubscribing from job ${jobId}`);
    this.socket.emit('unsubscribe:job', jobId);
    
    // Remove job-specific listeners
    this.socket.off(`job:${jobId}:progress`);
    this.socket.off(`job:${jobId}:completed`);
    this.socket.off(`job:${jobId}:failed`);
  }
  
  // UI update methods (implement based on your UI framework)
  updateProgressBar(jobId, progress) {
    // Update progress bar in UI
    console.log(`Updating progress bar for job ${jobId}: ${progress}%`);
  }
  
  showCompletionMessage(jobId, result) {
    // Show completion notification
    console.log(`Showing completion message for job ${jobId}`);
  }
  
  showErrorMessage(jobId, error) {
    // Show error notification
    console.log(`Showing error message for job ${jobId}: ${error}`);
  }
  
  disconnect() {
    this.socket.disconnect();
  }
}

// Usage example
const socketClient = new SocketIOJobClient('http://localhost:4000', 'your_jwt_token');

// ============================================================================
// 2. REST API Polling Client Example
// ============================================================================

class RESTJobClient {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.pollingIntervals = new Map();
  }
  
  // Submit a job
  async submitJob(jobData) {
    try {
      const response = await fetch(`${this.baseUrl}/submit-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(jobData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to submit job: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`Job submitted with ID: ${result.jobId}`);
      return result.jobId;
    } catch (error) {
      console.error('Error submitting job:', error);
      throw error;
    }
  }
  
  // Get job status
  async getJobStatus(jobId) {
    try {
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch job status: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching job status:', error);
      throw error;
    }
  }
  
  // Get all jobs with pagination
  async getAllJobs(page = 1, limit = 10, status = null) {
    try {
      let url = `${this.baseUrl}/jobs?page=${page}&limit=${limit}`;
      if (status) {
        url += `&status=${status}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch jobs: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw error;
    }
  }
  
  // Poll job status until completion
  async pollJobStatus(jobId, interval = 2000, onProgress = null, onComplete = null, onError = null) {
    const poll = async () => {
      try {
        const status = await this.getJobStatus(jobId);
        
        console.log(`Job ${jobId} status:`, status);
        
        // Call progress callback if provided
        if (onProgress) {
          onProgress(status);
        }
        
        // Check if job is completed
        if (status.state === 'completed') {
          this.stopPolling(jobId);
          if (onComplete) {
            onComplete(status);
          }
          return status;
        }
        
        // Check if job failed
        if (status.state === 'failed') {
          this.stopPolling(jobId);
          if (onError) {
            onError(status);
          }
          return status;
        }
        
        // Continue polling if job is still running
        if (status.state === 'active' || status.state === 'waiting') {
          const timeoutId = setTimeout(poll, interval);
          this.pollingIntervals.set(jobId, timeoutId);
        }
        
      } catch (error) {
        console.error('Error polling job status:', error);
        this.stopPolling(jobId);
        if (onError) {
          onError({ error: error.message });
        }
      }
    };
    
    // Start polling
    poll();
  }
  
  // Stop polling for a specific job
  stopPolling(jobId) {
    const timeoutId = this.pollingIntervals.get(jobId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.pollingIntervals.delete(jobId);
      console.log(`Stopped polling for job ${jobId}`);
    }
  }
  
  // Stop all polling
  stopAllPolling() {
    for (const [jobId, timeoutId] of this.pollingIntervals) {
      clearTimeout(timeoutId);
    }
    this.pollingIntervals.clear();
    console.log('Stopped all polling');
  }
}

// Usage example
const restClient = new RESTJobClient('http://localhost:4000', 'your_jwt_token');

// Submit a job and poll for status
async function submitAndPollJob() {
  try {
    const jobId = await restClient.submitJob({
      name: 'testJob',
      data: { key: 'value' }
    });
    
    // Poll for job status with callbacks
    restClient.pollJobStatus(
      jobId,
      2000, // Poll every 2 seconds
      (status) => {
        console.log(`Progress: ${status.progress}%`);
      },
      (status) => {
        console.log('Job completed!', status.result);
      },
      (status) => {
        console.log('Job failed!', status.error || status.failedReason);
      }
    );
  } catch (error) {
    console.error('Error:', error);
  }
}

// ============================================================================
// 3. Webhook Management Client Example
// ============================================================================

class WebhookClient {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }
  
  // Get all webhooks
  async getWebhooks() {
    try {
      const response = await fetch(`${this.baseUrl}/webhooks`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch webhooks: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      throw error;
    }
  }
  
  // Create a new webhook
  async createWebhook(url, eventType, description = null) {
    try {
      const response = await fetch(`${this.baseUrl}/webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          url,
          eventType,
          description
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create webhook: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating webhook:', error);
      throw error;
    }
  }
  
  // Update a webhook
  async updateWebhook(webhookId, updates) {
    try {
      const response = await fetch(`${this.baseUrl}/webhooks/${webhookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update webhook: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating webhook:', error);
      throw error;
    }
  }
  
  // Delete a webhook
  async deleteWebhook(webhookId) {
    try {
      const response = await fetch(`${this.baseUrl}/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete webhook: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting webhook:', error);
      throw error;
    }
  }
}

// Usage example
const webhookClient = new WebhookClient('http://localhost:4000', 'your_jwt_token');

// Setup webhooks
async function setupWebhooks() {
  try {
    // Create webhooks for different events
    await webhookClient.createWebhook(
      'http://localhost:3000/webhooks/progress',
      'progress',
      'Progress updates webhook'
    );
    
    await webhookClient.createWebhook(
      'http://localhost:3000/webhooks/completed',
      'completed',
      'Job completion webhook'
    );
    
    await webhookClient.createWebhook(
      'http://localhost:3000/webhooks/failed',
      'failed',
      'Job failure webhook'
    );
    
    console.log('Webhooks created successfully');
    
    // List all webhooks
    const webhooks = await webhookClient.getWebhooks();
    console.log('Current webhooks:', webhooks);
    
  } catch (error) {
    console.error('Error setting up webhooks:', error);
  }
}

// ============================================================================
// 4. Webhook Receiver Example (Express.js)
// ============================================================================

const express = require('express');

function createWebhookReceiver(port = 3000) {
  const app = express();
  app.use(express.json());
  
  // Progress webhook endpoint
  app.post('/webhooks/progress', (req, res) => {
    const { id, jobname, userId, progress, eventType } = req.body;
    console.log(`[WEBHOOK] Job ${id} (${jobname}) progress: ${progress}%`);
    
    // Process the progress update
    // Update your UI, database, or trigger other actions
    
    res.status(200).json({ received: true });
  });
  
  // Completion webhook endpoint
  app.post('/webhooks/completed', (req, res) => {
    const { id, jobname, userId, result, eventType } = req.body;
    console.log(`[WEBHOOK] Job ${id} (${jobname}) completed!`);
    console.log('Result:', result);
    
    // Process the completion
    // Send notifications, update records, etc.
    
    res.status(200).json({ received: true });
  });
  
  // Failure webhook endpoint
  app.post('/webhooks/failed', (req, res) => {
    const { id, jobname, userId, error, eventType } = req.body;
    console.log(`[WEBHOOK] Job ${id} (${jobname}) failed!`);
    console.log('Error:', error);
    
    // Process the failure
    // Log errors, send alerts, etc.
    
    res.status(200).json({ received: true });
  });
  
  // Generic webhook endpoint for all events
  app.post('/webhooks/all', (req, res) => {
    const { id, jobname, userId, eventType } = req.body;
    console.log(`[WEBHOOK] Job ${id} (${jobname}) event: ${eventType}`);
    console.log('Data:', req.body);
    
    // Process any event type
    switch (eventType) {
      case 'progress':
        console.log(`Progress: ${req.body.progress}%`);
        break;
      case 'completed':
        console.log('Job completed with result:', req.body.result);
        break;
      case 'failed':
        console.log('Job failed with error:', req.body.error);
        break;
    }
    
    res.status(200).json({ received: true });
  });
  
  app.listen(port, () => {
    console.log(`Webhook receiver listening on port ${port}`);
  });
  
  return app;
}

// ============================================================================
// 5. Complete Integration Example
// ============================================================================

async function completeExample() {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoidWdtdXJ0aHkiLCJpYXQiOjE3NTA5NjgwNDYsImV4cCI6MTc1MDk3MTY0Nn0.9QOpmazPpfBlwjcbOo8hDK3wRTWQ7LwJp5Ao7Cvb9Jk';
  const serverUrl = 'http://localhost:4000';
  
  // 1. Setup webhook receiver
  createWebhookReceiver(3000);
  
  // 2. Setup webhooks
  const webhookClient = new WebhookClient(serverUrl, token);
  await setupWebhooks();
  
  // 3. Setup Socket.IO client
  const socketClient = new SocketIOJobClient(serverUrl, token);
  
  // 4. Setup REST client
  const restClient = new RESTJobClient(serverUrl, token);
  
  // 5. Submit a job
  const jobId = await restClient.submitJob({
    name: 'exampleJob',
    data: { message: 'Hello World' }
  });
  
  // 6. Subscribe to real-time updates via Socket.IO
  socketClient.subscribeToJob(jobId);
  
  // 7. Also poll via REST API (redundant but shows both methods)
  restClient.pollJobStatus(jobId, 1000);
  
  console.log(`Job ${jobId} submitted. Monitoring via Socket.IO, REST polling, and webhooks.`);
}

// Export for use in other modules
module.exports = {
  SocketIOJobClient,
  RESTJobClient,
  WebhookClient,
  createWebhookReceiver,
  completeExample
};

// Uncomment to run the complete example
completeExample().catch(console.error);