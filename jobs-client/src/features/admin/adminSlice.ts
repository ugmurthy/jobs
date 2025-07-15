import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';

export interface SystemStats {
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  waitingJobs: number;
  delayedJobs: number;
  totalJobs: number;
  activeWorkers: number;
  queuedEvents: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  uptime: number;
  jobsProcessed: number;
  jobsPerSecond: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  jobCount: number;
  apiKeyCount: number;
  webhookCount: number;
  lastActive: string | null;
}

export interface AdminState {
  systemStats: SystemStats | null;
  users: User[];
  selectedUser: User | null;
  isLoading: boolean;
  error: string | null;
  usersPagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
  usersFilters: {
    search: string | null;
    role: string | null;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
  };
}

const initialState: AdminState = {
  systemStats: null,
  users: [],
  selectedUser: null,
  isLoading: false,
  error: null,
  usersPagination: {
    page: 1,
    limit: 10,
    totalPages: 0,
    totalItems: 0,
  },
  usersFilters: {
    search: null,
    role: null,
    sortBy: 'createdAt',
    sortDirection: 'desc',
  },
};

// Async thunks
export const fetchSystemStats = createAsyncThunk(
  'admin/fetchSystemStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<SystemStats>('/admin/stats');
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch system stats');
    }
  }
);

export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { admin: AdminState };
      const { usersPagination, usersFilters } = state.admin;
      
      const params = {
        page: usersPagination.page,
        limit: usersPagination.limit,
        search: usersFilters.search,
        role: usersFilters.role,
        sortBy: usersFilters.sortBy,
        sortDirection: usersFilters.sortDirection,
      };
      
      const response = await api.get<{ users: User[], pagination: AdminState['usersPagination'] }>('/admin/users', { params });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch users');
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'admin/fetchUserById',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.get<User>(`/admin/users/${userId}`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user');
    }
  }
);

export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async (
    {
      id,
      username,
      email,
      role,
    }: {
      id: string;
      username?: string;
      email?: string;
      role?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put<User>(`/admin/users/${id}`, { username, email, role });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update user');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);

export const purgeJobs = createAsyncThunk(
  'admin/purgeJobs',
  async (
    { status, olderThan }: { status: string; olderThan: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post<{ message: string, purgedCount: number }>('/admin/purge-jobs', { status, olderThan });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to purge jobs');
    }
  }
);

export const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setUsersPage: (state: AdminState, action: PayloadAction<number>) => {
      state.usersPagination.page = action.payload;
    },
    setUsersLimit: (state: AdminState, action: PayloadAction<number>) => {
      state.usersPagination.limit = action.payload;
      state.usersPagination.page = 1; // Reset to first page when changing limit
    },
    setUsersSearchFilter: (state: AdminState, action: PayloadAction<string | null>) => {
      state.usersFilters.search = action.payload;
      state.usersPagination.page = 1; // Reset to first page when changing filters
    },
    setUsersRoleFilter: (state: AdminState, action: PayloadAction<string | null>) => {
      state.usersFilters.role = action.payload;
      state.usersPagination.page = 1; // Reset to first page when changing filters
    },
    setUsersSortBy: (state: AdminState, action: PayloadAction<string>) => {
      state.usersFilters.sortBy = action.payload;
    },
    setUsersSortDirection: (state: AdminState, action: PayloadAction<'asc' | 'desc'>) => {
      state.usersFilters.sortDirection = action.payload;
    },
    clearUsersFilters: (state: AdminState) => {
      state.usersFilters = {
        search: null,
        role: null,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      };
      state.usersPagination.page = 1; // Reset to first page when clearing filters
    },
    clearError: (state: AdminState) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch system stats
      .addCase(fetchSystemStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSystemStats.fulfilled, (state, action: PayloadAction<SystemStats>) => {
        state.isLoading = false;
        state.systemStats = action.payload;
      })
      .addCase(fetchSystemStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<{ users: User[]; pagination: AdminState['usersPagination'] }>) => {
        state.isLoading = false;
        state.users = action.payload.users;
        state.usersPagination = action.payload.pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch user by ID
      .addCase(fetchUserById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.selectedUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.selectedUser && state.selectedUser.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        state.users = state.users.filter(user => user.id !== action.payload);
        if (state.selectedUser && state.selectedUser.id === action.payload) {
          state.selectedUser = null;
        }
        state.usersPagination.totalItems -= 1;
        state.usersPagination.totalPages = Math.ceil(state.usersPagination.totalItems / state.usersPagination.limit);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Purge jobs
      .addCase(purgeJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(purgeJobs.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(purgeJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setUsersPage,
  setUsersLimit,
  setUsersSearchFilter,
  setUsersRoleFilter,
  setUsersSortBy,
  setUsersSortDirection,
  clearUsersFilters,
  clearError,
} = adminSlice.actions;

export default adminSlice.reducer;