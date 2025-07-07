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

// This interface represents the UI job model (different from API model in jobsSlice.ts)
interface UIJob {
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
  const [filter, setFilter] = useState<JobsFilter>({
    status: 'all',
    search: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  
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
        const mappedJobs = result.jobs.map(apiJob => {
          // Calculate duration if completedAt exists (assuming processingTime is in ms)
          let duration = undefined;
          if (apiJob.processingTime) {
            duration = Math.floor(apiJob.processingTime / 1000); // Convert ms to seconds
          }
          
          // Map API state to UI status
          let uiStatus: UIJob['status'] = 'pending';
          // Check if state exists, otherwise fall back to status for backward compatibility
          // Using type assertion since 'state' might not be in the interface but exists in the API response
          const apiState = (apiJob as any).state || apiJob.status;
          
          switch (apiState) {
            case 'waiting':
              uiStatus = 'pending';
              break;
            case 'active':
              uiStatus = 'running';
              break;
            case 'completed':
              uiStatus = 'completed';
              break;
            case 'failed':
              uiStatus = 'failed';
              break;
            case 'delayed':
              uiStatus = 'pending';
              break;
            default:
              uiStatus = 'pending';
          }
          
          // Determine startedAt (not directly available in API model)
          // If job is active or completed, we can assume it started at updatedAt
          const startedAt = apiState === 'active' || apiState === 'completed' || apiState === 'failed'
            ? apiJob.updatedAt
            : undefined;
          
          return {
            id: apiJob.id,
            name: apiJob.name,
            status: uiStatus,
            progress: apiJob.progress || 0,
            createdAt: apiJob.createdAt,
            startedAt: startedAt,
            completedAt: apiJob.completedAt || undefined,
            duration,
            result: apiJob.result,
            error: apiJob.error || apiJob.failedReason || undefined
          };
        });
        
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
  
  const handleFilterChange = (key: keyof JobsFilter, value: any) => {
    setFilter({ ...filter, [key]: value, page: key === 'page' ? value : 1 });
  };
  
  const handleCancelJob = async (jobId: string) => {
    try {
      // Use the actual cancelJob action
      await dispatch(cancelJob(jobId)).unwrap();
      
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
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
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
              <option value="createdAt">Created Date</option>
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
                                style={{ width: `${job.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {job.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(job.createdAt)}
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
                            
                            {job.status === 'pending' || job.status === 'running' ? (
                              <button
                                onClick={() => handleCancelJob(job.id)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Cancel
                              </button>
                            ) : null}
                            
                            {job.status === 'failed' || job.status === 'cancelled' ? (
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