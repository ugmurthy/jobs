import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { closeModal, openModal as openModalAction, Modal } from '@/features/ui/uiSlice';
import { cn } from '@/lib/utils';

export function ModalProvider() {
  const dispatch = useAppDispatch();
  const modals = useAppSelector((state) => state.ui.modals);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modals.length > 0) {
        dispatch(closeModal(modals[modals.length - 1].id));
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [modals, dispatch]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (modals.length > 0) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [modals.length]);

  if (modals.length === 0) return null;

  return (
    <>
      {modals.map((modal) => (
        <div
          key={modal.id}
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => modal.showCancel !== false && dispatch(closeModal(modal.id))}
          />

          {/* Modal */}
          <div
            className={cn(
              'relative z-50 flex flex-col rounded-lg border bg-background shadow-lg',
              'max-h-[85vh] animate-in fade-in-0 zoom-in-95 duration-200',
              modal.size === 'sm' && 'w-full max-w-sm',
              modal.size === 'md' && 'w-full max-w-md',
              modal.size === 'lg' && 'w-full max-w-lg',
              modal.size === 'xl' && 'w-full max-w-xl',
              modal.size === 'full' && 'w-full max-w-[90vw] h-[85vh]',
              !modal.size && 'w-full max-w-md'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-lg font-semibold">{modal.title}</h2>
              {modal.showCancel !== false && (
                <button
                  onClick={() => dispatch(closeModal(modal.id))}
                  className="rounded-md p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  <span className="sr-only">Close</span>
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {typeof modal.content === 'function'
                ? modal.content()
                : modal.content}
            </div>

            {/* Footer */}
            {(modal.onConfirm || modal.onCancel || modal.showCancel !== false) && (
              <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
                {modal.showCancel !== false && (
                  <button
                    onClick={() => {
                      if (modal.onCancel) modal.onCancel();
                      dispatch(closeModal(modal.id));
                    }}
                    className="rounded-md border px-4 py-2 text-sm font-medium shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {modal.cancelText || 'Cancel'}
                  </button>
                )}
                {modal.onConfirm && (
                  <button
                    onClick={() => {
                      modal.onConfirm?.();
                      dispatch(closeModal(modal.id));
                    }}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {modal.confirmText || 'Confirm'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

// Helper function to show modals
export function useModal() {
  const dispatch = useAppDispatch();

  const openModal = (modalProps: Omit<Modal, 'id'>) => {
    dispatch(openModalAction(modalProps));
  };

  const closeModalById = (id: string) => {
    dispatch(closeModal(id));
  };

  return {
    openModal,
    closeModal: closeModalById,
  };
}