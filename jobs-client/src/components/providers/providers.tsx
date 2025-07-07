import { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';
import { ToastProvider } from './toast-provider';
import { ModalProvider } from './modal-provider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <>
        {children}
        <ToastProvider />
        <ModalProvider />
      </>
    </ThemeProvider>
  );
}