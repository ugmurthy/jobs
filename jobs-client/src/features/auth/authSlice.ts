import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  apiKey: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Debug: Log localStorage values
const tokenFromStorage = localStorage.getItem('token');
const apiKeyFromStorage = localStorage.getItem('apiKey');
console.log('Auth Slice Initialization:', {
  tokenFromStorage: tokenFromStorage ? `${tokenFromStorage.substring(0, 10)}...` : null,
  apiKeyFromStorage: apiKeyFromStorage ? 'Present' : null,
  hasToken: !!tokenFromStorage,
  hasApiKey: !!apiKeyFromStorage
});

const initialState: AuthState = {
  user: null,
  token: tokenFromStorage,
  apiKey: apiKeyFromStorage,
  isAuthenticated: !!tokenFromStorage || !!apiKeyFromStorage,
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }: { username: string; password: string }, { rejectWithValue }) => {
    try {
      console.log('Login attempt for user:', username);
      const response = await api.post<any>('/auth/login', { username, password });
      console.log('Login API response received');
      
      // Debug: Log the response data structure safely
      if (response) {
        console.log('Response data structure:', JSON.stringify(response, null, 2));
      }
      
      // Extract token from response - handle different possible response structures
      let token, user;
      
      // Check for token in different possible locations
      if (response.token) {
        // Standard structure: { token, user }
        token = response.token;
        user = response.user;
      } else if (response.data && response.data.token) {
        // Nested structure: { data: { token, user } }
        token = response.data.token;
        user = response.data.user;
      } else if (response.jwt) {
        // Alternative structure: { jwt, user }
        token = response.jwt;
        user = response.user;
      } else if (response.accessToken) {
        // Alternative structure: { accessToken, user }
        token = response.accessToken;
        user = response.user;
      }
      
      // Check if token was found
      if (!token) {
        console.error('No token found in response data');
        console.log('Full response for debugging:', response);
        return rejectWithValue('Authentication failed: No token received');
      }
      
      console.log('Token received:', token ? 'Yes (length: ' + token.length + ')' : 'No');
      console.log('User data received:', user ? 'Yes' : 'No');
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      console.log('Token stored in localStorage');
      
      return { token, user };
    } catch (error: any) {
      console.error('Login error:', error);
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    { username, email, password, webhookUrl }: { username: string; email: string; password: string; webhookUrl?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post<any>('/auth/register', { username, email, password, webhookUrl });
      console.log('Register API response received:', response);
      
      // Extract token from response - handle different possible response structures
      let token, user;
      
      // Check for token in different possible locations
      if (response.token) {
        // Standard structure: { token, user }
        token = response.token;
        user = response.user;
      } else if (response.data && response.data.token) {
        // Nested structure: { data: { token, user } }
        token = response.data.token;
        user = response.data.user;
      } else if (response.jwt) {
        // Alternative structure: { jwt, user }
        token = response.jwt;
        user = response.user;
      } else if (response.accessToken) {
        // Alternative structure: { accessToken, user }
        token = response.accessToken;
        user = response.user;
      }
      
      // Check if token was found
      if (!token) {
        console.error('No token found in register response data');
        return rejectWithValue('Registration failed: No token received');
      }
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      return { token, user };
    } catch (error: any) {
      console.error('Registration error:', error);
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('apiKey');
  return null;
});

export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<any>('/auth/me');
    console.log('Fetch current user response:', response);
    
    // Handle different response structures
    let user;
    
    if (response && typeof response === 'object') {
      if ('user' in response) {
        // { user: User }
        user = response.user;
      } else if ('data' in response && response.data && typeof response.data === 'object' && 'user' in response.data) {
        // { data: { user: User } }
        user = response.data.user;
      } else {
        // Assume response is the user object directly
        user = response;
      }
    }
    
    if (!user) {
      console.error('No user data found in response');
      return rejectWithValue('Failed to fetch user: No user data in response');
    }
    
    return user;
  } catch (error: any) {
    console.error('Error fetching current user:', error);
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
  }
});

export const setApiKey = createAsyncThunk(
  'auth/setApiKey',
  async (apiKey: string, { rejectWithValue }) => {
    try {
      // Validate API key by making a test request
      const response = await api.get<any>('/auth/validate-api-key', {
        headers: {
          'X-API-Key': apiKey,
        },
      });
      
      console.log('API key validation response:', response);
      
      // Extract user from different possible response structures
      let user;
      
      if (response.user) {
        // Standard structure: { user }
        user = response.user;
      } else if (response.data && response.data.user) {
        // Nested structure: { data: { user } }
        user = response.data.user;
      } else {
        // Try to find a user object in the response
        const keys = Object.keys(response);
        for (const key of keys) {
          if (response[key] && typeof response[key] === 'object' && 'id' in response[key]) {
            user = response[key];
            break;
          }
        }
      }
      
      if (!user) {
        console.error('No user data found in API key validation response');
        return rejectWithValue('Invalid API key: No user data in response');
      }
      
      // Store API key in localStorage
      localStorage.setItem('apiKey', apiKey);
      
      return { apiKey, user };
    } catch (error: any) {
      console.error('API key validation error:', error);
      return rejectWithValue(error.response?.data?.message || 'Invalid API key');
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<{ token: string; user: User }>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        console.log('Login fulfilled - Updated auth state:', {
          isAuthenticated: state.isAuthenticated,
          hasToken: !!state.token,
          hasUser: !!state.user,
          token: state.token ? `${state.token.substring(0, 10)}...` : null
        });
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        console.error('Login rejected - Error:', action.payload);
        console.error('Login rejected - Error type:', typeof action.payload);
        console.error('Login rejected - Action:', JSON.stringify(action, null, 2));
      })
      
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<{ token: string; user: User }>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.apiKey = null;
        state.user = null;
      })
      
      // Fetch current user
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        // If fetching user fails, clear auth state
        if (state.token) {
          state.isAuthenticated = false;
          state.token = null;
          state.user = null;
          localStorage.removeItem('token');
        }
      })
      
      // Set API key
      .addCase(setApiKey.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setApiKey.fulfilled, (state, action: PayloadAction<{ apiKey: string; user: User }>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.apiKey = action.payload.apiKey;
        state.user = action.payload.user;
      })
      .addCase(setApiKey.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = authSlice.actions;

export default authSlice.reducer;