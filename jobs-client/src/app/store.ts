import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import jobsReducer from '@/features/jobs/jobsSlice';
import schedulerReducer from '@/features/scheduler/schedulerSlice';
import webhooksReducer from '@/features/webhooks/webhooksSlice';
import apiKeysReducer from '@/features/apiKeys/apiKeysSlice';
import adminReducer from '@/features/admin/adminSlice';
import uiReducer from '@/features/ui/uiSlice';
import websocketReducer from '@/features/websocket/websocketSlice';
import dashboardReducer from '@/features/dashboard/dashboardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    jobs: jobsReducer,
    scheduler: schedulerReducer,
    webhooks: webhooksReducer,
    apiKeys: apiKeysReducer,
    admin: adminReducer,
    ui: uiReducer,
    websocket: websocketReducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['websocket/connected', 'websocket/disconnected', 'websocket/message'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.socket', 'payload.error'],
        // Ignore these paths in the state
        ignoredPaths: ['websocket.socket'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;