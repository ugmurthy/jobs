# Job Monitor Dashboard

A comprehensive HTML dashboard for monitoring and managing jobs with real-time updates via WebSockets and REST API integration.

## Features

### 🔐 Authentication
- **Login/Logout**: Secure JWT-based authentication
- **User Registration**: Create new accounts with optional email and webhook URL
- **Session Management**: Automatic token storage and refresh

### 📊 Real-time Dashboard
- **Live Job Monitoring**: Real-time updates via Socket.IO WebSockets
- **Job Statistics**: Visual stats cards showing total, completed, active, failed, delayed, paused, and waiting-children jobs
- **Job List**: Paginated list of jobs with filtering and search capabilities
- **Job Details**: Detailed view of individual jobs with progress tracking

### 🚀 Job Management
- **Job Submission**: Submit new jobs with custom data and options
- **Progress Tracking**: Real-time progress updates with visual progress bars
- **Status Monitoring**: Live status updates (active, completed, failed, waiting, delayed)
- **Job Subscription**: Subscribe to specific job updates

### 🔗 Webhook Management
- **Multiple Webhooks**: Configure multiple webhook URLs per user
- **Event-specific Webhooks**: Different webhooks for progress, completion, failure, or all events
- **Webhook CRUD**: Full create, read, update, delete operations for webhooks
- **Active/Inactive Toggle**: Enable or disable webhooks as needed

### 🎨 User Interface
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Multiple Themes**: Light, dark, cupcake, and cyberpunk themes
- **Real-time Notifications**: Toast notifications for all events
- **Keyboard Shortcuts**: Quick navigation with keyboard shortcuts
- **Auto-refresh**: Automatic job list refresh every 30 seconds

## Getting Started

### Prerequisites
1. **Backend Server**: Ensure the job monitoring server is running on `http://localhost:4000`
2. **Modern Browser**: Chrome, Firefox, Safari, or Edge with WebSocket support

### Usage

1. **Open the Dashboard**
   ```bash
   # Simply open the HTML file in your browser
   open job-monitor.html
   ```

2. **Login or Register**
   - Use existing credentials to login
   - Or create a new account with the register form
   - Optionally provide email and webhook URL during registration

3. **Monitor Jobs**
   - View real-time job statistics on the dashboard
   - Browse jobs with pagination and filtering
   - Click on jobs to view detailed information
   - Subscribe to specific jobs for real-time updates

4. **Submit Jobs**
   - Navigate to "Submit Job" section
   - Enter job name and data (JSON format)
   - Optionally provide job options
   - Submit and monitor progress in real-time

5. **Configure Webhooks**
   - Go to "Webhooks" section
   - Add webhook URLs for different event types
   - Edit or delete existing webhooks
   - Toggle webhooks active/inactive

## API Integration

The dashboard integrates with the following API endpoints:

### Authentication
- `POST /login` - User login
- `POST /register` - User registration
- `POST /logout` - User logout
- `POST /refresh-token` - Token refresh

### Job Management
- `GET /jobs` - List jobs with pagination
- `GET /jobs/:id` - Get specific job details
- `POST /submit-job` - Submit new job

### Webhook Management
- `GET /webhooks` - List user webhooks
- `POST /webhooks` - Create new webhook
- `PUT /webhooks/:id` - Update webhook
- `DELETE /webhooks/:id` - Delete webhook

## Real-time Features

### Socket.IO Events

**Client to Server:**
- `subscribe:job` - Subscribe to specific job updates
- `unsubscribe:job` - Unsubscribe from job updates

**Server to Client:**
- `job:progress` - Job progress updates
- `job:completed` - Job completion notifications
- `job:failed` - Job failure notifications
- `job:<jobId>:progress` - Specific job progress
- `job:<jobId>:completed` - Specific job completion
- `job:<jobId>:failed` - Specific job failure

### Connection Status
- Visual indicator showing WebSocket connection status
- Automatic reconnection attempts
- Fallback to REST API polling when WebSocket is unavailable

## Keyboard Shortcuts

- `Ctrl/Cmd + D` - Go to Dashboard
- `Ctrl/Cmd + J` - Go to Job Submission
- `Ctrl/Cmd + W` - Go to Webhooks
- `Ctrl/Cmd + R` - Refresh Jobs

## Themes

The dashboard supports multiple themes:
- **Light** - Clean, bright interface
- **Dark** - Dark mode for low-light environments
- **Cupcake** - Colorful, playful theme
- **Cyberpunk** - Futuristic, neon theme

Theme selection is saved in localStorage and persists across sessions.

## Browser Compatibility

- **Chrome** 80+
- **Firefox** 75+
- **Safari** 13+
- **Edge** 80+

## Features in Detail

### Job Cards
Each job is displayed as a card showing:
- Job name and ID
- Current status with color-coded badges
- Progress bar for active jobs
- Creation and completion timestamps
- Quick actions (view details, subscribe)

### Job Details Modal
Clicking on a job opens a detailed modal with:
- Complete job information
- Progress tracking
- Result data (for completed jobs)
- Error messages (for failed jobs)
- Subscription controls

### Webhook Configuration
- **URL Validation**: Ensures webhook URLs are valid
- **Event Types**: Choose from progress, completed, failed, or all events
- **Description**: Add descriptions for webhook identification
- **Status Toggle**: Enable/disable webhooks without deletion

### Notifications
- **Success**: Green notifications for successful operations
- **Error**: Red notifications for errors and failures
- **Warning**: Yellow notifications for warnings
- **Info**: Blue notifications for general information

### Auto-refresh
- Jobs list automatically refreshes every 30 seconds
- Real-time updates via WebSocket take precedence
- Manual refresh button available

## Troubleshooting

### Connection Issues
1. **WebSocket Connection Failed**
   - Check if server is running on `http://localhost:4000`
   - Verify JWT token is valid
   - Check browser console for error messages

2. **API Requests Failing**
   - Ensure server is accessible
   - Check authentication token
   - Verify CORS settings on server

3. **Jobs Not Updating**
   - Check WebSocket connection status
   - Try manual refresh
   - Verify job worker is running on server

### Performance
- **Large Job Lists**: Use pagination and filtering to improve performance
- **Memory Usage**: Browser will automatically clean up old notifications
- **Network**: WebSocket provides efficient real-time updates

## Security Considerations

- **JWT Tokens**: Stored securely in localStorage
- **HTTPS**: Use HTTPS in production environments
- **Token Expiry**: Automatic token refresh handling
- **Input Validation**: Client-side validation for better UX

## Customization

### Styling
The dashboard uses Tailwind CSS and DaisyUI. You can customize:
- Colors and themes
- Component styles
- Layout and spacing
- Animations and transitions

### Functionality
Extend the dashboard by:
- Adding new job types
- Implementing additional filters
- Creating custom notification types
- Adding more webhook event types

## Development

### Local Development
1. Ensure the backend server is running
2. Open `job-monitor.html` in a browser
3. Use browser developer tools for debugging

### Production Deployment
1. Host the HTML file on a web server
2. Update `API_BASE` constant to point to production server
3. Configure HTTPS for secure connections
4. Set up proper CORS on the backend server

This dashboard provides a complete interface for job monitoring and management with real-time capabilities and a modern, responsive design.