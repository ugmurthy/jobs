import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api';

export interface JobStats {
  total: number;
  active: number;
  delayed: number;
  completed: number;
  failed: number;
  paused: number;
  'waiting-children': number;
  completionRate: number;
}

export interface RecentJob {
  id: string;
  name: string;
  status: 'active' | 'delayed' | 'completed' | 'failed' | 'paused' | 'waiting-children' | 'waiting';
  createdAt: string;
  completedAt?: string;
  duration?: number;
}

export interface QueueStats {
  name: string;
  total: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  'waiting-children': number;
}

export interface SchedulerStats {
    activeSchedules: number;
    totalSchedules: number;
    nextScheduledJob: string;
}

export interface WebhookStats {
    totalWebhooks: number;
    activeWebhooks: number;
    deliveryRate: number;
    totalDeliveries: number;
    failedDeliveries: number;
}


export interface DashboardState {
  jobStats: JobStats | null;
  recentJobs: RecentJob[];
  queueStats: QueueStats[];
  schedulerStats: SchedulerStats | null;
  webhookStats: WebhookStats | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  jobStats: null,
  recentJobs: [],
  queueStats: [],
  schedulerStats: null,
  webhookStats: null,
  isLoading: false,
  error: null,
};

export const fetchDashboardStats = createAsyncThunk<
  {
    jobStats: JobStats;
    recentJobs: RecentJob[];
    queueStats: QueueStats[];
    schedulerStats: SchedulerStats;
    webhookStats: WebhookStats;
  },
  void,
  { rejectValue: string }
>(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<DashboardState>('/dashboard/stats');
      return response as {
        jobStats: JobStats;
        recentJobs: RecentJob[];
        queueStats: QueueStats[];
        schedulerStats: SchedulerStats;
        webhookStats: WebhookStats;
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard statistics');
    }
  }
);

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobStats = action.payload.jobStats;
        state.recentJobs = action.payload.recentJobs;
        state.queueStats = action.payload.queueStats;
        state.schedulerStats = action.payload.schedulerStats;
        state.webhookStats = action.payload.webhookStats;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = dashboardSlice.actions;

export default dashboardSlice.reducer;