/**
 * Application-wide constants
 */

// Authentication
export const AUTH_TOKEN_KEY = 'token';
export const API_KEY_KEY = 'apiKey';
export const AUTH_EXPIRY_KEY = 'authExpiry';
export const REFRESH_TOKEN_KEY = 'refreshToken';

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

// Job statuses
export const JOB_STATUS = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DELAYED: 'delayed',
};

// Job status colors
export const JOB_STATUS_COLORS = {
  waiting: 'bg-blue-100 text-blue-800',
  active: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  delayed: 'bg-purple-100 text-purple-800',
};

// Job status icons
export const JOB_STATUS_ICONS = {
  waiting: 'clock',
  active: 'loader-2',
  completed: 'check-circle',
  failed: 'x-circle',
  delayed: 'hourglass',
};

// Webhook events
export const WEBHOOK_EVENTS = [
  { id: 'job:created', label: 'Job Created' },
  { id: 'job:started', label: 'Job Started' },
  { id: 'job:completed', label: 'Job Completed' },
  { id: 'job:failed', label: 'Job Failed' },
  { id: 'job:progress', label: 'Job Progress' },
  { id: 'job:delayed', label: 'Job Delayed' },
  { id: 'job:removed', label: 'Job Removed' },
  { id: 'scheduler:job-scheduled', label: 'Job Scheduled' },
  { id: 'scheduler:job-executed', label: 'Scheduled Job Executed' },
  { id: 'system:error', label: 'System Error' },
];

// API key permissions
export const API_KEY_PERMISSIONS = [
  { id: 'jobs:read', label: 'Read Jobs' },
  { id: 'jobs:write', label: 'Create/Update Jobs' },
  { id: 'jobs:delete', label: 'Delete Jobs' },
  { id: 'scheduler:read', label: 'Read Scheduled Jobs' },
  { id: 'scheduler:write', label: 'Create/Update Scheduled Jobs' },
  { id: 'scheduler:delete', label: 'Delete Scheduled Jobs' },
  { id: 'webhooks:read', label: 'Read Webhooks' },
  { id: 'webhooks:write', label: 'Create/Update Webhooks' },
  { id: 'webhooks:delete', label: 'Delete Webhooks' },
];

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

// Date formats
export const DATE_FORMAT = 'MMM dd, yyyy';
export const TIME_FORMAT = 'HH:mm:ss';
export const DATE_TIME_FORMAT = 'MMM dd, yyyy HH:mm:ss';

// Theme
export const THEME_KEY = 'theme';
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// Sidebar
export const SIDEBAR_OPEN_KEY = 'sidebarOpen';

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  DASHBOARD: '/dashboard',
  JOBS: '/jobs',
  JOB_DETAILS: '/jobs/:id',
  CREATE_JOB: '/jobs/create',
  SCHEDULER: '/scheduler',
  SCHEDULED_JOB_DETAILS: '/scheduler/:id',
  CREATE_SCHEDULED_JOB: '/scheduler/create',
  WEBHOOKS: '/webhooks',
  WEBHOOK_DETAILS: '/webhooks/:id',
  CREATE_WEBHOOK: '/webhooks/create',
  API_KEYS: '/api-keys',
  API_KEY_DETAILS: '/api-keys/:id',
  CREATE_API_KEY: '/api-keys/create',
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_DETAILS: '/admin/users/:id',
  ADMIN_SYSTEM: '/admin/system',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  NOT_FOUND: '/404',
};

// Navigation
export const NAV_ITEMS = [
  {
    title: 'Dashboard',
    href: ROUTES.DASHBOARD,
    icon: 'layout-dashboard',
    roles: [USER_ROLES.ADMIN, USER_ROLES.USER],
  },
  {
    title: 'Jobs',
    href: ROUTES.JOBS,
    icon: 'briefcase',
    roles: [USER_ROLES.ADMIN, USER_ROLES.USER],
  },
  {
    title: 'Scheduler',
    href: ROUTES.SCHEDULER,
    icon: 'calendar',
    roles: [USER_ROLES.ADMIN, USER_ROLES.USER],
  },
  {
    title: 'Webhooks',
    href: ROUTES.WEBHOOKS,
    icon: 'webhook',
    roles: [USER_ROLES.ADMIN, USER_ROLES.USER],
  },
  {
    title: 'API Keys',
    href: ROUTES.API_KEYS,
    icon: 'key',
    roles: [USER_ROLES.ADMIN, USER_ROLES.USER],
  },
  {
    title: 'Admin',
    href: ROUTES.ADMIN,
    icon: 'shield',
    roles: [USER_ROLES.ADMIN],
  },
  {
    title: 'Settings',
    href: ROUTES.SETTINGS,
    icon: 'settings',
    roles: [USER_ROLES.ADMIN, USER_ROLES.USER],
  },
];

// Toast durations
export const TOAST_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000,
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: AUTH_TOKEN_KEY,
  API_KEY: API_KEY_KEY,
  AUTH_EXPIRY: AUTH_EXPIRY_KEY,
  REFRESH_TOKEN: REFRESH_TOKEN_KEY,
  THEME: THEME_KEY,
  SIDEBAR_OPEN: SIDEBAR_OPEN_KEY,
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    VALIDATE_API_KEY: '/auth/validate-api-key',
  },
  JOBS: {
    BASE: '/jobs',
    DETAILS: (id: string) => `/jobs/${id}`,
    RETRY: (id: string) => `/jobs/${id}/retry`,
    CANCEL: (id: string) => `/jobs/${id}/cancel`,
  },
  SCHEDULER: {
    BASE: '/scheduler',
    DETAILS: (id: string) => `/scheduler/${id}`,
    TOGGLE: (id: string) => `/scheduler/${id}/toggle`,
    RUN_NOW: (id: string) => `/scheduler/${id}/run-now`,
  },
  WEBHOOKS: {
    BASE: '/webhooks',
    DETAILS: (id: string) => `/webhooks/${id}`,
    TOGGLE: (id: string) => `/webhooks/${id}/toggle`,
    DELIVERIES: (id: string) => `/webhooks/${id}/deliveries`,
    RETRY_DELIVERY: (webhookId: string, deliveryId: string) => `/webhooks/${webhookId}/deliveries/${deliveryId}/retry`,
  },
  API_KEYS: {
    BASE: '/api-keys',
    DETAILS: (id: string) => `/api-keys/${id}`,
  },
  ADMIN: {
    STATS: '/admin/stats',
    USERS: '/admin/users',
    USER_DETAILS: (id: string) => `/admin/users/${id}`,
    PURGE_JOBS: '/admin/purge-jobs',
  },
};

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'An error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER: 'Server error. Please try again later.',
  TIMEOUT: 'Request timed out. Please try again.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Successfully logged in.',
  LOGOUT: 'Successfully logged out.',
  REGISTER: 'Registration successful. Welcome!',
  CREATE: 'Successfully created.',
  UPDATE: 'Successfully updated.',
  DELETE: 'Successfully deleted.',
  SAVE: 'Successfully saved.',
};

// Form validation
export const VALIDATION = {
  USERNAME_MIN_LENGTH: 3,
  PASSWORD_MIN_LENGTH: 8,
  API_KEY_NAME_MIN_LENGTH: 3,
};

// WebSocket events
export const WEBSOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  JOB_PROGRESS: 'job:progress',
  JOB_COMPLETED: 'job:completed',
  JOB_FAILED: 'job:failed',
  JOB_DELTA: 'job:delta',
  SYSTEM_EVENT: 'system:event',
  WEBHOOK_DELIVERED: 'webhook:delivered',
  WEBHOOK_FAILED: 'webhook:failed',
  SUBSCRIBE_JOB: 'subscribe:job',
  UNSUBSCRIBE_JOB: 'unsubscribe:job',
  REQUEST_JOB_STATUS: 'request:job-status',
};