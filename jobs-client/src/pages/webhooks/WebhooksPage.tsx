import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { useNavigate } from 'react-router-dom';
// Import actions when implemented
// import { fetchWebhooks } from '@/features/webhooks/webhooksSlice';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  deliveryStats?: {
    total: number;
    success: number;
    failed: number;
  };
}

export default function WebhooksPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWebhooksList = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // When implemented, use the actual action
        // const result = await dispatch(fetchWebhooks()).unwrap();
        // setWebhooks(result.webhooks);
        
        // Mock data for now
        setTimeout(() => {
          setWebhooks([
            {
              id: '1',
              url: 'https://example.com/webhook1',
              events: ['job.completed', 'job.failed'],
              enabled: true,
              createdAt: '2025-05-01T10:30:00Z',
              updatedAt: '2025-05-07T00:01:00Z',
              deliveryStats: {
                total: 120,
                success: 118,
                failed: 2,
              },
            },
            {
              id: '2',
              url: 'https://example.org/webhook2',
              events: ['job.created', 'job.completed', 'job.failed'],
              enabled: true,
              createdAt: '2025-05-02T11:15:00Z',
              updatedAt: '2025-05-05T09:30:00Z',
              deliveryStats: {
                total: 85,
                success: 85,
                failed: 0,
              },
            },
            {
              id: '3',
              url: 'https://example.net/webhook3',
              events: ['job.created'],
              enabled: false,
              createdAt: '2025-05-06T14:20:00Z',
              updatedAt: '2025-05-06T14:20:00Z',
              deliveryStats: {
                total: 10,
                success: 8,
                failed: 2,
              },
            },
          ]);
          setIsLoading(false);
        }, 1000);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch webhooks');
        setIsLoading(false);
      }
    };

    fetchWebhooksList();
  }, [dispatch]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const toggleWebhook = (id: string, currentStatus: boolean) => {
    // When implemented, use the actual action
    // dispatch(toggleWebhookStatus({ id, enabled: !currentStatus }));
    
    // For now, just update the local state
    setWebhooks(
      webhooks.map((webhook) =>
        webhook.id === id
          ? { ...webhook, enabled: !currentStatus }
          : webhook
      )
    );
  };

  const getSuccessRate = (webhook: Webhook) => {
    if (!webhook.deliveryStats || webhook.deliveryStats.total === 0) {
      return 'N/A';
    }
    
    const rate = (webhook.deliveryStats.success / webhook.deliveryStats.total) * 100;
    return `${rate.toFixed(1)}%`;
  };

  return (
    <div className="container p-6 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Webhooks</h1>
        <button
          onClick={() => navigate('/webhooks/new')}
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Create New Webhook
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading webhooks...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {webhooks.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-400">No webhooks found</p>
            </div>
          ) : (
            webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-4 md:mb-0">
                    <h2 className="text-xl font-semibold break-all">{webhook.url}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Created: {formatDate(webhook.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleWebhook(webhook.id, webhook.enabled)}
                      className={`px-3 py-1 text-sm rounded ${
                        webhook.enabled
                          ? 'text-red-600 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50'
                          : 'text-green-600 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/50'
                      }`}
                    >
                      {webhook.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button className="px-3 py-1 text-sm text-blue-600 bg-blue-100 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/50">
                      Edit
                    </button>
                    <button className="px-3 py-1 text-sm text-blue-600 bg-blue-100 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/50">
                      View Deliveries
                    </button>
                    <button className="px-3 py-1 text-sm text-red-600 bg-red-100 rounded hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/50">
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Events
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {webhook.events.map((event) => (
                        <span
                          key={event}
                          className="px-2 py-1 text-xs font-medium bg-gray-100 rounded-full dark:bg-gray-700"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          webhook.enabled
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                        }`}
                      >
                        {webhook.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      {webhook.deliveryStats && (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            webhook.deliveryStats.failed === 0
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          }`}
                        >
                          Success Rate: {getSuccessRate(webhook)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {webhook.deliveryStats && (
                  <div className="mt-4">
                    <h3 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Delivery Stats
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-gray-100 rounded-md dark:bg-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                        <p className="text-lg font-semibold">{webhook.deliveryStats.total}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-md dark:bg-green-900/30">
                        <p className="text-sm text-green-800 dark:text-green-300">Success</p>
                        <p className="text-lg font-semibold text-green-800 dark:text-green-300">
                          {webhook.deliveryStats.success}
                        </p>
                      </div>
                      <div className="p-3 bg-red-100 rounded-md dark:bg-red-900/30">
                        <p className="text-sm text-red-800 dark:text-red-300">Failed</p>
                        <p className="text-lg font-semibold text-red-800 dark:text-red-300">
                          {webhook.deliveryStats.failed}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <div className="mt-8 p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">Webhook Information</h2>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Webhooks allow you to receive real-time notifications when events occur in your JobRunner account.
        </p>
        <h3 className="mt-4 mb-2 text-lg font-medium">Available Events</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-3 bg-gray-100 rounded-md dark:bg-gray-700">
            <p className="font-medium">job.created</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Triggered when a new job is created
            </p>
          </div>
          <div className="p-3 bg-gray-100 rounded-md dark:bg-gray-700">
            <p className="font-medium">job.started</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Triggered when a job becomes active
            </p>
          </div>
          <div className="p-3 bg-gray-100 rounded-md dark:bg-gray-700">
            <p className="font-medium">job.completed</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Triggered when a job completes successfully
            </p>
          </div>
          <div className="p-3 bg-gray-100 rounded-md dark:bg-gray-700">
            <p className="font-medium">job.failed</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Triggered when a job fails
            </p>
          </div>
          <div className="p-3 bg-gray-100 rounded-md dark:bg-gray-700">
            <p className="font-medium">job.progress</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Triggered when a job reports progress
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}