import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { createJob } from '@/features/jobs/jobsSlice';
import { jobSubmitSchema, JobSubmitFormValues } from '@/lib/validation';
import { useToast } from '@/components/ui/use-toast';
import { useValidatedForm, getFieldError, hasFieldError } from '@/lib/form-validation';

export default function NewJobPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [jsonData, setJsonData] = useState('{}');
  
  // Initialize form with useValidatedForm hook
  const {
    register,
    handleSubmit,
    formState,
    error,
    setError,
    isSubmitting
  } = useValidatedForm(jobSubmitSchema, async (data: JobSubmitFormValues) => {
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

      // Create job with validated data
      const result = await dispatch(createJob({
        name: data.name,
        data: parsedData,
        options: data.options,
      })).unwrap();

      toast({
        title: 'Job Created',
        description: `Job "${data.name}" has been created successfully`,
      });

      // Navigate to job details page
      navigate(`/jobs/${result.id}`);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create job',
        variant: 'destructive',
      });
      setError(err.message || 'Failed to create job');
    }
  }, {
    defaultValues: {
      name: '',
      options: {
        priority: 50,
        attempts: 3,
        delay: 0,
      }
    }
  });

  return (
    <div className="container p-6 mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Job</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Submit a new job to the queue for processing
        </p>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 max-w-2xl">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Job Details</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter the details for the job you want to create
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
            <h3 className="text-lg font-medium">Job Options</h3>
            
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

            <div>
              <label htmlFor="delay" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Delay (seconds)
              </label>
              <input
                id="delay"
                type="number"
                min={0}
                {...register('options.delay')}
                className={`w-full px-3 py-2 border ${hasFieldError(formState, 'options.delay') ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                disabled={isSubmitting}
              />
              {hasFieldError(formState, 'options.delay') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError(formState, 'options.delay')}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/jobs')}
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
              {isSubmitting ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}