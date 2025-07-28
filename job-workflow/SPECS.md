# Graphical Workflow Web Application - Complete Product Specification

## 1. Executive Summary

A web-based graphical workflow designer that enables users to create, edit, and execute data processing pipelines through an intuitive drag-and-drop interface. The system uses a **bottom-up tree architecture** where data flows from leaf starter nodes to a root output node, integrating seamlessly with an existing backend processing system.

## 2. Architecture Overview

### 2.1 System Architecture

- **Frontend**: Visual workflow designer with drag-and-drop interface
- **Backend Integration**: RESTful API integration with existing job processing system
- **Data Flow**: Bottom-up tree structure (leaf → root execution)
- **Processing Model**: Hierarchical job queue system with parent-child dependencies

### 2.2 Core Concepts

- **Starter Nodes**: Leaf nodes that provide multi-modal input data
- **Processor Nodes**: Intermediate processing units with configurable properties
- **Output Node**: Single root node that produces final workflow results
- **Tree Constraints**: Each node has exactly one parent (except root), multiple children allowed

## 3. Technical Stack

### 3.1 Frontend Technologies

```
Core Framework:
├── React 18+ with TypeScript
├── State Management: Redux Toolkit + RTK Query
├── Canvas/Visualization: React Flow
├── Build Tool: Vite
└── Package manager: pnpm


UI/UX Libraries:
├── Component Library: Radix UI, Lucide icons
├── Drag & Drop: @dnd-kit/core
├── File Handling: react-dropzone
├── Audio/Video: RecordRTC, WaveSurfer.js
└── Styling: Tailwind CSS + Emotion

Development Tools:
├── Linting: ESLint + Prettier
├── Testing: Jest + React Testing Library + Cypress
├── Bundling: Webpack (via Vite)
└── Package Manager: pnpm
```

### 3.2 Backend Integration

```
API Communication:
├── HTTP Client: fetch API
├── Real-time: WebSocket (Socket.io-client)
├── File Upload: FormData with progress tracking
└── Error Handling: Custom error boundary system

Data Serialization:
├── JSON Schema validation
├── Custom serialization/deserialization classes
├── Tree traversal algorithms
└── Workflow validation engine
```

### 3.3 Infrastructure & Deployment

```
Development:
├── Local Development: node js on local machine
├── Hot Reload: Vite HMR
└── Environment Management: dotenv

Production:
├── Hosting: Vercel/Netlify (Frontend)

```

## 4. Core System Design

### 4.1 Data Flow Architecture

The system implements a **bottom-up tree execution model**:

```
Root Node (Output)
├── Processor Node A
│   ├── Starter Node 1 (Text Input)
│   └── Starter Node 2 (File Input)
└── Processor Node B
    └── Starter Node 3 (Text Input)
```

**Execution Flow**: Data originates at starter nodes (leaves), flows upward through processor nodes, and culminates at the output node (root).

### 4.2 Node System Architecture

#### Node Structure

```typescript
interface WorkflowNode {
  id: string; // ISO date/time suffixed with node number
  name: string; // Human-readable identifier
  type: NodeType; // Determines available properties : derived from name or same as name
  properties: Record<string, any>; // Node-specific configuration
  position: { x: number; y: number }; // Canvas coordinates
  parent: string | null; // Single parent reference
  children: string[]; // Multiple children allowed
  status:
    | "completed"
    | "active"
    | "waiting"
    | "failed"
    | "waiting-children"
    | "delayed";
  queueName: string; // Backend processing queue
  opts: Record<string, any>; // Backend execution options
  inputData?: Record<string, any>; // Input data for starter nodes
}
```

#### Node Categories

- **Input Nodes**: Microphone, File Upload, Text Entry
- **Processing Nodes**: Text2Speech, Speech2Text, Text Analyzer, Ollama, Cloud Infererence
- **Logic Nodes**: Conditional, Loop, Branch, Merge, Transform
- **Output Nodes**: File Save, API Call, Display, Export, Notification

### 4.3 Multi-Modal Input System

#### Starter Node Input Types

```typescript
interface InputCapabilities {
  text: {
    keyboard: boolean; // Rich text editor
    clipboard: boolean; // Paste support
    markdown: boolean; // Markdown formatting
  };
  audio: {
    microphone: boolean; // Live recording
    fileUpload: string[]; // Supported formats
    waveformEdit: boolean; // Basic audio editing
  };
  image: {
    fileUpload: string[]; // Supported formats
  };
  file: {
    dragDrop: boolean; // Drag and drop support
    formats: string[]; // Supported file types
    batchUpload: boolean; // Multiple file support
  };
}
```

## 5. Backend Integration Specification

### 5.1 API Endpoint Structure

```
POST /flows
Content-Type: application/json

Request Body: WorkflowTree (see serialization spec)
Response: {
  "id": number,
  "name": string,
  "createdAt": ISO date/time as string,
  "updatedAt": ISO date/time as string,
  "userId": number
}


GET /flows/{flowId}/result
Response: { result: any, executionTime: number, nodeResults: object[] }
```

### 5.2 Data Serialization Format

The frontend tree structure must be converted to the backend's expected JSON format:

```json
{
  "name": "workflow_name",
  "queueName": "processing_queue",
  "data": {
    "nodeType": "output_node",
    "properties": {...}
  },
  "opts": {
    "priority": 1,
    "timeout": 30000
  },
  "children": [
    {
      "name": "processor_name",
      "queueName": "image_queue",
      "data": {...},
      "opts": {...},
      "children": [...]
    }
  ]
}
```

### 5.3 Serialization/Deserialization System

**Reference Implementation**: See `tree_serialization.js` and `workflow_deserializer.js`

Key components:

- **WorkflowSerializer**: Converts frontend tree to backend JSON
- **WorkflowDeserializer**: Converts backend JSON to frontend tree
- **Tree Validation**: Ensures structural integrity
- **Layout Manager**: Auto-positions nodes for visual display

## 6. User Interface Design

### 6.1 Canvas Workspace

- **Infinite Canvas**: Pan, zoom, and navigate large workflows
- **Node Palette**: Searchable library of available node types
- **Property Panel**: Context-sensitive configuration interface
- **Connection System**: Visual drag-to-connect with validation
- **Grid System**: Optional snap-to-grid for precise alignment

### 6.2 Visual Design System

```css
/* Color Scheme */
:root {
  --starter-node: #4caf50; /* Green for input nodes */
  --processor-node: #2196f3; /* Blue for processing nodes */
  --output-node: #ff9800; /* Orange for output nodes */
  --connection: #666666; /* Gray for connections */
  --error-state: #f44336; /* Red for errors */
  --running-state: #ffeb3b; /* Yellow for active processing */
}
```

### 6.3 Responsive Design

- **Desktop-First**: Optimized for large screens and precise interactions
- **Tablet Support**: Touch-friendly controls and gestures
- **Mobile Considerations**: View-only mode with basic editing capabilities

## 7. Feature Specifications

### 7.1 Core Features

- **Workflow Creation**: Drag-and-drop node placement and connection
- **Multi-Modal Input**: Support for text, audio, image, and file inputs
- **Real-Time Execution**: Live workflow execution with progress tracking
- **Property Configuration**: Dynamic property panels for node customization
- **Import/Export**: JSON-based workflow sharing and persistence

### 7.2 Advanced Features

- **Template System**: Pre-built workflow templates for common use cases
- **Collaboration**: Real-time multi-user editing (future enhancement)
- **Version Control**: Workflow versioning and change tracking
- **Error Handling**: Comprehensive error reporting and recovery
- **Performance Monitoring**: Execution time tracking and optimization suggestions

### 7.3 User Experience Features

- **Undo/Redo**: Complete action history with unlimited undo
- **Auto-Save**: Automatic workflow persistence
- **Keyboard Shortcuts**: Power-user keyboard navigation
- **Context Menus**: Right-click actions for efficient workflow editing
- **Search & Filter**: Quick node finding and workflow organization

## 8. Implementation Phases

### Phase 1: Core Infrastructure (4-6 weeks)

- Basic canvas setup with React Flow
- Node rendering and positioning system
- Simple drag-and-drop functionality
- Backend API integration foundation

### Phase 2: Node System (6-8 weeks)

- Complete node type system implementation
- Property panel with dynamic forms
- Multi-modal input handling
- Tree serialization/deserialization

### Phase 3: Execution Engine (4-6 weeks)

- Workflow validation and submission
- Real-time status updates
- Error handling and recovery
- Result display and management

### Phase 4: Polish & Enhancement (4-6 weeks)

- UI/UX refinements
- Performance optimizations
- Advanced features (templates, shortcuts)
- Comprehensive testing and documentation

## 9. Performance Considerations

### 9.1 Frontend Optimizations

- **Virtual Rendering**: Only render visible nodes in large workflows
- **Debounced Updates**: Optimize property change handling
- **Lazy Loading**: On-demand loading of node type definitions
- **Memory Management**: Efficient cleanup of unused resources

### 9.2 Data Management

- **Caching Strategy**: Intelligent caching of workflow data and assets
- **Compression**: Gzip compression for large workflow files
- **Chunked Uploads**: Large file upload optimization
- **Progressive Loading**: Stream large datasets incrementally

## 10. Security & Compliance

### 10.1 Data Security

- **Input Validation**: Comprehensive validation of all user inputs
- **File Scanning**: Malware detection for uploaded files
- **XSS Prevention**: Proper sanitization of user-generated content
- **CSRF Protection**: Token-based request validation

### 10.2 Privacy Considerations

- **Data Retention**: Clear policies for temporary file storage
- **User Consent**: Explicit consent for data processing operations
- **Audit Logging**: Track all workflow operations for compliance
- **Data Export**: User rights to export their workflow data

## 11. Testing Strategy

### 11.1 Unit Testing

- **Component Testing**: Individual React component validation
- **Utility Testing**: Serialization/deserialization logic validation
- **API Integration**: Mock-based backend integration testing

### 11.2 Integration Testing

- **End-to-End**: Complete workflow creation and execution testing
- **Cross-Browser**: Compatibility testing across major browsers
- **Performance Testing**: Load testing with complex workflows

### 11.3 User Acceptance Testing

- **Usability Testing**: User interaction and experience validation
- **Accessibility Testing**: WCAG compliance verification
- **Beta Testing**: Real-world usage with target user groups

## 12. Deployment & Operations

### 12.1 Development Environment

```bash
# Local setup
npm install
npm run dev          # Start development server
npm run test         # Run test suite
npm run build        # Production build
```

### 12.2 Production Deployment

- **CI/CD Pipeline**: Automated testing and deployment
- **Environment Variables**: Secure configuration management
- **Health Monitoring**: Application performance monitoring
- **Error Tracking**: Real-time error reporting and alerting

### 12.3 Scaling Considerations

- **CDN Distribution**: Global asset delivery optimization
- **Caching Strategy**: Multi-level caching for improved performance
- **Load Balancing**: Handle concurrent user sessions
- **Database Optimization**: Efficient workflow metadata storage

## 13. Code Reference

### 13.1 Serialization System

- **Primary Implementation**: `tree_serialization.js`
  - WorkflowSerializer class
  - Tree validation algorithms
  - Backend JSON generation

### 13.2 Deserialization System

- **Primary Implementation**: `workflow_deserializer.js`
  - WorkflowDeserializer class
  - Layout management algorithms
  - Frontend tree reconstruction

### 13.3 Usage Examples

Both implementations include comprehensive examples demonstrating:

- Complete serialization/deserialization workflows
- Error handling and validation
- Layout calculation and optimization
- Integration with React components

## 14. Success Metrics

### 14.1 Technical Metrics

- **Performance**: Sub-200ms response time for workflow operations
- **Reliability**: 99.9% uptime for workflow execution
- **Scalability**: Support for workflows with 100+ nodes
- **Compatibility**: 95%+ browser compatibility score

### 14.2 User Experience Metrics

- **Usability**: Average task completion time under 5 minutes
- **Adoption**: 80%+ user retention after first workflow creation
- **Satisfaction**: 4.5+ star average user rating
- **Productivity**: 50%+ reduction in manual processing time

This specification provides a comprehensive foundation for building a robust, scalable graphical workflow application that seamlessly integrates with your existing backend processing system.
