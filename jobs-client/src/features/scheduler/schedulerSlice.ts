import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';

export interface ScheduledJob {
  key: string;
  name: string;
  next: number;
  iterationCount: number;
  limit?: number;
  endDate?: number;
  tz?: string;
  pattern?: string;
  every?: string;
  template?: {
    data: Record<string, any>;
    opts?: {
      removeOnFail?: { count: number };
      removeOnComplete?: { count: number };
    };
  };
}

export interface SchedulerState {
  scheduledJobs: ScheduledJob[];
  selectedScheduledJob: ScheduledJob | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
  filters: {
    enabled: boolean | null;
    search: string | null;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
  };
}

const initialState: SchedulerState = {
  scheduledJobs: [],
  selectedScheduledJob: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 0,
    totalItems: 0,
  },
  filters: {
    enabled: null,
    search: null,
    sortBy: 'createdAt',
    sortDirection: 'desc',
  },
};

// Async thunks
export const fetchScheduledJobs = createAsyncThunk(
  'scheduler/fetchScheduledJobs',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { scheduler: SchedulerState };
      const { pagination, filters } = state.scheduler;
      
      const params = {
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
        search: filters.search,
        sortBy: filters.sortBy,
        sortDirection: filters.sortDirection,
      };
      
      // Use the /jobs/schedule endpoint as per the OpenAPI spec
      const response = await api.get<any>('/jobs/schedule', { params });
      
      // Log the response to see its structure
      console.log('API Response from /jobs/schedule:', response);
      
      // Check if response has the expected structure
      let scheduledJobs: ScheduledJob[] = [];
      
      if (Array.isArray(response)) {
        // If response is an array, use it directly
        scheduledJobs = response;
      } else if (response && typeof response === 'object') {
        // If response is an object, try to find the jobs array
        if (Array.isArray(response.scheduledJobs)) {
          scheduledJobs = response.scheduledJobs;
        } else if (Array.isArray(response.jobs)) {
          scheduledJobs = response.jobs;
        } else if (Array.isArray(response.data)) {
          scheduledJobs = response.data;
        } else if (Array.isArray(response.items)) {
          scheduledJobs = response.items;
        }
      }
      
      // Ensure each job has the required properties based on the new structure
      scheduledJobs = scheduledJobs.map(job => {
        // Use type assertion to handle both old and new API formats
        const oldJob = job as any;
        
        return {
          key: job.key || oldJob.id || '',
          name: job.name || '',
          next: job.next || oldJob.nextRun || 0,
          iterationCount: job.iterationCount || 0,
          limit: job.limit,
          endDate: job.endDate || (oldJob.schedule?.endDate ? new Date(oldJob.schedule.endDate).getTime() : undefined),
          tz: job.tz || oldJob.schedule?.tz,
          pattern: job.pattern || oldJob.schedule?.cron,
          every: job.every || (oldJob.schedule?.repeat?.every ? oldJob.schedule.repeat.every.toString() : undefined),
          template: {
            data: job.template?.data || oldJob.data || {},
            opts: job.template?.opts || {
              removeOnFail: oldJob.options?.removeOnFail,
              removeOnComplete: oldJob.options?.removeOnComplete
            }
          }
        };
      });
      
      console.log('Processed scheduledJobs:', scheduledJobs);
      
      // Transform the response to match the expected format
      return {
        scheduledJobs,
        pagination: {
          ...pagination,
          totalItems: scheduledJobs.length,
          totalPages: Math.ceil(scheduledJobs.length / pagination.limit)
        }
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch scheduled jobs');
    }
  }
);

export const fetchScheduledJobById = createAsyncThunk(
  'scheduler/fetchScheduledJobById',
  async (schedulerId: string, { rejectWithValue }) => {
    try {
      // Use the /jobs/schedule/{schedulerId} endpoint as per the OpenAPI spec
      const response = await api.get<ScheduledJob>(`/jobs/schedule/${schedulerId}`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch scheduled job');
    }
  }
);

export const createScheduledJob = createAsyncThunk(
  'scheduler/createScheduledJob',
  async (
    {
      name,
      data,
      schedule,
      options,
    }: {
      name: string;
      data?: Record<string, any>;
      schedule: {
        cron?: string;
        repeat?: {
          every: number;
          limit?: number;
        };
        startDate?: string;
        endDate?: string;
        tz?: string;
      };
      options?: {
        removeOnComplete?: { count: number };
        removeOnFail?: { count: number };
      };
    },
    { rejectWithValue }
  ) => {
    try {
      // Use the /jobs/schedule endpoint as per the OpenAPI spec
      const response = await api.post<{ schedulerId: string } | any>('/jobs/schedule', {
        name,
        data,
        schedule,
        options
      });
      
      // Extract the schedulerId from the response
      let schedulerId: string | undefined;
      
      if (typeof response === 'object' && response !== null) {
        // Try different possible response formats
        schedulerId =
          // It might be directly in schedulerId property
          (response as any).schedulerId ||
          // Or it might be in a 'job' or 'schedule' property
          (response as any).job?.id ||
          (response as any).schedule?.id ||
          // Or it might be in an 'id' property
          (response as any).id;
      }
      
      if (!schedulerId) {
        throw new Error('Invalid response format from schedule creation');
      }
      
      // After creating the scheduled job, fetch its details
      const scheduledJob = await api.get<ScheduledJob>(`/jobs/schedule/${schedulerId}`);
      return scheduledJob;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create scheduled job');
    }
  }
);

// Note: The OpenAPI spec doesn't explicitly define an update endpoint for scheduled jobs
// This is a placeholder implementation that might need to be adjusted
export const updateScheduledJob = createAsyncThunk(
  'scheduler/updateScheduledJob',
  async (
    {
      id,
      name,
      data,
      schedule,
      options,
    }: {
      id: string;
      name?: string;
      data?: Record<string, any>;
      schedule?: {
        cron?: string;
        repeat?: {
          every: number;
          limit?: number;
        };
        startDate?: string;
        endDate?: string;
        tz?: string;
      };
      options?: {
        removeOnComplete?: { count: number };
        removeOnFail?: { count: number };
      };
    },
    { rejectWithValue }
  ) => {
    try {
      // Since there's no explicit update endpoint in the OpenAPI spec,
      // we'll delete the existing scheduled job and create a new one
      
      // First, get the current job details
      const currentJob = await api.get<ScheduledJob>(`/jobs/schedule/${id}`);
      
      // Delete the existing job
      await api.delete(`/jobs/schedule/${id}`);
      
      // Create a new job with updated details
      // Use type assertion to access properties from the old structure
      const oldJob = currentJob as any;
      const newJobData = {
        name: name || currentJob.name,
        data: data || oldJob.data || (currentJob.template?.data || {}),
        schedule: schedule || {
          cron: currentJob.pattern,
          endDate: currentJob.endDate ? new Date(currentJob.endDate).toISOString() : undefined,
          tz: currentJob.tz
        },
        options: options || (oldJob.options || currentJob.template?.opts || {})
      };
      
      const response = await api.post<{ schedulerId: string } | any>('/jobs/schedule', newJobData);
      
      // Extract the schedulerId from the response
      let schedulerId: string | undefined;
      
      if (typeof response === 'object' && response !== null) {
        // Try different possible response formats
        schedulerId =
          // It might be directly in schedulerId property
          (response as any).schedulerId ||
          // Or it might be in a 'job' or 'schedule' property
          (response as any).job?.id ||
          (response as any).schedule?.id ||
          // Or it might be in an 'id' property
          (response as any).id;
      }
      
      if (!schedulerId) {
        throw new Error('Invalid response format from schedule update');
      }
      
      // Get the details of the newly created job
      const updatedJob = await api.get<ScheduledJob>(`/jobs/schedule/${schedulerId}`);
      return updatedJob;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update scheduled job');
    }
  }
);

// Note: The OpenAPI spec doesn't explicitly define a toggle endpoint for scheduled jobs
// This is a placeholder implementation that might need to be adjusted
export const toggleScheduledJob = createAsyncThunk(
  'scheduler/toggleScheduledJob',
  async ({ id, enabled }: { id: string; enabled: boolean }, { rejectWithValue }) => {
    try {
      // Since there's no explicit toggle endpoint in the OpenAPI spec,
      // we'll use the update approach (delete and recreate)
      
      // First, get the current job details
      const currentJob = await api.get<ScheduledJob>(`/jobs/schedule/${id}`);
      
      // Delete the existing job
      await api.delete(`/jobs/schedule/${id}`);
      
      // Create a new job with updated enabled status
      // Note: The OpenAPI spec doesn't explicitly mention an 'enabled' field,
      // so we might need to adjust this based on the actual implementation
      const newJobData = {
        ...currentJob,
        enabled
      };
      
      const response = await api.post<{ schedulerId: string } | any>('/jobs/schedule', newJobData);
      
      // Extract the schedulerId from the response
      let schedulerId: string | undefined;
      
      if (typeof response === 'object' && response !== null) {
        // Try different possible response formats
        schedulerId =
          // It might be directly in schedulerId property
          (response as any).schedulerId ||
          // Or it might be in a 'job' or 'schedule' property
          (response as any).job?.id ||
          (response as any).schedule?.id ||
          // Or it might be in an 'id' property
          (response as any).id;
      }
      
      if (!schedulerId) {
        throw new Error('Invalid response format from schedule toggle');
      }
      
      // Get the details of the newly created job
      const updatedJob = await api.get<ScheduledJob>(`/jobs/schedule/${schedulerId}`);
      return updatedJob;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to toggle scheduled job');
    }
  }
);

export const deleteScheduledJob = createAsyncThunk(
  'scheduler/deleteScheduledJob',
  async (schedulerId: string, { rejectWithValue }) => {
    try {
      // Use the /jobs/schedule/{schedulerId} DELETE endpoint as per the OpenAPI spec
      await api.delete(`/jobs/schedule/${schedulerId}`);
      return schedulerId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete scheduled job');
    }
  }
);

// Note: The OpenAPI spec doesn't explicitly define a run-now endpoint for scheduled jobs
// This is a placeholder implementation that might need to be adjusted
export const runScheduledJobNow = createAsyncThunk(
  'scheduler/runScheduledJobNow',
  async (schedulerId: string, { rejectWithValue }) => {
    try {
      // Since there's no explicit run-now endpoint in the OpenAPI spec,
      // we'll get the scheduled job details and submit it as a regular job
      
      // First, get the scheduled job details
      const scheduledJob = await api.get<ScheduledJob>(`/jobs/schedule/${schedulerId}`);
      
      // Submit it as a regular job
      // Use type assertion to access data from template
      const response = await api.post('/jobs/submit', {
        name: scheduledJob.name,
        data: scheduledJob.template?.data || {}
      });
      
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to run scheduled job');
    }
  }
);

export const schedulerSlice = createSlice({
  name: 'scheduler',
  initialState,
  reducers: {
    setPage: (state: SchedulerState, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state: SchedulerState, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1; // Reset to first page when changing limit
    },
    setEnabledFilter: (state: SchedulerState, action: PayloadAction<boolean | null>) => {
      state.filters.enabled = action.payload;
      state.pagination.page = 1; // Reset to first page when changing filters
    },
    setSearchFilter: (state: SchedulerState, action: PayloadAction<string | null>) => {
      state.filters.search = action.payload;
      state.pagination.page = 1; // Reset to first page when changing filters
    },
    setSortBy: (state: SchedulerState, action: PayloadAction<string>) => {
      state.filters.sortBy = action.payload;
    },
    setSortDirection: (state: SchedulerState, action: PayloadAction<'asc' | 'desc'>) => {
      state.filters.sortDirection = action.payload;
    },
    clearFilters: (state: SchedulerState) => {
      state.filters = {
        enabled: null,
        search: null,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      };
      state.pagination.page = 1; // Reset to first page when clearing filters
    },
    updateNextRun: (state: SchedulerState, action: PayloadAction<{ id: string; next: number }>) => {
      const { id, next } = action.payload;
      const job = state.scheduledJobs.find(job => job.key === id);
      if (job) {
        job.next = next;
      }
      if (state.selectedScheduledJob && state.selectedScheduledJob.key === id) {
        state.selectedScheduledJob.next = next;
      }
    },
    // Remove updateLastRun since lastRun is no longer in the ScheduledJob interface
    clearError: (state: SchedulerState) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch scheduled jobs
      .addCase(fetchScheduledJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchScheduledJobs.fulfilled, (state, action: PayloadAction<{ scheduledJobs: ScheduledJob[]; pagination: SchedulerState['pagination'] }>) => {
        state.isLoading = false;
        state.scheduledJobs = action.payload.scheduledJobs;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchScheduledJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch scheduled job by ID
      .addCase(fetchScheduledJobById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchScheduledJobById.fulfilled, (state, action: PayloadAction<ScheduledJob>) => {
        state.isLoading = false;
        state.selectedScheduledJob = action.payload;
      })
      .addCase(fetchScheduledJobById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create scheduled job
      .addCase(createScheduledJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createScheduledJob.fulfilled, (state, action: PayloadAction<ScheduledJob>) => {
        state.isLoading = false;
        state.scheduledJobs.unshift(action.payload);
        if (state.scheduledJobs.length > state.pagination.limit) {
          state.scheduledJobs.pop();
        }
        state.pagination.totalItems += 1;
        state.pagination.totalPages = Math.ceil(state.pagination.totalItems / state.pagination.limit);
      })
      .addCase(createScheduledJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update scheduled job
      .addCase(updateScheduledJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateScheduledJob.fulfilled, (state, action: PayloadAction<ScheduledJob>) => {
        state.isLoading = false;
        const index = state.scheduledJobs.findIndex(job => job.key === action.payload.key);
        if (index !== -1) {
          state.scheduledJobs[index] = action.payload;
        }
        if (state.selectedScheduledJob && state.selectedScheduledJob.key === action.payload.key) {
          state.selectedScheduledJob = action.payload;
        }
      })
      .addCase(updateScheduledJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Toggle scheduled job
      .addCase(toggleScheduledJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(toggleScheduledJob.fulfilled, (state, action: PayloadAction<ScheduledJob>) => {
        state.isLoading = false;
        const index = state.scheduledJobs.findIndex(job => job.key === action.payload.key);
        if (index !== -1) {
          state.scheduledJobs[index] = action.payload;
        }
        if (state.selectedScheduledJob && state.selectedScheduledJob.key === action.payload.key) {
          state.selectedScheduledJob = action.payload;
        }
      })
      .addCase(toggleScheduledJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete scheduled job
      .addCase(deleteScheduledJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteScheduledJob.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.scheduledJobs = state.scheduledJobs.filter(job => job.key !== action.payload);
        if (state.selectedScheduledJob && state.selectedScheduledJob.key === action.payload) {
          state.selectedScheduledJob = null;
        }
        state.pagination.totalItems -= 1;
        state.pagination.totalPages = Math.ceil(state.pagination.totalItems / state.pagination.limit);
      })
      .addCase(deleteScheduledJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Run scheduled job now
      .addCase(runScheduledJobNow.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(runScheduledJobNow.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(runScheduledJobNow.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setPage,
  setLimit,
  setEnabledFilter,
  setSearchFilter,
  setSortBy,
  setSortDirection,
  clearFilters,
  updateNextRun,
  clearError,
} = schedulerSlice.actions;

export default schedulerSlice.reducer;