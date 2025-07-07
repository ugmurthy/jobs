import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { fetchJobById, cancelJob, retryJob, deleteJob } from '@/features/jobs/jobsSlice';
import { useToast } from '@/components/ui/use-toast';

interface JobDetail {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  result?: any;
  error?: string;
  logs?: string[];
  metadata?: Record<string, any>;
  priority?: number;
  retryCount?: number;
  maxRetries?: number;
  queue?: string;
  worker?: string;
}

// Helper function to map API status to UI status
const mapJobStatus = (apiStatus: string): 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' => {
  switch (apiStatus) {
    case 'waiting':
      return 'pending';
    case 'active':
      return 'running';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'delayed':
      return 'pending';
    default:
      return 'pending';
  }
};

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [job, setJob] = useState<JobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'logs' | 'result'>('details');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;
      
      setIsLoading(true);
      setError(null);
      try {
        // Use the actual fetchJobById action
        const result = await dispatch(fetchJobById(jobId)).unwrap();
        
        // Check if state exists, otherwise fall back to status for backward compatibility
        // Using type assertion since 'state' might not be in the interface but exists in the API response
        const apiState = (result as any).state || result.status;
        
        // Transform the job data to match our JobDetail interface if needed
        const jobDetail: JobDetail = {
          id: result.id,
          name: result.name,
          status: mapJobStatus(apiState),
          progress: result.progress || 0,
          createdAt: result.createdAt,
          startedAt: undefined, // API doesn't provide this directly
          completedAt: result.completedAt || undefined,
          duration: result.processingTime,
          result: result.result,
          error: result.error || result.failedReason,
          logs: result.logs || [],
          metadata: result.data,
          priority: result.options?.priority,
          retryCount: result.options?.attempts,
          maxRetries: result.options?.attempts
        };
        
        setJob(jobDetail);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || `Failed to fetch job details for ${jobId}`);
        setIsLoading(false);
      }
    };
    
    fetchJobDetails();
  }, [dispatch, jobId]);
  
  const handleCancelJob = async () => {
    if (!job) return;
    
    try {
      // Use the actual cancelJob action
      const result = await dispatch(cancelJob(job.id)).unwrap();
      
      // Check if state exists, otherwise fall back to status for backward compatibility
      const apiState = (result as any).state || result.status;
      
      // Update the job with the result
      setJob({
        ...job,
        status: mapJobStatus(apiState),
        progress: result.progress
      });
      
      toast({
        title: 'Job Cancelled',
        description: 'The job has been cancelled successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to cancel job',
        variant: 'destructive',
      });
    }
  };
  
  const handleRetryJob = async () => {
    if (!job) return;
    
    try {
      // Use the actual retryJob action
      const result = await dispatch(retryJob(job.id)).unwrap();
      
      // Navigate to the new job
      navigate(`/jobs/${result.id}`);
      
      toast({
        title: 'Job Retried',
        description: 'The job has been queued for retry',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to retry job',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteJob = async () => {
    if (!job) return;
    
    try {
      // Use the actual deleteJob action
      await dispatch(deleteJob(job.id)).unwrap();
      
      toast({
        title: 'Job Deleted',
        description: 'The job has been deleted successfully',
      });
      
      // Navigate back to jobs list
      navigate('/jobs');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete job',
        variant: 'destructive',
      });
    } finally {
      setIsConfirmingDelete(false);
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
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
      case 'running':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  const getProgressColor = (status: string, progress: number) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 dark:bg-green-600';
      case 'running':
        return 'bg-blue-500 dark:bg-blue-600';
      case 'pending':
        return 'bg-yellow-500 dark:bg-yellow-600';
      case 'failed':
        return 'bg-red-500 dark:bg-red-600';
      case 'cancelled':
        return 'bg-gray-500 dark:bg-gray-600';
      default:
        return 'bg-gray-500 dark:bg-gray-600';
    }
  };
  
  const renderDetailsTab = () => {
    if (!job) return null;
    
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold">Job Information</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">ID</div>
              <div className="col-span-2 text-sm text-gray-900 dark:text-white">{job.id}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Name</div>
              <div className="col-span-2 text-sm text-gray-900 dark:text-white">{job.name}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Status</div>
              <div className="col-span-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Progress</div>
              <div className="col-span-2">
                <div className="flex items-center">
                  <div className="w-full h-2 mr-2 bg-gray-200 rounded-full dark:bg-gray-700">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(job.status, job.progress)}`}
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {job.progress}%
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Queue</div>
              <div className="col-span-2 text-sm text-gray-900 dark:text-white">{job.queue || '-'}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Worker</div>
              <div className="col-span-2 text-sm text-gray-900 dark:text-white">{job.worker || '-'}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Priority</div>
              <div className="col-span-2 text-sm text-gray-900 dark:text-white">{job.priority || '-'}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Retries</div>
              <div className="col-span-2 text-sm text-gray-900 dark:text-white">
                {job.retryCount !== undefined ? `${job.retryCount} / ${job.maxRetries || 0}` : '-'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold">Timing</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Created</div>
              <div className="col-span-2 text-sm text-gray-900 dark:text-white">{formatDate(job.createdAt)}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Started</div>
              <div className="col-span-2 text-sm text-gray-900 dark:text-white">{formatDate(job.startedAt)}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Completed</div>
              <div className="col-span-2 text-sm text-gray-900 dark:text-white">{formatDate(job.completedAt)}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 text-sm font-medium text-gray-500 dark:text-gray-400">Duration</div>
              <div className="col-span-2 text-sm text-gray-900 dark:text-white">{formatDuration(job.duration)}</div>
            </div>
          </div>
          
          {job.metadata && (
            <>
              <h2 className="mt-6 mb-4 text-lg font-semibold">Metadata</h2>
              <div className="p-3 overflow-auto font-mono text-sm bg-gray-100 rounded-md dark:bg-gray-700 dark:text-gray-300" style={{ maxHeight: '200px' }}>
                <pre>{JSON.stringify(job.metadata, null, 2)}</pre>
              </div>
            </>
          )}
        </div>
        
        {job.error && (
          <div className="col-span-1 p-6 bg-white rounded-lg shadow-md md:col-span-2 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-red-600 dark:text-red-400">Error</h2>
            <div className="p-3 overflow-auto font-mono text-sm text-red-800 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-300" style={{ maxHeight: '200px' }}>
              {job.error}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const renderLogsTab = () => {
    if (!job || !job.logs || job.logs.length === 0) {
      return (
        <div className="p-6 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">No logs available for this job</p>
        </div>
      );
    }
    
    return (
      <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Job Logs</h2>
          <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            Download Logs
          </button>
        </div>
        <div className="p-3 overflow-auto font-mono text-sm bg-gray-100 rounded-md dark:bg-gray-700 dark:text-gray-300" style={{ maxHeight: '500px' }}>
          {job.logs.map((log, index) => (
            <div key={index} className="py-1">
              {log}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderResultTab = () => {
    if (!job || !job.result) {
      return (
        <div className="p-6 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">No result data available for this job</p>
        </div>
      );
    }
    
    return (
      <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Job Result</h2>
          <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            Download Result
          </button>
        </div>
        <div className="p-3 overflow-auto font-mono text-sm bg-gray-100 rounded-md dark:bg-gray-700 dark:text-gray-300" style={{ maxHeight: '500px' }}>
          <pre>{JSON.stringify(job.result, null, 2)}</pre>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container p-6 mx-auto">
      <div className="flex items-center mb-2">
        <Link
          to="/jobs"
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Jobs
        </Link>
      </div>
      
      {error && (
        <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading job details...</div>
        </div>
      ) : job ? (
        <>
          <div className="flex flex-col items-start justify-between mb-6 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold">{job.name}</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Job ID: {job.id}
              </p>
            </div>
            
            <div className="flex mt-4 space-x-2 md:mt-0">
              {(job.status === 'pending' || job.status === 'running') && (
                <button
                  onClick={handleCancelJob}
                  className="px-3 py-1 text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Cancel Job
                </button>
              )}
              
              {(job.status === 'failed' || job.status === 'cancelled') && (
                <button
                  onClick={handleRetryJob}
                  className="px-3 py-1 text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Retry Job
                </button>
              )}
              
              <button
                onClick={() => setIsConfirmingDelete(true)}
                className="px-3 py-1 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Delete Job
              </button>
            </div>
          </div>
          
          {/* Status and Progress */}
          <div className="p-4 mb-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
            <div className="flex flex-col items-start md:flex-row md:items-center">
              <div className="mb-4 md:mb-0 md:mr-6">
                <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="flex-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">Progress</span>
                <div className="flex items-center mt-1">
                  <div className="flex-1 h-2 mr-2 bg-gray-200 rounded-full dark:bg-gray-700">
                    <div
                      className={`h-2 rounded-full ${getProgressColor(job.status, job.progress)}`}
                      style={{ width: `${job.progress}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {job.progress}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="mb-6">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'details'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'logs'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Logs
              </button>
              <button
                onClick={() => setActiveTab('result')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'result'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Result
              </button>
            </div>
          </div>
          
          {/* Tab Content */}
          <div>
            {activeTab === 'details' && renderDetailsTab()}
            {activeTab === 'logs' && renderLogsTab()}
            {activeTab === 'result' && renderResultTab()}
          </div>
          
          {/* Delete Confirmation Modal */}
          {isConfirmingDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
                <h3 className="mb-4 text-lg font-semibold">Confirm Delete</h3>
                <p className="mb-6 text-gray-600 dark:text-gray-400">
                  Are you sure you want to delete this job? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteJob}
                    className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-6 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">Job not found</p>
        </div>
      )}
    </div>
  );
}