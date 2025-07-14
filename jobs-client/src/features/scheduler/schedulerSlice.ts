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
  queueName: string | null;
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
  queueName: null,
};

// Async thunks
export const fetchScheduledJobs = createAsyncThunk(
  'scheduler/fetchScheduledJobs',
  async (queueName: string, { getState, rejectWithValue }) => {
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
      
      const response = await api.get<any>(`/jobs/${queueName}/schedule`, { params });
      
      console.log(`API Response from /jobs/${queueName}/schedule:`, response);
      
      let scheduledJobs: ScheduledJob[] = [];
      if (Array.isArray(response)) {
        scheduledJobs = response;
      } else if (response && typeof response === 'object' && Array.isArray(response.scheduledJobs)) {
        scheduledJobs = response.scheduledJobs;
      }
      
      scheduledJobs = scheduledJobs.map(job => {
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
  async ({ queueName, schedulerId }: { queueName: string; schedulerId: string }, { rejectWithValue }) => {
    try {
      const response = await api.get<ScheduledJob>(`/jobs/${queueName}/schedule/${schedulerId}`);
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
      queueName,
      name,
      data,
      schedule,
      options,
    }: {
      queueName: string;
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
      const response = await api.post<{ schedulerId: string } | any>(`/jobs/${queueName}/schedule`, {
        name,
        data,
        schedule,
        options
      });
      
      let schedulerId: string | undefined = response?.schedulerId;
      
      if (!schedulerId) {
        throw new Error('Invalid response format from schedule creation');
      }
      
      const scheduledJob = await api.get<ScheduledJob>(`/jobs/${queueName}/schedule/${schedulerId}`);
      return scheduledJob;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create scheduled job');
    }
  }
);

export const updateScheduledJob = createAsyncThunk(
  'scheduler/updateScheduledJob',
  async (
    {
      queueName,
      id,
      name,
      data,
      schedule,
      options,
    }: {
      queueName: string;
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
      await api.delete(`/jobs/${queueName}/schedule/${id}`);
      const currentJob = await api.get<ScheduledJob>(`/jobs/${queueName}/schedule/${id}`);
      
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
      
      const response = await api.post<{ schedulerId: string } | any>(`/jobs/${queueName}/schedule`, newJobData);
      
      let schedulerId: string | undefined = response?.schedulerId

      if (!schedulerId) {
        throw new Error('Invalid response format from schedule update');
      }
      
      const updatedJob = await api.get<ScheduledJob>(`/jobs/${queueName}/schedule/${schedulerId}`);
      return updatedJob;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update scheduled job');
    }
  }
);

export const toggleScheduledJob = createAsyncThunk(
  'scheduler/toggleScheduledJob',
  async ({ queueName, id, enabled }: { queueName: string; id: string; enabled: boolean }, { rejectWithValue }) => {
    try {
      const currentJob = await api.get<ScheduledJob>(`/jobs/${queueName}/schedule/${id}`);
      await api.delete(`/jobs/${queueName}/schedule/${id}`);
      
      const newJobData = {
        ...currentJob,
        enabled
      };
      
      const response = await api.post<{ schedulerId: string } | any>(`/jobs/${queueName}/schedule`, newJobData);
      
      let schedulerId: string | undefined = response?.schedulerId;

      if (!schedulerId) {
        throw new Error('Invalid response format from schedule toggle');
      }
      
      const updatedJob = await api.get<ScheduledJob>(`/jobs/${queueName}/schedule/${schedulerId}`);
      return updatedJob;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to toggle scheduled job');
    }
  }
);

export const deleteScheduledJob = createAsyncThunk(
  'scheduler/deleteScheduledJob',
  async ({ queueName, schedulerId }: { queueName: string; schedulerId: string }, { rejectWithValue }) => {
    try {
      await api.delete(`/jobs/${queueName}/schedule/${schedulerId}`);
      return schedulerId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete scheduled job');
    }
  }
);


export const runScheduledJobNow = createAsyncThunk(
  'scheduler/runScheduledJobNow',
  async ({ queueName, schedulerId }: { queueName: string; schedulerId: string }, { rejectWithValue }) => {
    try {
      const scheduledJob = await api.get<ScheduledJob>(`/jobs/${queueName}/schedule/${schedulerId}`);
      
      const response = await api.post(`/jobs/${queueName}/submit`, {
        name: scheduledJob.name,
        data: scheduledJob.template?.data || {},
        options: scheduledJob.template?.opts || {},
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
    setQueueName: (state: SchedulerState, action: PayloadAction<string>) => {
      state.queueName = action.payload;
    },
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
  setQueueName,
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