import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchScheduledJobs,
  toggleScheduledJob,
  runScheduledJobNow,
  ScheduledJob
} from '@/features/scheduler/schedulerSlice';

export default function SchedulerPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { scheduledJobs, isLoading, error } = useAppSelector((state) => state.scheduler);

  useEffect(() => {
    dispatch(fetchScheduledJobs());
  }, [dispatch]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleToggleSchedule = (id: string, currentStatus: boolean) => {
    dispatch(toggleScheduledJob({ id, enabled: !currentStatus }));
  };

  const handleRunNow = (id: string) => {
    dispatch(runScheduledJobNow(id));
  };

  const handleEdit = (id: string) => {
    navigate(`/scheduler/edit/${id}`);
  };

  // Helper function to extract cron expression from schedule
  const getCronExpression = (schedule: ScheduledJob['schedule']) => {
    if (!schedule) {
      return 'No schedule defined';
    }
    
    if (schedule.cron) {
      return schedule.cron;
    } else if (schedule.repeat) {
      return `Every ${schedule.repeat.every}ms${schedule.repeat.limit ? ` (limit: ${schedule.repeat.limit})` : ''}`;
    }
    return 'Custom schedule';
  };

  // Helper function to determine if a job is enabled
  // Note: The API doesn't explicitly have an enabled field, so we're inferring from the schedule
  const isJobEnabled = (job: ScheduledJob) => {
    // Check if schedule exists and has an endDate
    if (job.schedule && job.schedule.endDate) {
      // If the endDate is in the past, the job is disabled
      if (new Date(job.schedule.endDate) < new Date()) {
        return false;
      }
    }
    return true;
  };

  return (
    <div className="container p-6 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Scheduler</h1>
        <Link
          to="/scheduler/new"
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Create New Schedule
        </Link>
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
                <th className="p-3 text-left">Job Type</th>
                <th className="p-3 text-left">Cron Expression</th>
                <th className="p-3 text-left">Next Run</th>
                <th className="p-3 text-left">Last Run</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {scheduledJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">
                    No scheduled jobs found
                  </td>
                </tr>
              ) : (
                scheduledJobs.map((job, index) => {
                  const enabled = isJobEnabled(job);
                  // Use job.id if available, otherwise use index as fallback
                  const uniqueKey = job.id ? job.id : `job-${index}`;
                  return (
                    <tr
                      key={uniqueKey}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="p-3 font-medium">{job.name}</td>
                      <td className="p-3">{job.data && job.data.type ? job.data.type : 'Unknown'}</td>
                      <td className="p-3 font-mono text-sm">{getCronExpression(job.schedule)}</td>
                      <td className="p-3">{formatDate(job.nextRun)}</td>
                      <td className="p-3">N/A</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            enabled
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                          }`}
                        >
                          {enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleSchedule(job.id, enabled)}
                            className={`px-2 py-1 text-sm rounded ${
                              enabled
                                ? 'text-red-600 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50'
                                : 'text-green-600 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/50'
                            }`}
                          >
                            {enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => handleEdit(job.id)}
                            className="px-2 py-1 text-sm text-blue-600 bg-blue-100 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRunNow(job.id)}
                            className="px-2 py-1 text-sm text-blue-600 bg-blue-100 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/50"
                          >
                            Run Now
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