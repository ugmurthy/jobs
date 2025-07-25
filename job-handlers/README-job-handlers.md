# Job Handlers

A modular and extensible system for scheduling and processing tasks using BullMQ.

## Features

- **Dynamic Handler Registration**: Automatically discover and load job handlers at runtime
- **Hot Reloading**: Update handlers without restarting the worker
- **Plugin System**: Extend functionality with npm packages
- **Multi-Queue Support**: Process jobs from multiple queues with different configurations
- **Configurable**: Enable/disable handlers and set options via configuration

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd bullmq-scheduled-tasks
   ```

2. Install dependencies:
   ```
   pnpm install
   ```

3. Start Redis (required for BullMQ):
   ```
   pnpm run redis-start
   ```

## Usage

### Starting the Worker

Start the worker to process jobs:

```
pnpm start
```

This will:
1. Load the configuration from `config.json`
2. Discover and register all handlers
3. Start workers for each configured queue
4. Set up file watchers for hot reloading

### Adding Jobs

Jobs can be added to the queue programmatically:

```javascript
import { Queue } from 'bullmq';

const queue = new Queue('jobQueue', { 
  connection: { host: 'localhost', port: 6379 } 
});

// Add a job for the welcomeMessage handler
await queue.add('welcomeMessage', { 
  username: 'user123' 
});

// Add a job for the dataExport handler
await queue.add('dataExport', { 
  username: 'user123',
  jobData: {
    name: 'Monthly Report',
    path: '/reports/monthly'
  }
});
```

## Handler System

The system uses a dynamic handler registration approach where each handler is defined in its own file and automatically loaded at runtime.

### Core Handlers

The system comes with several built-in handlers:

- **welcomeMessage**: Sends a welcome message to users
- **dataExport**: Exports data to a file
- **ollama**: Processes requests to the Ollama AI model

### Custom Handlers

You can create your own custom handlers in the `handlers/custom` directory. See [Custom Handlers README](handlers/custom/README.md) for details.

### Plugins

The system supports plugins that can provide additional handlers. See [Sample Plugin README](examples/sample-plugin/README.md) for details on creating plugins.

## Configuration

The system is configured via the `config.json` file:

```json
{
  "handlerDirectories": [
    "./handlers/core",
    "./handlers/custom"
  ],
  "queueNames": ["jobQueue"],
  "queueConfigs": {
    "jobQueue": {
      "concurrency": 10,
      "handlers": "*"
    }
  },
  "disabledHandlers": [],
  "handlerOptions": {
    "dataExport": {
      "maxConcurrent": 5,
      "timeout": 30000
    }
  }
}
```

## Documentation

For more detailed documentation:

- [Handler System Documentation](README-handler-system.md)
- [Custom Handlers Guide](handlers/custom/README.md)
- [Plugin Development Guide](examples/sample-plugin/README.md)

## Testing

Run the tests:

```
pnpm test
```

Run specific test suites:

```
pnpm run test:unit
pnpm run test:integration
```

## License

ISC