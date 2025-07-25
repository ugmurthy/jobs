# BullMQ Sample Plugin

This is a sample plugin for the BullMQ dynamic handler registration system. It demonstrates how to create a plugin that provides custom job handlers.

## Installation

To use this plugin in your project:

1. Install the plugin:
   ```
   pnpm install bullmq-sample-plugin
   ```

2. The plugin will be automatically discovered and loaded by the handler system when the worker starts.

3. No additional configuration is needed as the plugin system automatically detects and registers handlers from installed packages with the `bullmq-handler-plugin` keyword.

## Handlers

This plugin provides the following handlers:

### sampleHandler1

A simple handler that processes jobs and returns a result.

Example job:

```javascript
await queue.add('sampleHandler1', {
  key1: 'value1',
  key2: 'value2'
});
```

### sampleHandler2

A more complex handler that demonstrates progress updates during job processing.

Example job:

```javascript
await queue.add('sampleHandler2', {
  task: 'complex-task',
  parameters: {
    param1: 'value1',
    param2: 'value2'
  }
});
```

## Creating Your Own Plugin

To create your own plugin:

1. Create a new npm package with the following structure:
   ```
   my-plugin/
   ├── package.json
   ├── index.js
   └── handlers/
       ├── handler1.js
       └── handler2.js
   ```

2. In your package.json, add the keyword `bullmq-handler-plugin` and specify the handlers:
   ```json
   {
     "name": "my-plugin",
     "version": "1.0.0",
     "keywords": ["bullmq-handler-plugin"],
     "type": "module",
     "main": "index.js",
     "bullmqHandlerPlugin": {
       "handlers": ["handler1", "handler2"]
     }
   }
   ```

3. In your index.js, export a `registerHandlers` function:
   ```javascript
   export const registerHandlers = async (registry) => {
     const handler1 = await import('./handlers/handler1.js');
     const handler2 = await import('./handlers/handler2.js');
     
     registry.registerHandler(handler1.default);
     registry.registerHandler(handler2.default);
   };
   ```

4. Create your handler files following the handler interface:
   ```javascript
   export default {
     name: 'handler1',
     description: 'Description of the handler',
     version: '1.0.0',
     author: 'Your Name',
     
     async execute(job) {
       // Your handler implementation
       return { status: 'done', result: 'some result' };
     }
   };
   ```

5. Publish your plugin to npm or install it locally:
   ```
   # For local development
   cd my-plugin
   pnpm link
   
   # In your main project
   pnpm link my-plugin
   ```

## Integration with the Main System

When your plugin is installed, the system will:

1. Discover it based on the `bullmq-handler-plugin` keyword in package.json
2. Load the handlers specified in the `bullmqHandlerPlugin.handlers` array
3. Call your `registerHandlers` function to register the handlers with the system
4. Make the handlers available for processing jobs

## Testing Your Plugin

You can test your plugin by:

1. Creating a test project that uses the BullMQ Scheduled Tasks system
2. Installing your plugin (via npm or local link)
3. Starting the worker
4. Adding jobs that use your plugin's handlers
5. Verifying that the jobs are processed correctly

Example test script:

```javascript
import { Queue } from 'bullmq';

const queue = new Queue('jobQueue', {
  connection: { host: 'localhost', port: 6379 }
});

// Test handler1 from your plugin
await queue.add('handler1', {
  testParam: 'test value'
});

console.log('Test job added');
```