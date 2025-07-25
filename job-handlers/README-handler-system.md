# BullMQ Dynamic Handler Registration System

This project implements a dynamic handler registration system for BullMQ workers, allowing for modular, extensible, and configurable job processing.

## Features

- **Modular Handlers**: Each handler is in its own file, making the code more maintainable
- **Dynamic Registration**: Handlers are automatically discovered and loaded at runtime
- **Hot Reloading**: Handlers can be updated without restarting the worker
- **Plugin System**: Extend functionality with npm packages
- **Multi-Queue Support**: Process jobs from multiple queues with different configurations
- **Configurable**: Enable/disable handlers and set options via configuration

## Directory Structure

```
/
├── config.json                # Configuration file
├── index.js                   # Entry point
├── handlers/                  # Handler directories
│   ├── core/                  # Core system handlers
│   │   ├── welcomeMessage.js
│   │   ├── dataExport.js
│   │   └── ollama.js
│   └── custom/                # User-defined handlers
│       └── README.md          # Instructions for custom handlers
├── src/                       # Core system files
│   ├── registry.js            # Handler registry
│   ├── config.js              # Configuration system
│   ├── worker.js              # Worker implementation
│   ├── watcher.js             # File watcher for hot reloading
│   ├── pluginManager.js       # Plugin discovery and loading
│   ├── handlerAPI.js          # API for handler creation
│   └── pluginAPI.js           # API for plugin development
├── examples/                  # Example code
│   └── sample-plugin/         # Sample plugin implementation
└── tests/                     # Tests
    ├── unit/                  # Unit tests
    ├── integration/           # Integration tests
    └── utils/                 # Test utilities
```

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Start Redis:
   ```
   npm run redis-start
   ```

3. Start the worker:
   ```
   npm start
   ```

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

## Creating Handlers

Handlers are JavaScript modules that export an object with a standard interface:

```javascript
// handlers/custom/myCustomHandler.js
export default {
  name: 'myCustomHandler',
  description: 'Description of what this handler does',
  version: '1.0.0',
  author: 'Your Name',
  
  async execute(job) {
    // Your handler implementation
    // job.data contains the job data
    
    // Return a result object
    return { status: 'done', result: 'some result' };
  }
};
```

## Using the Plugin System

Plugins are npm packages that provide additional handlers. To create a plugin:

1. Create a package with the structure shown in `examples/sample-plugin/`
2. Add the keyword `bullmq-handler-plugin` to your package.json
3. Specify handlers in the `bullmqHandlerPlugin` field
4. Export a `registerHandlers` function in your main file

See the [sample plugin README](examples/sample-plugin/README.md) for more details.

## Testing

Run the tests:

```
npm test
```

Run specific test suites:

```
npm run test:unit
npm run test:integration
```

## License

ISC