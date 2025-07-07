import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';

export interface ApiKey {
  id: string;
  name: string;
  key: string; // Only included when first created
  prefix: string;
  permissions: string[];
  lastUsed: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface ApiKeysState {
  apiKeys: ApiKey[];
  selectedApiKey: ApiKey | null;
  newApiKey: ApiKey | null; // Holds the newly created API key with the full key value
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
  filters: {
    search: string | null;
    expired: boolean | null;
  };
}

const initialState: ApiKeysState = {
  apiKeys: [],
  selectedApiKey: null,
  newApiKey: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 0,
    totalItems: 0,
  },
  filters: {
    search: null,
    expired: null,
  },
};

// Async thunks
export const fetchApiKeys = createAsyncThunk(
  'apiKeys/fetchApiKeys',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { apiKeys: ApiKeysState };
      const { pagination, filters } = state.apiKeys;
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        expired: filters.expired,
      };
      
      const response = await api.get('/api-keys', { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch API keys');
    }
  }
);

export const fetchApiKeyById = createAsyncThunk(
  'apiKeys/fetchApiKeyById',
  async (apiKeyId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api-keys/${apiKeyId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch API key');
    }
  }
);

export const createApiKey = createAsyncThunk(
  'apiKeys/createApiKey',
  async (
    {
      name,
      permissions,
      expiresAt,
    }: {
      name: string;
      permissions: string[];
      expiresAt?: string | null;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post('/api-keys', { name, permissions, expiresAt });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create API key');
    }
  }
);

export const updateApiKey = createAsyncThunk(
  'apiKeys/updateApiKey',
  async (
    {
      id,
      name,
      permissions,
      expiresAt,
    }: {
      id: string;
      name?: string;
      permissions?: string[];
      expiresAt?: string | null;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(`/api-keys/${id}`, { name, permissions, expiresAt });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update API key');
    }
  }
);

export const deleteApiKey = createAsyncThunk(
  'apiKeys/deleteApiKey',
  async (apiKeyId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/api-keys/${apiKeyId}`);
      return apiKeyId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete API key');
    }
  }
);

export const apiKeysSlice = createSlice({
  name: 'apiKeys',
  initialState,
  reducers: {
    setPage: (state: ApiKeysState, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state: ApiKeysState, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1; // Reset to first page when changing limit
    },
    setSearchFilter: (state: ApiKeysState, action: PayloadAction<string | null>) => {
      state.filters.search = action.payload;
      state.pagination.page = 1; // Reset to first page when changing filters
    },
    setExpiredFilter: (state: ApiKeysState, action: PayloadAction<boolean | null>) => {
      state.filters.expired = action.payload;
      state.pagination.page = 1; // Reset to first page when changing filters
    },
    clearFilters: (state: ApiKeysState) => {
      state.filters = {
        search: null,
        expired: null,
      };
      state.pagination.page = 1; // Reset to first page when clearing filters
    },
    clearNewApiKey: (state: ApiKeysState) => {
      state.newApiKey = null;
    },
    clearError: (state: ApiKeysState) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch API keys
      .addCase(fetchApiKeys.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchApiKeys.fulfilled, (state, action: PayloadAction<{ apiKeys: ApiKey[]; pagination: ApiKeysState['pagination'] }>) => {
        state.isLoading = false;
        state.apiKeys = action.payload.apiKeys;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchApiKeys.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch API key by ID
      .addCase(fetchApiKeyById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchApiKeyById.fulfilled, (state, action: PayloadAction<ApiKey>) => {
        state.isLoading = false;
        state.selectedApiKey = action.payload;
      })
      .addCase(fetchApiKeyById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create API key
      .addCase(createApiKey.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.newApiKey = null;
      })
      .addCase(createApiKey.fulfilled, (state, action: PayloadAction<ApiKey>) => {
        state.isLoading = false;
        // Store the newly created API key with the full key value
        state.newApiKey = action.payload;
        // Add to the list without the full key
        const apiKeyForList = { ...action.payload };
        delete apiKeyForList.key;
        state.apiKeys.unshift(apiKeyForList);
        if (state.apiKeys.length > state.pagination.limit) {
          state.apiKeys.pop();
        }
        state.pagination.totalItems += 1;
        state.pagination.totalPages = Math.ceil(state.pagination.totalItems / state.pagination.limit);
      })
      .addCase(createApiKey.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update API key
      .addCase(updateApiKey.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateApiKey.fulfilled, (state, action: PayloadAction<ApiKey>) => {
        state.isLoading = false;
        const index = state.apiKeys.findIndex(apiKey => apiKey.id === action.payload.id);
        if (index !== -1) {
          state.apiKeys[index] = action.payload;
        }
        if (state.selectedApiKey && state.selectedApiKey.id === action.payload.id) {
          state.selectedApiKey = action.payload;
        }
      })
      .addCase(updateApiKey.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete API key
      .addCase(deleteApiKey.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteApiKey.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.apiKeys = state.apiKeys.filter(apiKey => apiKey.id !== action.payload);
        if (state.selectedApiKey && state.selectedApiKey.id === action.payload) {
          state.selectedApiKey = null;
        }
        state.pagination.totalItems -= 1;
        state.pagination.totalPages = Math.ceil(state.pagination.totalItems / state.pagination.limit);
      })
      .addCase(deleteApiKey.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setPage,
  setLimit,
  setSearchFilter,
  setExpiredFilter,
  clearFilters,
  clearNewApiKey,
  clearError,
} = apiKeysSlice.actions;

export default apiKeysSlice.reducer;