import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchScheduledJobs,
  runScheduledJobNow,
  deleteScheduledJob,
  ScheduledJob,
  setQueueName,
} from '@/features/scheduler/schedulerSlice';

export default function SchedulerPage() {
  const { queueName } = useParams<{ queueName: string }>();
  const dispatch = useAppDispatch();
  const { scheduledJobs, isLoading, error } = useAppSelector((state) => state.scheduler);

  useEffect(() => {
    if (queueName) {
      dispatch(setQueueName(queueName));
      dispatch(fetchScheduledJobs(queueName));
    }
  }, [dispatch, queueName]);

  const formatDate = (timestamp?: number | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    
    // Check if the date is in the future
    if (date > new Date()) {
      // Format as DD-MMM-YY
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear().toString().slice(2);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}-${month}-${year} ${hours}:${minutes}`;
    }
    
    return 'None';
  };

  const formatLastRun = (job: ScheduledJob) => {
    const iterationCount = job.iterationCount?.toString() || '0';
    const limit = job.limit?.toString();
    
    if (limit) {
      return `${iterationCount}/${limit}`;
    }
    
    return iterationCount;
  };

  const handleDelete = (key: string) => {
    if (queueName) {
      dispatch(deleteScheduledJob({ queueName, schedulerId: key }));
    }
  };

  const handleRunNow = (key: string) => {
    if (queueName) {
      dispatch(runScheduledJobNow({ queueName, schedulerId: key }));
    }
  };

  return (
    <div className="container p-6 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Scheduler</h1>
        <div className="flex items-center space-x-4">
            <Link
              to={`/${queueName}/scheduler/new`}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create New Schedule
            </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading schedules...</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Cron Expression</th>
                <th className="p-3 text-left">Next Run</th>
                <th className="p-3 text-left">Last Run</th>
                <th className="p-3 text-left">End Date</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {scheduledJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-500">
                    No scheduled jobs found
                  </td>
                </tr>
              ) : (
                scheduledJobs.map((job, index) => {
                  return (
                    <tr
                      key={job.key || `job-${index}`}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="p-3 font-medium">{job.name}</td>
                      <td className="p-3 font-mono text-sm">{job.pattern || 'Repeat Job'}</td>
                      <td className="p-3">{formatDate(job.next)}</td>
                      <td className="p-3">{formatLastRun(job)}</td>
                      <td className="p-3">{job.endDate ? formatDate(job.endDate) : ''}</td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          
                          <button
                            onClick={() => handleDelete(job.key)}
                            className="p-1 text-red-600 bg-red-100 rounded hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleRunNow(job.key)}
                            className="p-1 text-green-600 bg-green-100 rounded hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/50"
                            title="Run Now"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">Cron Expression Help</h2>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Cron expressions are used to define when a scheduled job should run.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="p-2 text-left">Format</th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-left">Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="p-2 font-mono">* * * * *</td>
                <td className="p-2">Every minute</td>
                <td className="p-2">Run every minute</td>
              </tr>
              <tr>
                <td className="p-2 font-mono">0 * * * *</td>
                <td className="p-2">Every hour</td>
                <td className="p-2">Run at the start of every hour</td>
              </tr>
              <tr>
                <td className="p-2 font-mono">0 0 * * *</td>
                <td className="p-2">Every day</td>
                <td className="p-2">Run at midnight every day</td>
              </tr>
              <tr>
                <td className="p-2 font-mono">0 0 * * 0</td>
                <td className="p-2">Every week</td>
                <td className="p-2">Run at midnight every Sunday</td>
              </tr>
              <tr>
                <td className="p-2 font-mono">0 0 1 * *</td>
                <td className="p-2">Every month</td>
                <td className="p-2">Run at midnight on the first day of every month</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}