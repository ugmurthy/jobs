import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchJobs,
  cancelJob,
  retryJob,
  setStatusFilter,
  setSearchFilter,
  setSortBy,
  setSortDirection,
  setLimit,
  setPage
} from '@/features/jobs/jobsSlice';
import { useToast } from '@/components/ui/use-toast';

// This interface represents the UI job model (aligned with BullMQ statuses)
interface UIJob {
  id: string;
  name: string;
  status: 'active' | 'delayed' | 'completed' | 'failed' | 'paused' | 'waiting-children';
  progress: number;
  timestamp: {
    created: number;
    started?: number;
    finished?: number;
  };
  duration?: number;
  result?: any;
  error?: string;
}

interface JobsFilter {
  status: string;
  search: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function JobsPage() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<UIJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalJobs, setTotalJobs] = useState(0);
  
  // Subscribe to the jobs state in Redux to get real-time updates
  const reduxJobs = useAppSelector((state) => state.jobs.jobs);
  const [filter, setFilter] = useState<JobsFilter>({
    status: 'all',
    search: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  
  // Helper function to map API job to UI job
  const mapApiJobToUiJob = (apiJob: any): UIJob => {
    // Map API state to UI status - use BullMQ statuses directly
    let uiStatus: UIJob['status'] = 'active';
    // Check if state exists, otherwise fall back to status for backward compatibility
    // Using type assertion since 'state' might not be in the interface but exists in the API response
    const apiState = (apiJob as any).state || apiJob.status;
    
    // Handle legacy status names and map to BullMQ statuses
    switch (apiState) {
      case 'waiting':
        uiStatus = 'active'; // Map legacy 'waiting' to 'active'
        break;
      case 'active':
        uiStatus = 'active';
        break;
      case 'completed':
        uiStatus = 'completed';
        break;
      case 'failed':
        uiStatus = 'failed';
        break;
      case 'delayed':
        uiStatus = 'delayed';
        break;
      case 'paused':
        uiStatus = 'paused';
        break;
      case 'waiting-children':
        uiStatus = 'waiting-children';
        break;
      default:
        uiStatus = 'active';
    }
    
    // Calculate duration for completed jobs using timestamp.finished - timestamp.started
    let duration = undefined;
    if (apiJob.timestamp && apiJob.timestamp.finished && apiJob.timestamp.started && apiState === 'completed') {
      duration = Math.floor((apiJob.timestamp.finished - apiJob.timestamp.started) / 1000); // Convert ms to seconds
    }
    
    return {
      id: apiJob.id,
      name: apiJob.name,
      status: uiStatus,
      progress: apiJob.progress || 0,
      timestamp: {
        created: apiJob.timestamp?.created,
        started: apiJob.timestamp?.started,
        finished: apiJob.timestamp?.finished
      },
      duration,
      result: apiJob.result,
      error: apiJob.error || apiJob.failedReason || undefined
    };
  };

  // Effect to fetch jobs when filter changes
  useEffect(() => {
    const fetchJobsList = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Set Redux filter state based on component filter
        dispatch(setStatusFilter(filter.status !== 'all' ? filter.status : null));
        dispatch(setSearchFilter(filter.search || null));
        dispatch(setSortBy(filter.sortBy));
        dispatch(setSortDirection(filter.sortOrder as 'asc' | 'desc'));
        dispatch(setLimit(filter.limit));
        dispatch(setPage(filter.page));
        
        // Use the actual fetchJobs action
        const result = await dispatch(fetchJobs()).unwrap();
        
        // Map API response to component state
        const mappedJobs = result.jobs.map(mapApiJobToUiJob);
        
        setJobs(mappedJobs);
        setTotalJobs(result.pagination.totalItems);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch jobs');
        setIsLoading(false);
      }
    };
    
    fetchJobsList();
  }, [dispatch, filter]);
  
  // Effect to update UI jobs when Redux jobs state changes (for real-time updates)
  useEffect(() => {
    if (reduxJobs.length > 0 && jobs.length > 0) {
      // Create a map of existing UI jobs for quick lookup
      const jobsMap = new Map(jobs.map(job => [job.id, job]));
      
      // Check if any Redux jobs have updated progress or status
      let hasUpdates = false;
      
      // Create updated jobs array
      const updatedJobs = jobs.map(uiJob => {
        // Find corresponding Redux job
        const reduxJob = reduxJobs.find(j => j.id === uiJob.id);
        
        // If Redux job exists, check for updates
        if (reduxJob) {
          // Handle progress which could be a number or an object
          let progressValue = 0;
          if (typeof reduxJob.progress === 'number') {
            progressValue = reduxJob.progress;
          }
          
          // Map API state to UI status - use BullMQ statuses directly
          let uiStatus: UIJob['status'] = 'active';
          // Check if state exists, otherwise fall back to status for backward compatibility
          const apiState = (reduxJob as any).state || reduxJob.status;
          
          // Special case: If progress is 100%, ensure status is completed
          if (progressValue === 100 && apiState === 'active') {
            console.log(`Job ${reduxJob.id} has 100% progress but status is still active, forcing to completed`);
            uiStatus = 'completed';
          } else {
            // Handle legacy status names and map to BullMQ statuses
            switch (apiState) {
              case 'waiting':
                uiStatus = 'active'; // Map legacy 'waiting' to 'active'
                break;
              case 'active':
                uiStatus = 'active';
                break;
              case 'completed':
                uiStatus = 'completed';
                break;
              case 'failed':
                uiStatus = 'failed';
                break;
              case 'delayed':
                uiStatus = 'delayed';
                break;
              case 'paused':
                uiStatus = 'paused';
                break;
              case 'waiting-children':
                uiStatus = 'waiting-children';
                break;
              default:
                uiStatus = 'active';
            }
          }
          
          // Log status changes for debugging
          if (uiStatus !== uiJob.status) {
            console.log(`Job ${reduxJob.id} status changed: ${uiJob.status} -> ${uiStatus}`);
            console.log(`Job details:`, {
              apiState,
              progress: progressValue,
              reduxStatus: reduxJob.status
            });
          }
          
          // Check if either progress or status has changed
          if (progressValue !== uiJob.progress || uiStatus !== uiJob.status) {
            hasUpdates = true;
            return {
              ...uiJob,
              progress: progressValue,
              status: uiStatus
            };
          }
        }
        
        return uiJob;
      });
      
      // Only update state if there were actual changes
      if (hasUpdates) {
        setJobs(updatedJobs);
      }
    }
  }, [reduxJobs, jobs]);
  
  const handleFilterChange = (key: keyof JobsFilter, value: any) => {
    setFilter({ ...filter, [key]: value, page: key === 'page' ? value : 1 });
  };
  
  const handleCancelJob = async (jobId: string) => {
    try {
      // Use the actual cancelJob action
      await dispatch(cancelJob(jobId)).unwrap();
      
      toast({
        title: 'Job Canceled',
        description: 'The job has been canceled successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to cancel job',
        variant: 'destructive',
      });
    }
  };
  
  const handleRetryJob = async (jobId: string) => {
    try {
      // Use the actual retryJob action
      await dispatch(retryJob(jobId)).unwrap();
      
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
  
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
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
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'delayed':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'paused':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'waiting-children':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  const getProgressColor = (status: string, progress: number) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 dark:bg-green-600';
      case 'active':
        return 'bg-blue-500 dark:bg-blue-600';
      case 'delayed':
        return 'bg-yellow-500 dark:bg-yellow-600';
      case 'failed':
        return 'bg-red-500 dark:bg-red-600';
      case 'paused':
        return 'bg-purple-500 dark:bg-purple-600';
      case 'waiting-children':
        return 'bg-indigo-500 dark:bg-indigo-600';
      default:
        return 'bg-gray-500 dark:bg-gray-600';
    }
  };
  
  const totalPages = Math.ceil(totalJobs / filter.limit);
  
  return (
    <div className="container p-6 mx-auto">
      <div className="flex flex-col items-start justify-between mb-6 md:flex-row md:items-center">
        <h1 className="mb-4 text-3xl font-bold md:mb-0">Jobs</h1>
        <Link
          to="/jobs/new"
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Create New Job
        </Link>
      </div>
      
      {error && (
        <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      
      {/* Filters */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="status-filter" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              id="status-filter"
              value={filter.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="all">All</option>
              <option value="active">active</option>
              <option value="delayed">delayed</option>
              <option value="completed">completed</option>
              <option value="failed">failed</option>
              <option value="paused">paused</option>
              <option value="waiting-children">waiting-children</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="sort-by" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort By
            </label>
            <select
              id="sort-by"
              value={filter.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="timestamp.created">Created Date</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="duration">Duration</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="sort-order" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Sort Order
            </label>
            <select
              id="sort-order"
              value={filter.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4">
          <label htmlFor="search" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Search
          </label>
          <input
            id="search"
            type="text"
            value={filter.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search by job name or ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>
      
      {/* Jobs List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading jobs...</div>
        </div>
      ) : (
        <>
          <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
            {jobs.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">No jobs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Progress
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Duration
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {jobs.map((job) => (
                      <tr key={job.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/jobs/${job.id}`}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            {job.name}
                          </Link>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{job.id}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full h-2 mr-2 bg-gray-200 rounded-full dark:bg-gray-700">
                              <div
                                className={`h-2 rounded-full ${getProgressColor(job.status, job.progress)}`}
                                style={{ width: `${typeof job.progress === 'number' ? job.progress : 0}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {typeof job.progress === 'number' ? job.progress : 0}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(job.timestamp.created)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDuration(job.duration)}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex justify-end space-x-2">
                            <Link
                              to={`/jobs/${job.id}`}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              View
                            </Link>
                            
                            {job.status === 'active' || job.status === 'delayed' || job.status === 'paused' ? (
                              <button
                                onClick={() => handleCancelJob(job.id)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Cancel
                              </button>
                            ) : null}
                            
                            {job.status === 'failed' ? (
                              <button
                                onClick={() => handleRetryJob(job.id)}
                                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                              >
                                Retry
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{(filter.page - 1) * filter.limit + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(filter.page * filter.limit, totalJobs)}
                </span>{' '}
                of <span className="font-medium">{totalJobs}</span> results
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleFilterChange('page', Math.max(1, filter.page - 1))}
                  disabled={filter.page === 1}
                  className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <button
                  onClick={() => handleFilterChange('page', Math.min(totalPages, filter.page + 1))}
                  disabled={filter.page === totalPages}
                  className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}