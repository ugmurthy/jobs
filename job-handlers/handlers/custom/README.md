# Custom Handlers

This directory is for custom job handlers that extend the worker functionality. Custom handlers are automatically discovered and loaded at runtime, and can be updated without restarting the worker (hot reloading).

## Adding a Custom Handler

1. Create a new JavaScript file named after your job type (e.g., `myCustomJob.js`)
2. Export a handler object with the following structure:

```javascript
export default {
  name: 'myCustomJob',  // Must match the filename (without .js)
  description: 'Description of what this handler does',
  version: '1.0.0',
  author: 'Your Name',
  // Add a data key describing the job.data structure
  data: {
    "type": "object",
    "properties": {
      "param1": { "type": "string" },
      "param2": { "type": "number" }
    }
  },
  
  async execute(job) {
    // Your handler implementation
    // job.data contains the job data
    const childrenValues = await job.getChildrenValues();
    const children = Object.entries(childrenValues).map(([k,v])=>({id:k,...v}));
    // Return a result object
    return {
      id: job.id,
      input: job.data,
      children,
      result: { status: 'done', result: 'some result' }
    };
  }
};
```

3. The handler will be automatically loaded due to the file watcher system
4. Submit jobs with the name matching your handler name

## Example Usage

To add a job for your custom handler:

```javascript
import { Queue } from 'bullmq';

const queue = new Queue('jobQueue', {
  connection: { host: 'localhost', port: 6379 }
});

// Add a job for your custom handler
await queue.add('myCustomJob', {
  // Job data specific to your handler
  param1: 'value1',
  param2: 'value2'
});
```

## Advanced Handler Features

### Progress Updates

You can update job progress during execution:

```javascript
async execute(job) {
  // Start processing
  await job.updateProgress(25);
  
  // More processing
  await job.updateProgress(50);
  
  // Complete processing
  await job.updateProgress(100);
  
  const childrenValues = await job.getChildrenValues();
  const children = Object.entries(childrenValues).map(([k,v])=>({id:k,...v}));
  return {
    id: job.id,
    input: job.data,
    children,
    result: { status: 'done', result: 'completed' }
  };
}
```

### Error Handling

Handle errors properly in your handler:

```javascript
async execute(job) {
  const childrenValues = await job.getChildrenValues();
  const children = Object.entries(childrenValues).map(([k,v])=>({id:k,...v}));
  try {
    // Your processing logic
    return {
      id: job.id,
      input: job.data,
      children,
      result: { status: 'done', result: 'success' }
    };
  } catch (error) {
    // Log the error
    console.error(`Error in ${job.name}:`, error);
    
    // Rethrow to mark the job as failed
    throw error;
  }
}
```

### Configuration Options

You can access handler-specific configuration from the config.json file:

```javascript
async execute(job) {
  // Access configuration options if available
  const options = job.handlerOptions || {};
  const timeout = options.timeout || 30000;
   const childrenValues = await job.getChildrenValues();
  const children = Object.entries(childrenValues).map(([k,v])=>({id:k,...v}));
  // Use the options in your handler
  // ...
  
  return {
    id: job.id,
    input: job.data,
    children,
    result: { status: 'done' }
  };
}
```