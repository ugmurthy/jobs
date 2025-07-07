import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';
import { WebSocketEvent } from '@/features/websocket/websocketSlice';

export interface Job {
  id: string;
  name: string;
  data: Record<string, any>;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  progress: number;
  result: any;
  error: any;
  options: {
    priority: number;
    attempts: number;
    delay: number;
  };
  processingTime: number;
  failedReason: string | null;
  stacktrace: string[] | null;
  logs: string[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  failedAt: string | null;
  userId: string;
}

export interface JobsState {
  jobs: Job[];
  selectedJob: Job | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
  filters: {
    status: string | null;
    search: string | null;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    dateRange: {
      start: string | null;
      end: string | null;
    };
  };
}

const initialState: JobsState = {
  jobs: [],
  selectedJob: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 0,
    totalItems: 0,
  },
  filters: {
    status: null,
    search: null,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    dateRange: {
      start: null,
      end: null,
    },
  },
};

// Async thunks
export const fetchJobs = createAsyncThunk<
  { jobs: Job[]; pagination: JobsState['pagination'] },
  void,
  { state: { jobs: JobsState }, rejectValue: string }
>(
  'jobs/fetchJobs',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { pagination, filters } = state.jobs;
      
      const params = {
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
        status: filters.status,
        search: filters.search,
        sortBy: filters.sortBy,
        sortDirection: filters.sortDirection,
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
      };
      
      const response = await api.get<{ total: number; jobs: Job[] }>('/jobs', { params });
      
      // Transform the response to match the expected format
      return {
        jobs: response.jobs,
        pagination: {
          ...pagination,
          totalItems: response.total,
          totalPages: Math.ceil(response.total / pagination.limit)
        }
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch jobs');
    }
  }
);

export const fetchJobById = createAsyncThunk<
  Job,
  string,
  { rejectValue: string }
>(
  'jobs/fetchJobById',
  async (jobId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<Job>(`/jobs/${jobId}`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch job');
    }
  }
);

export const createJob = createAsyncThunk<
  Job,
  { name: string; data?: Record<string, any>; options?: Record<string, any> },
  { rejectValue: string }
>(
  'jobs/createJob',
  async (
    { name, data, options }: { name: string; data?: Record<string, any>; options?: Record<string, any> },
    { rejectWithValue }
  ) => {
    try {
      // Use the /jobs/submit endpoint as per the OpenAPI spec
      const response = await api.post<{ id: string } | Job>('/jobs/submit', {
        name,
        data
      });
      
      // Check if the response has an id field directly
      if ('id' in response) {
        return response as Job;
      }
      
      // If the response doesn't have an id field directly, it might be nested
      // or we need to fetch the job details
      if (typeof response === 'object' && response !== null) {
        // Try to extract id from possible response formats
        const jobId =
          // It might be in a 'job' property
          (response as any).job?.id ||
          // Or it might be in a 'jobId' property
          (response as any).jobId ||
          // Or it might be in an 'id' property
          (response as any).id;
        
        if (jobId) {
          // Fetch the job details using the extracted id
          const jobDetails = await api.get<Job>(`/jobs/${jobId}`);
          return jobDetails;
        }
      }
      
      // If we couldn't extract an id, throw an error
      throw new Error('Invalid response format from job submission');
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create job');
    }
  }
);

export const retryJob = createAsyncThunk<
  Job,
  string,
  { rejectValue: string }
>(
  'jobs/retryJob',
  async (jobId: string, { rejectWithValue }) => {
    try {
      // Resubmit the job by getting it first and then submitting it again
      const job = await api.get<Job>(`/jobs/${jobId}`);
      const response = await api.post<Job>('/jobs/submit', {
        name: job.name,
        data: job.data
      });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to retry job');
    }
  }
);

// Note: The OpenAPI spec doesn't explicitly define a cancel endpoint
// This is a placeholder implementation that might need to be adjusted
export const cancelJob = createAsyncThunk<
  Job,
  string,
  { rejectValue: string }
>(
  'jobs/cancelJob',
  async (jobId: string, { rejectWithValue }) => {
    try {
      // This endpoint might need to be adjusted based on the actual API implementation
      const response = await api.post<Job>(`/jobs/${jobId}/cancel`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel job');
    }
  }
);

// Note: The OpenAPI spec doesn't explicitly define a delete endpoint
// This is a placeholder implementation that might need to be adjusted
export const deleteJob = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  'jobs/deleteJob',
  async (jobId: string, { rejectWithValue }) => {
    try {
      // This endpoint might need to be adjusted based on the actual API implementation
      await api.delete(`/jobs/${jobId}`);
      return jobId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete job');
    }
  }
);

export const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setPage: (state: JobsState, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state: JobsState, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1; // Reset to first page when changing limit
    },
    setStatusFilter: (state: JobsState, action: PayloadAction<string | null>) => {
      state.filters.status = action.payload;
      state.pagination.page = 1; // Reset to first page when changing filters
    },
    setSearchFilter: (state: JobsState, action: PayloadAction<string | null>) => {
      state.filters.search = action.payload;
      state.pagination.page = 1; // Reset to first page when changing filters
    },
    setSortBy: (state: JobsState, action: PayloadAction<string>) => {
      state.filters.sortBy = action.payload;
    },
    setSortDirection: (state: JobsState, action: PayloadAction<'asc' | 'desc'>) => {
      state.filters.sortDirection = action.payload;
    },
    setDateRange: (state: JobsState, action: PayloadAction<{ start: string | null; end: string | null }>) => {
      state.filters.dateRange = action.payload;
      state.pagination.page = 1; // Reset to first page when changing filters
    },
    clearFilters: (state: JobsState) => {
      state.filters = {
        status: null,
        search: null,
        sortBy: 'createdAt',
        sortDirection: 'desc',
        dateRange: {
          start: null,
          end: null,
        },
      };
      state.pagination.page = 1; // Reset to first page when clearing filters
    },
    updateJobProgress: (state: JobsState, action: PayloadAction<{ id: string; progress: number }>) => {
      const { id, progress } = action.payload;
      const job = state.jobs.find(job => job.id === id);
      if (job) {
        job.progress = progress;
      }
      if (state.selectedJob && state.selectedJob.id === id) {
        state.selectedJob.progress = progress;
      }
    },
    updateJobStatus: (state: JobsState, action: PayloadAction<{ id: string; status: Job['status']; result?: any; error?: any }>) => {
      const { id, status, result, error } = action.payload;
      const job = state.jobs.find(job => job.id === id);
      if (job) {
        job.status = status;
        if (result !== undefined) job.result = result;
        if (error !== undefined) job.error = error;
      }
      if (state.selectedJob && state.selectedJob.id === id) {
        state.selectedJob.status = status;
        if (result !== undefined) state.selectedJob.result = result;
        if (error !== undefined) state.selectedJob.error = error;
      }
    },
    clearError: (state: JobsState) => {
      state.error = null;
    },
    // Handle WebSocket events
    handleWebSocketEvent: (state: JobsState, action: PayloadAction<WebSocketEvent>) => {
      const event = action.payload;
      
      // Handle job progress updates
      if (event.type === 'job:progress' && event.payload) {
        const { jobId, progress } = event.payload;
        const job = state.jobs.find(job => job.id === jobId);
        if (job) {
          job.progress = progress;
        }
        if (state.selectedJob && state.selectedJob.id === jobId) {
          state.selectedJob.progress = progress;
        }
      }
      
      // Handle job completion
      else if (event.type === 'job:completed' && event.payload) {
        const { jobId, result } = event.payload;
        const job = state.jobs.find(job => job.id === jobId);
        if (job) {
          job.status = 'completed';
          job.result = result;
          job.completedAt = new Date().toISOString();
        }
        if (state.selectedJob && state.selectedJob.id === jobId) {
          state.selectedJob.status = 'completed';
          state.selectedJob.result = result;
          state.selectedJob.completedAt = new Date().toISOString();
        }
      }
      
      // Handle job failure
      else if (event.type === 'job:failed' && event.payload) {
        const { jobId, error } = event.payload;
        const job = state.jobs.find(job => job.id === jobId);
        if (job) {
          job.status = 'failed';
          job.error = error;
          job.failedAt = new Date().toISOString();
        }
        if (state.selectedJob && state.selectedJob.id === jobId) {
          state.selectedJob.status = 'failed';
          state.selectedJob.error = error;
          state.selectedJob.failedAt = new Date().toISOString();
        }
      }
      
      // Handle job delta updates (logs, etc.)
      else if (event.type === 'job:delta' && event.payload) {
        const { jobId, logs, ...updates } = event.payload;
        const job = state.jobs.find(job => job.id === jobId);
        if (job) {
          // Update logs if provided
          if (logs && Array.isArray(logs)) {
            job.logs = [...job.logs, ...logs];
          }
          
          // Apply other updates
          Object.assign(job, updates);
        }
        
        // Update selected job if it matches
        if (state.selectedJob && state.selectedJob.id === jobId) {
          if (logs && Array.isArray(logs)) {
            state.selectedJob.logs = [...state.selectedJob.logs, ...logs];
          }
          Object.assign(state.selectedJob, updates);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch jobs
      .addCase(fetchJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action: PayloadAction<{ jobs: Job[]; pagination: JobsState['pagination'] }>) => {
        state.isLoading = false;
        state.jobs = action.payload.jobs;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch job by ID
      .addCase(fetchJobById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobById.fulfilled, (state, action: PayloadAction<Job>) => {
        state.isLoading = false;
        state.selectedJob = action.payload;
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Create job
      .addCase(createJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createJob.fulfilled, (state, action: PayloadAction<Job>) => {
        state.isLoading = false;
        state.jobs.unshift(action.payload);
        if (state.jobs.length > state.pagination.limit) {
          state.jobs.pop();
        }
        state.pagination.totalItems += 1;
        state.pagination.totalPages = Math.ceil(state.pagination.totalItems / state.pagination.limit);
      })
      .addCase(createJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Retry job
      .addCase(retryJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(retryJob.fulfilled, (state, action: PayloadAction<Job>) => {
        state.isLoading = false;
        const index = state.jobs.findIndex(job => job.id === action.payload.id);
        if (index !== -1) {
          state.jobs[index] = action.payload;
        }
        if (state.selectedJob && state.selectedJob.id === action.payload.id) {
          state.selectedJob = action.payload;
        }
      })
      .addCase(retryJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Cancel job
      .addCase(cancelJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelJob.fulfilled, (state, action: PayloadAction<Job>) => {
        state.isLoading = false;
        const index = state.jobs.findIndex(job => job.id === action.payload.id);
        if (index !== -1) {
          state.jobs[index] = action.payload;
        }
        if (state.selectedJob && state.selectedJob.id === action.payload.id) {
          state.selectedJob = action.payload;
        }
      })
      .addCase(cancelJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete job
      .addCase(deleteJob.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteJob.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.jobs = state.jobs.filter(job => job.id !== action.payload);
        if (state.selectedJob && state.selectedJob.id === action.payload) {
          state.selectedJob = null;
        }
        state.pagination.totalItems -= 1;
        state.pagination.totalPages = Math.ceil(state.pagination.totalItems / state.pagination.limit);
      })
      .addCase(deleteJob.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setPage,
  setLimit,
  setStatusFilter,
  setSearchFilter,
  setSortBy,
  setSortDirection,
  setDateRange,
  clearFilters,
  updateJobProgress,
  updateJobStatus,
  clearError,
  handleWebSocketEvent,
} = jobsSlice.actions;

export default jobsSlice.reducer;