/**
 * JobsPage Component
 *
 * Displays a list of jobs with filtering and infinite scrolling.
 *
 * Features:
 * - Filter jobs by status, search term, and sort order
 * - Infinite scrolling to load more jobs as the user scrolls down
 * - Real-time job status updates
 */

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
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
  setPage,
  setQueueName
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
  const { queueName } = useParams<{ queueName: string }>();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<UIJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_totalJobs, setTotalJobs] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef<IntersectionObserver>();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [anchorJobId, setAnchorJobId] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Subscribe to the jobs state in Redux to get real-time updates
  const reduxJobs = useAppSelector((state) => state.jobs.jobs);
  
  // Initialize filter state
  const [filter, setFilter] = useState<JobsFilter>({
    status: 'all',
    search: '',
    page: 1,
    limit: 10,
    sortBy: 'timestamp.created',
    sortOrder: 'desc',
  });
  
  // Log initial state for debugging
  useEffect(() => {
    console.log('JobsPage initialized with filter:', filter);
  }, []);
  
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

  // Effect to fetch jobs when filter changes (except page changes which are handled by the IntersectionObserver)
  useEffect(() => {
    if (!queueName) {
      console.log('No queue name provided, skipping fetch');
      return;
    }
    
    console.log('Filter changed, fetching jobs for queue:', queueName);
    
    // Set queue name in Redux
    dispatch(setQueueName(queueName));
    
    // Only fetch jobs when filters change (not when page changes)
    // Page changes are handled by the IntersectionObserver
    const fetchJobsList = async () => {
      console.log('Starting to fetch jobs');
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching initial jobs with filters:', {
          status: filter.status,
          search: filter.search,
          sortBy: filter.sortBy,
          sortOrder: filter.sortOrder,
          page: 1
        });
        
        // Fetch jobs for page 1
        const result = await dispatch(fetchJobs({queueName})).unwrap();
        
        console.log('Initial jobs fetch result:', {
          jobsCount: result.jobs.length,
          totalItems: result.pagination.totalItems,
          totalPages: result.pagination.totalPages
        });
        
        // Map API jobs to UI jobs
        const mappedJobs = result.jobs.map(mapApiJobToUiJob);
        console.log(`Mapped ${mappedJobs.length} jobs to UI format`);
        
        // Update state
        setJobs(mappedJobs);
        setTotalJobs(result.pagination.totalItems);
        
        // Check if there are more pages
        const hasMorePages = result.pagination.page < result.pagination.totalPages;
        console.log(`Has more pages: ${hasMorePages}`);
        setHasMore(hasMorePages);
        
        // Reset page to 1 in filter state
        if (filter.page !== 1) {
          console.log('Resetting page to 1 in filter state');
          setFilter(prev => ({ ...prev, page: 1 }));
        }
      } catch (err: any) {
        console.error('Failed to fetch jobs', err);
        setError(err.message || 'Failed to fetch jobs');
      } finally {
        console.log('Finished fetching initial jobs');
        setIsLoading(false);
      }
    };
    
    fetchJobsList();
  }, [dispatch, filter.status, filter.search, filter.sortBy, filter.sortOrder, queueName]);

  // Simple callback ref for the last job element in the list
  const lastJobElementRef = useCallback((node: any) => {
    // Skip if already loading or no more jobs
    if (isLoading || !hasMore) {
      console.log('Skipping observer setup:', { isLoading, hasMore });
      return;
    }
    
    // Clean up previous observer
    if (observer.current) {
      console.log('Disconnecting previous observer');
      observer.current.disconnect();
    }
    
    console.log('Setting up new IntersectionObserver');
    
    // Create new observer with simpler configuration
    observer.current = new IntersectionObserver((entries) => {
      console.log('IntersectionObserver callback triggered', {
        isIntersecting: entries[0].isIntersecting,
        hasMore,
        isLoading,
        currentPage: filter.page
      });
      
      // Only proceed if the element is intersecting (visible)
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        console.log('Last job element is visible, loading more jobs');
        
        // Set an anchor job ID (use a job that's a few positions above the last one)
        const anchorIndex = Math.max(0, jobs.length - 5); // 5 jobs above the last one
        const anchorJob = jobs[anchorIndex];
        if (anchorJob) {
          console.log('Setting anchor job ID:', anchorJob.id);
          setAnchorJobId(anchorJob.id);
        }
        
        // Load more jobs
        const nextPage = filter.page + 1;
        console.log(`Loading page ${nextPage}`);
        
        // Update page in filter state
        setFilter(prev => ({ ...prev, page: nextPage }));
        
        // Update Redux state
        dispatch(setPage(nextPage));
        
        // Set loading states
        setIsLoading(true);
        setIsLoadingMore(true);
        
        // Fetch more jobs
        dispatch(fetchJobs({ queueName: queueName!, append: true }))
          .unwrap()
          .then(result => {
            console.log(`Loaded ${result.jobs.length} more jobs`, {
              currentPage: result.pagination.page,
              totalPages: result.pagination.totalPages,
              totalItems: result.pagination.totalItems
            });
            
            // Add new jobs to existing list
            setJobs(prevJobs => {
              const newJobs = [...prevJobs, ...result.jobs.map(mapApiJobToUiJob)];
              console.log(`Total jobs in state: ${newJobs.length}`);
              return newJobs;
            });
            
            // Update hasMore flag
            const hasMorePages = result.pagination.page < result.pagination.totalPages;
            console.log(`Has more pages: ${hasMorePages}`);
            setHasMore(hasMorePages);
            
            // Update total jobs count
            setTotalJobs(result.pagination.totalItems);
          })
          .catch(err => {
            console.error('Failed to load more jobs', err);
            setError(err.message || 'Failed to load more jobs');
          })
          .finally(() => {
            console.log('Finished loading more jobs');
            setIsLoading(false);
            // Keep isLoadingMore true until the effect scrolls to the anchor
          });
      }
    }, {
      // Trigger earlier for better UX
      rootMargin: '200px',
      threshold: 0.1
    });
    
    // Start observing the node
    if (node) {
      console.log('Starting to observe last job element');
      observer.current.observe(node);
    } else {
      console.warn('No node to observe');
    }
    
    // Clean up on unmount
    return () => {
      if (observer.current) {
        console.log('Cleaning up observer on unmount');
        observer.current.disconnect();
      }
    };
  }, [isLoading, hasMore, filter.page, dispatch, queueName]);
  
  // Effect to scroll to anchor job after loading more jobs
  useEffect(() => {
    if (isLoadingMore && !isLoading && anchorJobId) {
      console.log('Scrolling to anchor job:', anchorJobId);
      
      // Find the anchor job element
      const anchorElement = document.getElementById(`job-row-${anchorJobId}`);
      if (anchorElement) {
        console.log('Found anchor element, scrolling to it');
        anchorElement.scrollIntoView({ behavior: 'auto', block: 'center' });
        
        // Reset loading more state
        setIsLoadingMore(false);
        setAnchorJobId(null);
      } else {
        console.warn('Anchor element not found');
        setIsLoadingMore(false);
      }
    }
  }, [isLoadingMore, isLoading, anchorJobId]);

  // Effect to update UI jobs when Redux jobs state changes (for real-time updates)
  useEffect(() => {
    if (reduxJobs.length > 0 && jobs.length > 0) {
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
  
  /**
   * Handle changes to filter values (status, search, sort, page)
   *
   * When changing any filter except page:
   * - Reset to page 1
   * - Clear the jobs list to start fresh
   * - Update the filter state
   *
   * @param key - The filter property to change
   * @param value - The new value for the filter
   */
  const handleFilterChange = (key: keyof JobsFilter, value: any) => {
    console.log(`Filter changed: ${key} = ${value}`);
    
    if (key !== 'page') {
      // When changing any filter except page, reset to page 1 and clear jobs
      console.log('Resetting jobs list and setting page to 1');
      
      // Update Redux state
      dispatch(setStatusFilter(key === 'status' ? (value !== 'all' ? value : null) : (filter.status !== 'all' ? filter.status : null)));
      dispatch(setSearchFilter(key === 'search' ? value || null : filter.search || null));
      dispatch(setSortBy(key === 'sortBy' ? value : filter.sortBy));
      dispatch(setSortDirection(key === 'sortOrder' ? value as 'asc' | 'desc' : filter.sortOrder as 'asc' | 'desc'));
      dispatch(setPage(1));
      
      // Reset jobs and update filter
      setJobs([]);
      setFilter({ ...filter, [key]: value, page: 1 });
    }
  };
  
  const handleCancelJob = async (jobId: string) => {
    if(!queueName) return;
    try {
      // Use the actual cancelJob action
      await dispatch(cancelJob({queueName, jobId})).unwrap();
      
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
    if(!queueName) return;
    try {
      // Use the actual retryJob action
      await dispatch(retryJob({queueName, jobId})).unwrap();
      
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
    if(!queueName) return;
    try {
      await dispatch(deleteJob({queueName, jobId})).unwrap();
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
  
  const getProgressColor = (status: JobType['status'], _progress: number) => {
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
  
  // Helper to get nested properties for sorting
  const getNested = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const sortedJobs = useMemo(() => {
    return [...jobs].sort((a, b) => {
      // Sort based on selected filter
      const aValue = getNested(a, filter.sortBy);
      const bValue = getNested(b, filter.sortBy);

      let comparison = 0;
      if (aValue > bValue) {
        comparison = 1;
      } else if (aValue < bValue) {
        comparison = -1;
      }

      return filter.sortOrder === 'desc' ? comparison * -1 : comparison;
    });
  }, [jobs, filter.sortBy, filter.sortOrder]);
  
  return (
    <div className="container p-6 mx-auto">
      <div className="flex flex-col items-start justify-between mb-6 md:flex-row md:items-center">
        <h1 className="mb-4 text-3xl font-bold md:mb-0">Jobs for {queueName}</h1>
        <div className="flex items-center space-x-4">
        {queueName !== 'webhooks' && (
          <Link
            to={`/queues/${queueName}/new`}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create New Job
          </Link>
        )}
        </div>
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
              <option value="id">ID</option>
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
                    {sortedJobs.map((job, index) => (
                      <tr
                        key={job.id}
                        id={`job-row-${job.id}`}
                        ref={index === jobs.length - 1 ? lastJobElementRef : null}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            to={`/queues/${queueName}/${job.id}`}
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