import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { removeToast, addToast, Toast } from '@/features/ui/uiSlice';
import { cn } from '@/lib/utils';

export function ToastProvider() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.ui.toasts);

  // Auto-dismiss toasts after their duration
  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) => {
      return setTimeout(() => {
        dispatch(removeToast(toast.id));
      }, toast.duration || 5000);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 m-4 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => dispatch(removeToast(toast.id))} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  return (
    <div
      className={cn(
        'animate-in slide-in-from-right-5 fade-in-0 duration-300',
        'flex w-80 items-start gap-3 rounded-md border bg-background p-4 shadow-md',
        toast.type === 'success' && 'border-green-500 bg-green-50 dark:bg-green-950/30',
        toast.type === 'error' && 'border-red-500 bg-red-50 dark:bg-red-950/30',
        toast.type === 'warning' && 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30',
        toast.type === 'info' && 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
      )}
      role="alert"
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {toast.type === 'success' && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-green-500"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        )}
        {toast.type === 'error' && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-red-500"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        )}
        {toast.type === 'warning' && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-yellow-500"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        )}
        {toast.type === 'info' && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-blue-500"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        {toast.title && <h3 className="font-medium">{toast.title}</h3>}
        {toast.message && <p className="text-sm text-muted-foreground">{toast.message}</p>}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        <span className="sr-only">Close</span>
      </button>
    </div>
  );
}

// Helper hook to show toasts
export function useToast() {
  const dispatch = useAppDispatch();

  const showToast = (toast: Omit<Toast, 'id'>) => {
    dispatch(addToast(toast));
  };

  const closeToast = (id: string) => {
    dispatch(removeToast(id));
  };

  return {
    toast: showToast,
    closeToast,
  };
}