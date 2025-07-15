import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, any>;
  status: 'success' | 'failed';
  statusCode: number;
  response: string;
  error: string | null;
  createdAt: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  deliveries?: WebhookDelivery[];
}

export interface WebhooksState {
  webhooks: Webhook[];
  selectedWebhook: Webhook | null;
  deliveries: WebhookDelivery[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
  deliveriesPagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
  filters: {
    active: boolean | null;
    search: string | null;
    event: string | null;
  };
}

const initialState: WebhooksState = {
  webhooks: [],
  selectedWebhook: null,
  deliveries: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 0,
    totalItems: 0,
  },
  deliveriesPagination: {
    page: 1,
    limit: 10,
    totalPages: 0,
    totalItems: 0,
  },
  filters: {
    active: null,
    search: null,
    event: null,
  },
};

// Async thunks
export const fetchWebhooks = createAsyncThunk(
  'webhooks/fetchWebhooks',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { webhooks: WebhooksState };
      const { pagination, filters } = state.webhooks;
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        active: filters.active,
        search: filters.search,
        event: filters.event,
      };
      
      const response = await api.get<{ webhooks: Webhook[], pagination: WebhooksState['pagination'] }>('/webhooks', { params });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch webhooks');
    }
  }
);

export const fetchWebhookById = createAsyncThunk(
  'webhooks/fetchWebhookById',
  async (webhookId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<Webhook>(`/webhooks/${webhookId}`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch webhook');
    }
  }
);

export const fetchWebhookDeliveries = createAsyncThunk(
  'webhooks/fetchWebhookDeliveries',
  async (webhookId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { webhooks: WebhooksState };
      const { deliveriesPagination } = state.webhooks;
      
      const params = {
        page: deliveriesPagination.page,
        limit: deliveriesPagination.limit,
      };
      
      const response = await api.get<{ deliveries: WebhookDelivery[], pagination: WebhooksState['deliveriesPagination'] }>(`/webhooks/${webhookId}/deliveries`, { params });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch webhook deliveries');
    }
  }
);

export const createWebhook = createAsyncThunk(
  'webhooks/createWebhook',
  async (
    {
      url,
      events,
      active,
      description,
    }: {
      url: string;
      events: string[];
      active: boolean;
      description?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post<Webhook>('/webhooks', { url, events, active, description });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create webhook');
    }
  }
);

export const updateWebhook = createAsyncThunk(
  'webhooks/updateWebhook',
  async (
    {
      id,
      url,
      events,
      active,
      description,
    }: {
      id: string;
      url?: string;
      events?: string[];
      active?: boolean;
      description?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put<Webhook>(`/webhooks/${id}`, { url, events, active, description });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update webhook');
    }
  }
);

export const toggleWebhook = createAsyncThunk(
  'webhooks/toggleWebhook',
  async ({ id, active }: { id: string; active: boolean }, { rejectWithValue }) => {
    try {
      const response = await api.patch<Webhook>(`/webhooks/${id}/toggle`, { active });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to toggle webhook');
    }
  }
);

export const deleteWebhook = createAsyncThunk(
  'webhooks/deleteWebhook',
  async (webhookId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/webhooks/${webhookId}`);
      return webhookId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete webhook');
    }
  }
);

export const retryWebhookDelivery = createAsyncThunk(
  'webhooks/retryWebhookDelivery',
  async ({ webhookId, deliveryId }: { webhookId: string; deliveryId: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<WebhookDelivery>(`/webhooks/${webhookId}/deliveries/${deliveryId}/retry`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to retry webhook delivery');
    }
  }
);

export const webhooksSlice = createSlice({
  name: 'webhooks',
  initialState,
  reducers: {
    setPage: (state: WebhooksState, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state: WebhooksState, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1; // Reset to first page when changing limit
    },
    setDeliveriesPage: (state: WebhooksState, action: PayloadAction<number>) => {
      state.deliveriesPagination.page = action.payload;
    },
    setDeliveriesLimit: (state: WebhooksState, action: PayloadAction<number>) => {
      state.deliveriesPagination.limit = action.payload;
      state.deliveriesPagination.page = 1; // Reset to first page when changing limit
    },
    setActiveFilter: (state: WebhooksState, action: PayloadAction<boolean | null>) => {
      state.filters.active = action.payload;
      state.pagination.page = 1; // Reset to first page when changing filters
    },
    setSearchFilter: (state: WebhooksState, action: PayloadAction<string | null>) => {
      state.filters.search = action.payload;
      state.pagination.page = 1; // Reset to first page when changing filters
    },
    setEventFilter: (state: WebhooksState, action: PayloadAction<string | null>) => {
      state.filters.event = action.payload;
      state.pagination.page = 1; // Reset to first page when changing filters
    },
    clearFilters: (state: WebhooksState) => {
      state.filters = {
        active: null,
        search: null,
        event: null,
      };
      state.pagination.page = 1; // Reset to first page when clearing filters
    },
    addDelivery: (state: WebhooksState, action: PayloadAction<WebhookDelivery>) => {
      const delivery = action.payload;
      if (state.selectedWebhook && state.selectedWebhook.id === delivery.webhookId) {
        state.deliveries.unshift(delivery);
        if (state.deliveries.length > state.deliveriesPagination.limit) {
          state.deliveries.pop();
        }
        state.deliveriesPagination.totalItems += 1;
        state.deliveriesPagination.totalPages = Math.ceil(
          state.deliveriesPagination.totalItems / state.deliveriesPagination.limit
        );
      }
    },
    clearError: (state: WebhooksState) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch webhooks
      .addCase(fetchWebhooks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWebhooks.fulfilled, (state, action: PayloadAction<{ webhooks: Webhook[]; pagination: WebhooksState['pagination'] }>) => {
        state.isLoading = false;
        state.webhooks = action.payload.webhooks;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchWebhooks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch webhook by ID
      .addCase(fetchWebhookById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWebhookById.fulfilled, (state, action: PayloadAction<Webhook>) => {
        state.isLoading = false;
        state.selectedWebhook = action.payload;
      })
      .addCase(fetchWebhookById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch webhook deliveries
      .addCase(fetchWebhookDeliveries.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWebhookDeliveries.fulfilled, (state, action: PayloadAction<{ deliveries: WebhookDelivery[]; pagination: WebhooksState['deliveriesPagination'] }>) => {
        state.isLoading = false;
        state.deliveries = action.payload.deliveries;
        state.deliveriesPagination = action.payload.pagination;
      })
      .addCase(fetchWebhookDeliveries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create webhook
      .addCase(createWebhook.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createWebhook.fulfilled, (state, action: PayloadAction<Webhook>) => {
        state.isLoading = false;
        state.webhooks.unshift(action.payload);
        if (state.webhooks.length > state.pagination.limit) {
          state.webhooks.pop();
        }
        state.pagination.totalItems += 1;
        state.pagination.totalPages = Math.ceil(state.pagination.totalItems / state.pagination.limit);
      })
      .addCase(createWebhook.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update webhook
      .addCase(updateWebhook.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateWebhook.fulfilled, (state, action: PayloadAction<Webhook>) => {
        state.isLoading = false;
        const index = state.webhooks.findIndex(webhook => webhook.id === action.payload.id);
        if (index !== -1) {
          state.webhooks[index] = action.payload;
        }
        if (state.selectedWebhook && state.selectedWebhook.id === action.payload.id) {
          state.selectedWebhook = action.payload;
        }
      })
      .addCase(updateWebhook.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Toggle webhook
      .addCase(toggleWebhook.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(toggleWebhook.fulfilled, (state, action: PayloadAction<Webhook>) => {
        state.isLoading = false;
        const index = state.webhooks.findIndex(webhook => webhook.id === action.payload.id);
        if (index !== -1) {
          state.webhooks[index] = action.payload;
        }
        if (state.selectedWebhook && state.selectedWebhook.id === action.payload.id) {
          state.selectedWebhook = action.payload;
        }
      })
      .addCase(toggleWebhook.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete webhook
      .addCase(deleteWebhook.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteWebhook.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.webhooks = state.webhooks.filter(webhook => webhook.id !== action.payload);
        if (state.selectedWebhook && state.selectedWebhook.id === action.payload) {
          state.selectedWebhook = null;
        }
        state.pagination.totalItems -= 1;
        state.pagination.totalPages = Math.ceil(state.pagination.totalItems / state.pagination.limit);
      })
      .addCase(deleteWebhook.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Retry webhook delivery
      .addCase(retryWebhookDelivery.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(retryWebhookDelivery.fulfilled, (state, action: PayloadAction<WebhookDelivery>) => {
        state.isLoading = false;
        const index = state.deliveries.findIndex(delivery => delivery.id === action.payload.id);
        if (index !== -1) {
          state.deliveries[index] = action.payload;
        }
      })
      .addCase(retryWebhookDelivery.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setPage,
  setLimit,
  setDeliveriesPage,
  setDeliveriesLimit,
  setActiveFilter,
  setSearchFilter,
  setEventFilter,
  clearFilters,
  addDelivery,
  clearError,
} = webhooksSlice.actions;

export default webhooksSlice.reducer;