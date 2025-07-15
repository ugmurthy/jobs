import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { 
  fetchScheduledJobById, 
  updateScheduledJob 
} from '@/features/scheduler/schedulerSlice';
import { scheduleJobSchema, ScheduleJobFormValues } from '@/lib/validation';
import { useToast } from '@/components/ui/use-toast';
import { useValidatedForm, getFieldError, hasFieldError } from '@/lib/form-validation';

export default function EditSchedulePage() {
  const { queueName, id } = useParams<{ queueName: string; id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [jsonData, setJsonData] = useState('{}');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const { selectedScheduledJob } = useAppSelector((state) => state.scheduler);
  
  // Initialize form with useValidatedForm hook
  const {
    register,
    handleSubmit,
    formState,
    error,
    setError,
    isSubmitting,
    setValue
  } = useValidatedForm(scheduleJobSchema, async (data: ScheduleJobFormValues) => {
    if (!id || !queueName) return;
    
    try {
      // Parse JSON data if provided as string
      let parsedData = data.data;
      if (typeof jsonData === 'string' && jsonData.trim() !== '') {
        try {
          parsedData = JSON.parse(jsonData);
        } catch (error) {
          toast({
            title: 'Invalid JSON',
            description: 'Please provide valid JSON for job data',
            variant: 'destructive',
          });
          return;
        }
      }

      // Transform form data to match API expectations
      const apiSchedule: any = {};
      
      // Handle different schedule types
      if (data.schedule.type === 'cron') {
        apiSchedule.cron = data.schedule.value;
      } else if (data.schedule.type === 'every') {
        // Parse interval value (e.g., "1h", "30m") to milliseconds
        const match = data.schedule.value.match(/^(\d+)([hms])$/);
        if (match) {
          const [, value, unit] = match;
          let milliseconds = parseInt(value);
          
          if (unit === 'h') milliseconds *= 60 * 60 * 1000;
          else if (unit === 'm') milliseconds *= 60 * 1000;
          else if (unit === 's') milliseconds *= 1000;
          
          apiSchedule.repeat = { every: milliseconds };
        }
      } else if (data.schedule.type === 'once') {
        // For one-time jobs, use startDate
        apiSchedule.startDate = data.schedule.value;
      }
      
      // Transform options
      const apiOptions: any = {};
      if (data.options?.attempts) {
        apiOptions.removeOnComplete = { count: data.options.attempts };
        apiOptions.removeOnFail = { count: data.options.attempts };
      }
 
       // Update scheduled job with transformed data
      await dispatch(updateScheduledJob({
         queueName,
         id,
         name: data.name,
        data: parsedData,
        schedule: apiSchedule,
        options: apiOptions,
      })).unwrap();

      toast({
        title: 'Schedule Updated',
        description: `Schedule "${data.name}" has been updated successfully`,
      });

      // Navigate back to scheduler page
      navigate('/scheduler');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update schedule',
        variant: 'destructive',
      });
      setError(err.message || 'Failed to update schedule');
    }
  }, {
    defaultValues: {
      name: '',
      schedule: {
        type: 'cron',
        value: '0 0 * * *',
      },
      options: {
        priority: 50,
        attempts: 3,
      }
    }
  });

  // Fetch scheduled job data when component mounts
  useEffect(() => {
    if (!id || !queueName) return;
    
    const fetchScheduledJob = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        await dispatch(fetchScheduledJobById({ queueName, schedulerId: id })).unwrap();
      } catch (err: any) {
        setLoadError(err.message || 'Failed to fetch scheduled job');
        toast({
          title: 'Error',
          description: err.message || 'Failed to fetch scheduled job',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchScheduledJob();
  }, [dispatch, queueName, id, toast]);
  
  // Populate form with fetched data
  useEffect(() => {
    if (selectedScheduledJob && !isLoading) {
      // Set form values
      setValue('name', selectedScheduledJob.name);
      
      // Set JSON data
      setJsonData(JSON.stringify(selectedScheduledJob.template?.data || {}, null, 2));
      
      // Determine schedule type and value
      if (selectedScheduledJob.pattern) {
        setValue('schedule.type', 'cron');
        setValue('schedule.value', selectedScheduledJob.pattern);
      } else if (selectedScheduledJob.every) {
        setValue('schedule.type', 'every');
        const ms = parseInt(selectedScheduledJob.every);
        let value = '';
        if (ms % (60 * 60 * 1000) === 0) {
          value = `${ms / (60 * 60 * 1000)}h`;
        } else if (ms % (60 * 1000) === 0) {
          value = `${ms / (60 * 1000)}m`;
        } else {
          value = `${ms / 1000}s`;
        }
        setValue('schedule.value', value);
      }
      
      // Set options
      if (selectedScheduledJob.template?.opts?.removeOnComplete) {
        setValue('options.attempts', selectedScheduledJob.template.opts.removeOnComplete.count);
      }
      
      // Priority is not directly mapped in the API, so we'll use a default
      setValue('options.priority', 50);
    }
  }, [selectedScheduledJob, isLoading, setValue]);

  if (isLoading) {
    return (
      <div className="container p-6 mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading scheduled job...</div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container p-6 mx-auto">
        <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-300">
          {loadError}
        </div>
        <button
          onClick={() => navigate(`/${queueName}/scheduler`)}
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Back to Scheduler
        </button>
      </div>
    );
  }

  return (
    <div className="container p-6 mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Schedule</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Update the scheduled job settings
        </p>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 max-w-2xl">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Schedule Details</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Edit the details for the scheduled job
          </p>
        </div>
        
        {error && (
          <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Job Name
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className={`w-full px-3 py-2 border ${hasFieldError(formState, 'name') ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
              placeholder="Enter job name"
              disabled={isSubmitting}
            />
            {hasFieldError(formState, 'name') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError(formState, 'name')}</p>
            )}
          </div>

          <div>
            <label htmlFor="data" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Job Data (JSON)
            </label>
            <textarea
              id="data"
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono min-h-32`}
              placeholder='{"key": "value"}'
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Schedule Settings</h3>
            
            <div>
              <label htmlFor="schedule-type" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Schedule Type
              </label>
              <select
                id="schedule-type"
                {...register('schedule.type')}
                className={`w-full px-3 py-2 border ${hasFieldError(formState, 'schedule.type') ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                disabled={isSubmitting}
              >
                <option value="cron">Cron Expression</option>
                <option value="every">Interval</option>
                <option value="once">One-time</option>
              </select>
              {hasFieldError(formState, 'schedule.type') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError(formState, 'schedule.type')}</p>
              )}
            </div>

            <div>
              <label htmlFor="schedule-value" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Schedule Value
              </label>
              <input
                id="schedule-value"
                type="text"
                {...register('schedule.value')}
                className={`w-full px-3 py-2 border ${hasFieldError(formState, 'schedule.value') ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                placeholder="0 0 * * * (for daily at midnight)"
                disabled={isSubmitting}
              />
              {hasFieldError(formState, 'schedule.value') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError(formState, 'schedule.value')}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                For cron: "0 0 * * *" (daily at midnight)<br />
                For interval: "1h" (every hour), "30m" (every 30 minutes)<br />
                For one-time: ISO date string (e.g., "2025-06-01T12:00:00Z")
              </p>
            </div>

            <h3 className="text-lg font-medium pt-2">Job Options</h3>
            
            <div>
              <label htmlFor="priority" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Priority (1-100)
              </label>
              <input
                id="priority"
                type="number"
                min={1}
                max={100}
                {...register('options.priority')}
                className={`w-full px-3 py-2 border ${hasFieldError(formState, 'options.priority') ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                disabled={isSubmitting}
              />
              {hasFieldError(formState, 'options.priority') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError(formState, 'options.priority')}</p>
              )}
            </div>

            <div>
              <label htmlFor="attempts" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Max Attempts
              </label>
              <input
                id="attempts"
                type="number"
                min={1}
                {...register('options.attempts')}
                className={`w-full px-3 py-2 border ${hasFieldError(formState, 'options.attempts') ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                disabled={isSubmitting}
              />
              {hasFieldError(formState, 'options.attempts') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError(formState, 'options.attempts')}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate(`/${queueName}/scheduler`)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Schedule'}
            </button>
          </div>
        </form>
      </div>

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