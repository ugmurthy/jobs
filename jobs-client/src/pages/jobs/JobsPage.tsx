import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchJobs,
  cancelJob,
  deleteJob,
  retryJob,
  setStatusFilter,
  setSearchFilter,
  setSortBy,
  setSortDirection,
  setLimit,
  setPage
} from '@/features/jobs/jobsSlice';
import { useToast } from '@/components/ui/use-toast';
import { JOB_STATUS, JOB_STATUS_COLORS } from '@/lib/constants';
import type { Job as JobType } from '@/features/jobs/jobsSlice';

// This interface represents the UI job model (aligned with BullMQ statuses)
interface UIJob {
  id: string;
  name: string;
  status: JobType['status'];
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
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef<IntersectionObserver>();
  
  // Subscribe to the jobs state in Redux to get real-time updates
  const reduxJobs = useAppSelector((state) => state.jobs.jobs);
  const pagination = useAppSelector((state) => state.jobs.pagination);
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
    let uiStatus: UIJob['status'] = 'waiting';
    // Check if state exists, otherwise fall back to status for backward compatibility
    // Using type assertion since 'state' might not be in the interface but exists in the API response
    const apiState = (apiJob as any).state || apiJob.status;
    
    if (Object.values(JOB_STATUS).includes(apiState)) {
      uiStatus = apiState;
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
        
        // Use the actual fetchJobs action for the initial load
        if (filter.page === 1) {
            const result = await dispatch(fetchJobs()).unwrap();
            const mappedJobs = result.jobs.map(mapApiJobToUiJob);
            setJobs(mappedJobs);
            setTotalJobs(result.pagination.totalItems);
            setHasMore(result.pagination.page < result.pagination.totalPages);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch jobs');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJobsList();
  }, [dispatch, filter.status, filter.search, filter.sortBy, filter.sortOrder, filter.limit]);

  const lastJobElementRef = useCallback((node: any) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting && hasMore) {
        handleFilterChange('page', filter.page + 1);
        setIsLoading(true);
        try {
            const result = await dispatch(fetchJobs({ append: true })).unwrap();
            setJobs(prevJobs => [...prevJobs, ...result.jobs.map(mapApiJobToUiJob)]);
            setHasMore(result.pagination.page < result.pagination.totalPages);
        } catch (err: any) {
            setError(err.message || 'Failed to load more jobs');
        } finally {
            setIsLoading(false);
        }
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, dispatch, filter]);
  
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
         let uiStatus: UIJob['status'] = 'waiting';
         // Check if state exists, otherwise fall back to status for backward compatibility
         const apiState = (reduxJob as any).state || reduxJob.status;

         // Special case: If progress is 100%, ensure status is completed
         if (progressValue === 100 && apiState === 'active') {
           console.log(`Job ${reduxJob.id} has 100% progress but status is still active, forcing to completed`);
           uiStatus = 'completed';
         } else if (Object.values(JOB_STATUS).includes(apiState)) {
           uiStatus = apiState;
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
    if (key !== 'page') {
      setJobs([]);
      setFilter({ ...filter, [key]: value, page: 1 });
    } else {
        dispatch(setPage(value));
        setFilter({ ...filter, page: value });
    }
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
  const handleDeleteJob = async (jobId: string) => {
    try {
      await dispatch(deleteJob(jobId)).unwrap();
      setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
      toast({
        title: 'Job Deleted',
        description: `Job ${jobId} has been successfully deleted.`,
      });
    } catch (err: any) {
      toast({
        title: 'Error Deleting Job',
        description: err.message || 'An unexpected error occurred.',
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
  
  const getStatusColor = (status: JobType['status']) => {
    return JOB_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };
  
  const getProgressColor = (status: JobType['status'], progress: number) => {
    const colorKey = status.toLowerCase();
    switch (colorKey) {
      case 'completed':
        return 'bg-green-500 dark:bg-green-600';
      case 'active':
        return 'bg-yellow-500 dark:bg-yellow-600';
       case 'waiting':
        return 'bg-blue-500 dark:bg-blue-600';
      case 'delayed':
        return 'bg-purple-500 dark:bg-purple-600';
      case 'failed':
        return 'bg-red-500 dark:bg-red-600';
      case 'paused':
        return 'bg-gray-500 dark:bg-gray-600';
      case 'stuck':
         return 'bg-pink-500 dark:bg-pink-600';
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
              {Object.entries(JOB_STATUS).map(([key, value]) => (
                <option key={value} value={value}>{key.charAt(0) + key.slice(1).toLowerCase()}</option>
              ))}
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
                        Started@
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Duration
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {jobs.map((job, index) => (
                      <tr key={job.id} ref={index === jobs.length - 1 ? lastJobElementRef : null}>
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
                          {formatDate(job.timestamp.started)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDuration(job.duration)}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex justify-center space-x-2">
                            <Link
                              to={`/jobs/edit/${job.id}`}
                              className="p-1 text-blue-600 bg-blue-100 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/50"
                              title="Edit"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            
                            <button
                              className="p-1 text-red-600 bg-red-100 rounded hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50"
                              title="Delete"
                              onClick={() => handleDeleteJob(job.id)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                            
                            {(job.status === 'active' || job.status === 'delayed' || job.status === 'paused' || job.status === 'waiting') ? (
                              <button
                                onClick={() => handleCancelJob(job.id)}
                                className="p-1 text-red-600 bg-red-100 rounded hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50"
                                title="Cancel"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            ) : null}
                            
                            {job.status === 'failed' ? (
                              <button
                                onClick={() => handleRetryJob(job.id)}
                                className="p-1 text-green-600 bg-green-100 rounded hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/50"
                                title="Retry"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
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
          
          {isLoading && (
            <div className="flex items-center justify-center p-6">
              <div className="text-lg">Loading more jobs...</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}