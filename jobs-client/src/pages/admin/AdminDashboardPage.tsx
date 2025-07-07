import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/app/hooks';
// Import actions when implemented
// import { fetchSystemStats } from '@/features/admin/adminSlice';

interface SystemStats {
  activeWorkers: number;
  totalJobs: number;
  pendingJobs: number;
  runningJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageJobDuration: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  queuedWebhooks: number;
  failedWebhooks: number;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

interface JobStats {
  jobsCreatedToday: number;
  jobsCreatedThisWeek: number;
  jobsCreatedThisMonth: number;
  averageJobsPerDay: number;
}

export default function AdminDashboardPage() {
  const dispatch = useAppDispatch();
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [jobStats, setJobStats] = useState<JobStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'jobs' | 'system'>('overview');

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // When implemented, use the actual action
        // const result = await dispatch(fetchSystemStats()).unwrap();
        // setSystemStats(result.systemStats);
        // setUserStats(result.userStats);
        // setJobStats(result.jobStats);
        
        // Mock data for now
        setTimeout(() => {
          setSystemStats({
            activeWorkers: 5,
            totalJobs: 1250,
            pendingJobs: 15,
            runningJobs: 8,
            completedJobs: 1180,
            failedJobs: 47,
            averageJobDuration: 45.2, // seconds
            cpuUsage: 32.5, // percentage
            memoryUsage: 68.3, // percentage
            diskUsage: 42.7, // percentage
            queuedWebhooks: 3,
            failedWebhooks: 12,
          });
          
          setUserStats({
            totalUsers: 125,
            activeUsers: 78,
            newUsersToday: 3,
            newUsersThisWeek: 12,
            newUsersThisMonth: 28,
          });
          
          setJobStats({
            jobsCreatedToday: 42,
            jobsCreatedThisWeek: 287,
            jobsCreatedThisMonth: 1120,
            averageJobsPerDay: 37.3,
          });
          
          setIsLoading(false);
        }, 1000);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch system statistics');
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [dispatch]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    } else if (seconds < 3600) {
      return `${(seconds / 60).toFixed(1)}m`;
    } else {
      return `${(seconds / 3600).toFixed(1)}h`;
    }
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) {
      return 'text-red-600 dark:text-red-400';
    } else if (value >= thresholds.warning) {
      return 'text-yellow-600 dark:text-yellow-400';
    } else {
      return 'text-green-600 dark:text-green-400';
    }
  };

  const renderOverviewTab = () => {
    if (!systemStats || !userStats || !jobStats) return null;
    
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* System Health Card */}
        <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold">System Health</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">CPU Usage</span>
                <span className={getStatusColor(systemStats.cpuUsage, { warning: 70, critical: 90 })}>
                  {systemStats.cpuUsage}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                <div
                  className={`h-2 rounded-full ${
                    systemStats.cpuUsage >= 90
                      ? 'bg-red-500'
                      : systemStats.cpuUsage >= 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${systemStats.cpuUsage}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">Memory Usage</span>
                <span className={getStatusColor(systemStats.memoryUsage, { warning: 80, critical: 95 })}>
                  {systemStats.memoryUsage}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                <div
                  className={`h-2 rounded-full ${
                    systemStats.memoryUsage >= 95
                      ? 'bg-red-500'
                      : systemStats.memoryUsage >= 80
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${systemStats.memoryUsage}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">Disk Usage</span>
                <span className={getStatusColor(systemStats.diskUsage, { warning: 75, critical: 90 })}>
                  {systemStats.diskUsage}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full dark:bg-gray-700">
                <div
                  className={`h-2 rounded-full ${
                    systemStats.diskUsage >= 90
                      ? 'bg-red-500'
                      : systemStats.diskUsage >= 75
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${systemStats.diskUsage}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-3 text-center bg-gray-100 rounded-md dark:bg-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Workers</p>
              <p className="text-xl font-semibold">{systemStats.activeWorkers}</p>
            </div>
            <div className="p-3 text-center bg-gray-100 rounded-md dark:bg-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Job Duration</p>
              <p className="text-xl font-semibold">{formatDuration(systemStats.averageJobDuration)}</p>
            </div>
          </div>
        </div>
        
        {/* User Stats Card */}
        <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold">User Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 text-center bg-blue-100 rounded-md dark:bg-blue-900/30">
              <p className="text-sm text-blue-800 dark:text-blue-300">Total Users</p>
              <p className="text-2xl font-semibold text-blue-800 dark:text-blue-300">
                {formatNumber(userStats.totalUsers)}
              </p>
            </div>
            <div className="p-3 text-center bg-green-100 rounded-md dark:bg-green-900/30">
              <p className="text-sm text-green-800 dark:text-green-300">Active Users</p>
              <p className="text-2xl font-semibold text-green-800 dark:text-green-300">
                {formatNumber(userStats.activeUsers)}
              </p>
            </div>
          </div>
          
          <h3 className="mt-6 mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
            New User Growth
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 text-center bg-gray-100 rounded-md dark:bg-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Today</p>
              <p className="text-lg font-semibold">+{userStats.newUsersToday}</p>
            </div>
            <div className="p-2 text-center bg-gray-100 rounded-md dark:bg-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">This Week</p>
              <p className="text-lg font-semibold">+{userStats.newUsersThisWeek}</p>
            </div>
            <div className="p-2 text-center bg-gray-100 rounded-md dark:bg-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">This Month</p>
              <p className="text-lg font-semibold">+{userStats.newUsersThisMonth}</p>
            </div>
          </div>
        </div>
        
        {/* Job Stats Card */}
        <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold">Job Statistics</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 text-center bg-purple-100 rounded-md dark:bg-purple-900/30">
              <p className="text-sm text-purple-800 dark:text-purple-300">Total Jobs</p>
              <p className="text-2xl font-semibold text-purple-800 dark:text-purple-300">
                {formatNumber(systemStats.totalJobs)}
              </p>
            </div>
            <div className="p-3 text-center bg-indigo-100 rounded-md dark:bg-indigo-900/30">
              <p className="text-sm text-indigo-800 dark:text-indigo-300">Avg. Jobs/Day</p>
              <p className="text-2xl font-semibold text-indigo-800 dark:text-indigo-300">
                {jobStats.averageJobsPerDay.toFixed(1)}
              </p>
            </div>
          </div>
          
          <h3 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
            Job Status
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-4 sm:grid-cols-4">
            <div className="p-2 text-center bg-yellow-100 rounded-md dark:bg-yellow-900/30">
              <p className="text-xs text-yellow-800 dark:text-yellow-300">Pending</p>
              <p className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">
                {systemStats.pendingJobs}
              </p>
            </div>
            <div className="p-2 text-center bg-blue-100 rounded-md dark:bg-blue-900/30">
              <p className="text-xs text-blue-800 dark:text-blue-300">Running</p>
              <p className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                {systemStats.runningJobs}
              </p>
            </div>
            <div className="p-2 text-center bg-green-100 rounded-md dark:bg-green-900/30">
              <p className="text-xs text-green-800 dark:text-green-300">Completed</p>
              <p className="text-lg font-semibold text-green-800 dark:text-green-300">
                {systemStats.completedJobs}
              </p>
            </div>
            <div className="p-2 text-center bg-red-100 rounded-md dark:bg-red-900/30">
              <p className="text-xs text-red-800 dark:text-red-300">Failed</p>
              <p className="text-lg font-semibold text-red-800 dark:text-red-300">
                {systemStats.failedJobs}
              </p>
            </div>
          </div>
        </div>
        
        {/* Webhook Stats Card */}
        <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold">Webhook Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 text-center bg-yellow-100 rounded-md dark:bg-yellow-900/30">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">Queued Webhooks</p>
              <p className="text-2xl font-semibold text-yellow-800 dark:text-yellow-300">
                {systemStats.queuedWebhooks}
              </p>
            </div>
            <div className="p-3 text-center bg-red-100 rounded-md dark:bg-red-900/30">
              <p className="text-sm text-red-800 dark:text-red-300">Failed Webhooks</p>
              <p className="text-2xl font-semibold text-red-800 dark:text-red-300">
                {systemStats.failedWebhooks}
              </p>
            </div>
          </div>
          
          {systemStats.failedWebhooks > 0 && (
            <div className="mt-4">
              <button className="w-full px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                View Failed Webhooks
              </button>
            </div>
          )}
        </div>
        
        {/* Quick Actions Card */}
        <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 text-left text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Manage Workers
            </button>
            <button className="w-full px-4 py-2 text-left text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
              View System Logs
            </button>
            <button className="w-full px-4 py-2 text-left text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
              Manage User Accounts
            </button>
            <button className="w-full px-4 py-2 text-left text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
              Clear Failed Jobs
            </button>
          </div>
        </div>
        
        {/* Recent Activity Card */}
        <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm">User <span className="font-medium">john.doe</span> registered</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">10 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-red-500 rounded-full"></div>
              <div>
                <p className="text-sm">Job <span className="font-medium">data-export-12345</span> failed</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">25 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-sm">Worker <span className="font-medium">worker-3</span> came online</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 mt-2 bg-yellow-500 rounded-full"></div>
              <div>
                <p className="text-sm">System update <span className="font-medium">v1.2.5</span> deployed</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">3 hours ago</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button className="w-full px-4 py-2 text-sm text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/50">
              View All Activity
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderUsersTab = () => {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">User Management</h2>
        <p className="text-gray-500 dark:text-gray-400">
          This section will contain user management features including user listing, role management, and account actions.
        </p>
      </div>
    );
  };

  const renderJobsTab = () => {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">Job Management</h2>
        <p className="text-gray-500 dark:text-gray-400">
          This section will contain advanced job management features including bulk operations, job prioritization, and system-wide job controls.
        </p>
      </div>
    );
  };

  const renderSystemTab = () => {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">System Configuration</h2>
        <p className="text-gray-500 dark:text-gray-400">
          This section will contain system configuration options including worker management, queue settings, and system maintenance controls.
        </p>
      </div>
    );
  };

  return (
    <div className="container p-6 mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          System overview and administrative controls
        </p>
      </div>

      {error && (
        <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'users'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'jobs'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Jobs
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'system'
                ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            System
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard data...</div>
        </div>
      ) : (
        <div>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'users' && renderUsersTab()}
          {activeTab === 'jobs' && renderJobsTab()}
          {activeTab === 'system' && renderSystemTab()}
        </div>
      )}
    </div>
  );
}