// API base URL
import { logout } from '@/features/auth/authSlice';

// We'll use a function to get the store to avoid circular dependencies
let storeInstance: any = null;
export const setStore = (store: any) => {
  storeInstance = store;
};

const API_BASE_URL = '/api';

// Default request timeout in milliseconds
const DEFAULT_TIMEOUT = 30000;

// Error types
export type ApiError = {
  status: number;
  message: string;
  details?: any;
};

// Request options type
export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  timeout?: number;
  skipAuth?: boolean;
};

/**
 * Handles API requests with authentication, timeout, and error handling
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    params = {},
    timeout = DEFAULT_TIMEOUT,
    skipAuth = false,
  } = options;

  // Create URL with query parameters
  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  // Add query parameters if provided
  if (Object.keys(params).length > 0) {
    const queryParams = new URLSearchParams();
    
    // Add each parameter to the URLSearchParams object
    // Skip null or undefined values
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
    
    // Append the query string to the URL
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Get auth token from store if not skipping auth
  if (!skipAuth) {
    const state = storeInstance?.getState();
    const token = state?.auth?.token;
    const apiKey = state?.auth?.apiKey;

    // Add auth header if token or API key exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else if (apiKey) {
      // Send API key in the X-API-Key header
      headers['X-API-Key'] = apiKey;
    }
  }

  // Add default headers
  const requestHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  };

  // Create request options
  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
    credentials: 'include', // Include cookies for CSRF protection
  };

  // Add body if provided
  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  requestOptions.signal = controller.signal;

  try {
    // Make request
    console.log(`API Request: ${method} ${url}`);
    console.log('Request headers:', requestHeaders);
    if (method !== 'GET') {
      console.log('Request body:', body ? JSON.stringify(body, null, 2) : 'No body');
    }
    
    const response = await fetch(url, requestOptions);
    clearTimeout(timeoutId);
    
    console.log(`API Response status: ${response.status}`);
    
    // Handle 401 Unauthorized (token expired or invalid)
    if (response.status === 401) {
      console.error('401 Unauthorized response received');
      // Dispatch logout action to clear auth state
      if (storeInstance) {
        storeInstance.dispatch(logout());
      }
      throw {
        status: 401,
        message: 'Authentication failed. Please log in again.',
      } as ApiError;
    }

    // Handle 403 Forbidden (insufficient permissions)
    if (response.status === 403) {
      throw {
        status: 403,
        message: 'You do not have permission to perform this action.',
      } as ApiError;
    }

    // Parse response
    let data;
    const contentType = response.headers.get('content-type');
    console.log('Response content-type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
        console.log('Response JSON data:', JSON.stringify(data, null, 2));
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        data = await response.text();
        console.log('Response as text (JSON parse failed):', data);
      }
    } else {
      data = await response.text();
      console.log('Response text data:', data);
    }

    // Handle error responses
    if (!response.ok) {
      console.error(`Error response (${response.status}):`, data);
      throw {
        status: response.status,
        message: data.message || 'An error occurred',
        details: data.details || data,
      } as ApiError;
    }

    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    // Handle abort error (timeout)
    if (error.name === 'AbortError') {
      throw {
        status: 408,
        message: 'Request timeout',
      } as ApiError;
    }

    // Handle fetch errors
    if (error.message === 'Failed to fetch') {
      throw {
        status: 0,
        message: 'Network error. Please check your connection.',
      } as ApiError;
    }

    // Rethrow API errors
    if (error.status) {
      throw error;
    }

    // Handle other errors
    throw {
      status: 500,
      message: error.message || 'An unexpected error occurred',
      details: error,
    } as ApiError;
  }
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body: any = {}, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body: any = {}, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(endpoint: string, body: any = {}, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};