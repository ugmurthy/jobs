import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchDashboardStats } from '@/features/dashboard/dashboardSlice';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { jobStats, recentJobs, queueStats, schedulerStats, webhookStats, isLoading, error } = useAppSelector((state) => state.dashboard);
  
  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'waiting':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300';
      case 'delayed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'waiting-children':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'paused':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  return (
    <div className="container p-6 mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome back, {user?.username || 'User'}
        </p>
      </div>
      
      {error && (
        <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard data...</div>
        </div>
      ) : (
        <>
          {/* Job Statistics */}
          {jobStats && (
            <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2 lg:grid-cols-7">
              <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                <h2 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Total Jobs</h2>
                <p className="text-3xl font-bold">{jobStats.total}</p>
              </div>
              
              <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                <h2 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Active</h2>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{jobStats.active}</p>
              </div>
              
              <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                <h2 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Delayed</h2>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{jobStats.delayed}</p>
              </div>
              
              <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                <h2 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Completed</h2>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{jobStats.completed}</p>
              </div>
              
              <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                <h2 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Failed</h2>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{jobStats.failed}</p>
              </div>
              
              <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                <h2 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Paused</h2>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{jobStats.paused}</p>
              </div>
              
              <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                <h2 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Waiting Children</h2>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{jobStats['waiting-children']}</p>
              </div>
            </div>
          )}
          
          {/* Other Stats */}
          <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2 lg:grid-cols-3">
              {schedulerStats && (
                  <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                      <h2 className="mb-2 text-lg font-semibold">Scheduler</h2>
                      <p>Total: {schedulerStats.totalSchedules}</p>
                      <p>Active: {schedulerStats.activeSchedules}</p>
                      <p>Next Run: {formatDate(schedulerStats.nextScheduledJob)}</p>
                  </div>
              )}
              {webhookStats && (
                  <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                      <h2 className="mb-2 text-lg font-semibold">Webhooks</h2>
                      <p>Total: {webhookStats.totalWebhooks}</p>
                      <p>Active: {webhookStats.activeWebhooks}</p>
                      <p>Delivery Rate: {webhookStats.deliveryRate}%</p>
                  </div>
              )}
          </div>

          {/* Queue Stats */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Queue Stats</h2>
            </div>
            
            <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Queue Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Total
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Active
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Completed
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Failed
                    </th>
                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Delayed
                    </th>
                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Paused
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {Array.isArray(queueStats) && queueStats.map((queue) => (
                    <tr key={queue.name}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/queues/${queue.name}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {queue.name}
                        </Link>
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap">{queue.total}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{queue.active}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{queue.completed}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{queue.failed}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{queue.delayed}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{queue.paused}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Recent Jobs */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Jobs</h2>
              <Link
                to="/queues/jobQueue"
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View all jobs
              </Link>
            </div>
            
            <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Job Id
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Job Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                  {Array.isArray(recentJobs) && recentJobs.map((job) => (
                    <tr key={job.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/queues/jobQueue/${job.id}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {job.id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/queues/jobQueue/${job.id}`}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {job.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(job.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {job.duration ? formatDuration(job.duration) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="mb-6">
            <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                to="/queues/jobQueue/new"
                className="flex items-center p-4 bg-white rounded-lg shadow-md hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Create Job</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Submit a new job to the queue
                  </p>
                </div>
              </Link>
              
              <Link
                to="/schedQueue/scheduler/new"
                className="flex items-center p-4 bg-white rounded-lg shadow-md hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-purple-600 bg-purple-100 rounded-full dark:bg-purple-900/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Schedule Job</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Create a recurring job
                  </p>
                </div>
              </Link>
              
              <Link
                to="/webhooks"
                className="flex items-center p-4 bg-white rounded-lg shadow-md hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-green-600 bg-green-100 rounded-full dark:bg-green-900/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">Manage Webhooks</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configure event notifications
                  </p>
                </div>
              </Link>
              
              <Link
                to="/api-keys"
                className="flex items-center p-4 bg-white rounded-lg shadow-md hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-yellow-600 bg-yellow-100 rounded-full dark:bg-yellow-900/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium">API Keys</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Manage API access
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}