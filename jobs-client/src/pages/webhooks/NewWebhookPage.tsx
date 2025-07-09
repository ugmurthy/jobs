import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { createWebhook } from '@/features/webhooks/webhooksSlice';
import { webhookSchema, WebhookFormValues } from '@/lib/validation';
import { useToast } from '@/components/ui/use-toast';
import { useValidatedForm, getFieldError, hasFieldError } from '@/lib/form-validation';

// Available webhook events
const AVAILABLE_EVENTS = [
  { id: 'job.created', name: 'Job Created', description: 'Triggered when a new job is created' },
  { id: 'job.started', name: 'Job Started', description: 'Triggered when a job becomes active' },
  { id: 'job.completed', name: 'Job Completed', description: 'Triggered when a job completes successfully' },
  { id: 'job.failed', name: 'Job Failed', description: 'Triggered when a job fails' },
  { id: 'job.progress', name: 'Job Progress', description: 'Triggered when a job reports progress' },
];

export default function NewWebhookPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['job.completed']);
  
  // Initialize form with useValidatedForm hook
  const {
    register,
    handleSubmit,
    formState,
    error,
    setError,
    isSubmitting
  } = useValidatedForm(webhookSchema, async (data: WebhookFormValues) => {
    try {
      // Create webhook with validated data
      const result = await dispatch(createWebhook({
        url: data.url,
        events: selectedEvents,
        active: data.active,
        description: data.description,
      })).unwrap();

      toast({
        title: 'Webhook Created',
        description: `Webhook for ${data.url} has been created successfully`,
      });

      // Navigate back to webhooks page
      navigate('/webhooks');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to create webhook',
        variant: 'destructive',
      });
      setError(err.message || 'Failed to create webhook');
    }
  }, {
    defaultValues: {
      url: '',
      active: true,
      description: '',
    }
  });

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev => {
      if (prev.includes(eventId)) {
        return prev.filter(id => id !== eventId);
      } else {
        return [...prev, eventId];
      }
    });
  };

  return (
    <div className="container p-6 mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Webhook</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Set up a webhook to receive real-time notifications when events occur
        </p>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800 max-w-2xl">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Webhook Details</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter the details for the webhook you want to create
          </p>
        </div>
        
        {error && (
          <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="url" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Webhook URL
            </label>
            <input
              id="url"
              type="text"
              {...register('url')}
              className={`w-full px-3 py-2 border ${hasFieldError(formState, 'url') ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
              placeholder="https://example.com/webhook"
              disabled={isSubmitting}
            />
            {hasFieldError(formState, 'url') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError(formState, 'url')}</p>
            )}
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Events
            </label>
            <div className="space-y-2">
              {AVAILABLE_EVENTS.map((event) => (
                <div key={event.id} className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id={`event-${event.id}`}
                      type="checkbox"
                      checked={selectedEvents.includes(event.id)}
                      onChange={() => toggleEvent(event.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor={`event-${event.id}`} className="font-medium text-gray-700 dark:text-gray-300">
                      {event.name}
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {selectedEvents.length === 0 && (
              <p className="mt-1 text-sm text-red-600">At least one event must be selected</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Description (Optional)
            </label>
            <textarea
              id="description"
              {...register('description')}
              className={`w-full px-3 py-2 border ${hasFieldError(formState, 'description') ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
              placeholder="Enter a description for this webhook"
              rows={3}
              disabled={isSubmitting}
            />
            {hasFieldError(formState, 'description') && (
              <p className="mt-1 text-sm text-red-600">{getFieldError(formState, 'description')}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              id="active"
              type="checkbox"
              {...register('active')}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              disabled={isSubmitting}
            />
            <label htmlFor="active" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable webhook immediately
            </label>
          </div>

          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/webhooks')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || selectedEvents.length === 0}
            >
              {isSubmitting ? 'Creating...' : 'Create Webhook'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">Webhook Information</h2>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Webhooks allow you to receive real-time notifications when events occur in your JobRunner account.
          When an event occurs, we'll send an HTTP POST request to the URL you specify with a JSON payload
          containing information about the event.
        </p>
        
        <h3 className="mt-4 mb-2 text-lg font-medium">Security Recommendations</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
          <li>Use HTTPS URLs to ensure data is encrypted in transit</li>
          <li>Implement authentication for your webhook endpoint</li>
          <li>Verify the webhook signature in the request headers</li>
          <li>Respond quickly to webhook requests (within 5 seconds)</li>
        </ul>
      </div>
    </div>
  );
}