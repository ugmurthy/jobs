import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/lib/api';

export interface JobStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  completionRate: number;
}

export interface RecentJob {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  duration?: number;
}

export interface DashboardState {
  jobStats: JobStats | null;
  recentJobs: RecentJob[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  jobStats: null,
  recentJobs: [],
  isLoading: false,
  error: null,
};

export const fetchDashboardStats = createAsyncThunk<
  { jobStats: JobStats; recentJobs: RecentJob[] },
  void,
  { rejectValue: string }
>(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<{ jobStats: JobStats; recentJobs: RecentJob[] }>('/dashboard/stats');
      return response;
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
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = dashboardSlice.actions;

export default dashboardSlice.reducer;