import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useAppDispatch } from '@/app/hooks';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { WebSocketProvider } from '@/features/websocket/WebSocketProvider';

// Layouts
import { MainLayout, AuthLayout, DashboardLayout } from '@/layouts';

// Pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ApiKeyLoginPage from '@/pages/auth/ApiKeyLoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import JobsPage from '@/pages/jobs/JobsPage';
import NewJobPage from '@/pages/jobs/NewJobPage';
import EditJobPage from '@/pages/jobs/EditJobPage';
import JobDetailPage from '@/pages/jobs/JobDetailPage';
import SchedulerPage from '@/pages/scheduler/SchedulerPage';
import NewSchedulePage from '@/pages/scheduler/NewSchedulePage';
import EditSchedulePage from '@/pages/scheduler/EditSchedulePage';
import WebhooksPage from '@/pages/webhooks/WebhooksPage';
import NewWebhookPage from '@/pages/webhooks/NewWebhookPage';
import ApiKeysPage from '@/pages/api-keys/ApiKeysPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import WebSocketEventsPage from '@/pages/websocket/WebSocketEventsPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Protected route component
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize app, check for stored auth tokens, etc.
  }, [dispatch]);

  return (
    <AuthProvider>
      <WebSocketProvider>
        <Routes>
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/api-key" element={<ApiKeyLoginPage />} />
          </Route>

          {/* Main app routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/queues/:queueName" element={<JobsPage />} />
                <Route path="/queues/:queueName/new" element={<NewJobPage />} />
                <Route path="/queues/:queueName/edit/:jobId" element={<EditJobPage />} />
                <Route path="/queues/:queueName/:jobId" element={<JobDetailPage />} />
                <Route path="/:queueName/scheduler" element={<SchedulerPage />} />
                <Route path="/:queueName/scheduler/new" element={<NewSchedulePage />} />
                <Route path="/:queueName/scheduler/edit/:id" element={<EditSchedulePage />} />
                <Route path="/webhooks" element={<WebhooksPage />} />
                <Route path="/webhooks/new" element={<NewWebhookPage />} />
                <Route path="/api-keys" element={<ApiKeysPage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/websocket-events" element={<WebSocketEventsPage />} />
              </Route>
            </Route>

            {/* 404 route */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        
        <Toaster />
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;