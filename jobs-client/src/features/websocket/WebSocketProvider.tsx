import { ReactNode, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { initializeSocket, closeSocket, getSocket } from '@/lib/socket';
import { connecting, clearError } from '@/features/websocket/websocketSlice';
import { useToast } from '@/components/ui/use-toast';

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { isAuthenticated, token, apiKey } = useAppSelector((state) => state.auth);
  const { connected, error, reconnectAttempts } = useAppSelector((state) => state.websocket);
  
  // Handle reconnection
  const attemptReconnect = useCallback(() => {
    if (isAuthenticated && (token || apiKey) && !connected && reconnectAttempts < 5) {
      dispatch(connecting());
      dispatch(clearError());
      console.log(`WebSocketProvider - Attempting to reconnect (attempt ${reconnectAttempts + 1})`);
      initializeSocket();
    }
  }, [isAuthenticated, token, apiKey, connected, reconnectAttempts, dispatch]);
  
  // Initialize socket connection when authenticated
  useEffect(() => {
    // Only initialize if we have authentication
    if (isAuthenticated && (token || apiKey)) {
      console.log('WebSocketProvider - Initializing socket connection');
      dispatch(connecting());
      initializeSocket();
      
      // Cleanup on unmount
      return () => {
        console.log('WebSocketProvider - Closing socket connection');
        closeSocket();
      };
    }
  }, [isAuthenticated, token, apiKey, dispatch]);
  
  // Show toast notifications for connection status changes
  useEffect(() => {
    if (connected) {
      toast({
        title: "WebSocket Connected",
        description: "Real-time updates are now active",
        variant: "default",
      });
    }
  }, [connected, toast]);
  
  // Show error notifications
  useEffect(() => {
    if (error) {
      toast({
        title: "WebSocket Error",
        description: error,
        variant: "destructive",
      });
      
      // Set up reconnection attempt
      const timer = setTimeout(() => {
        attemptReconnect();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, attemptReconnect, toast]);

  return <>{children}</>;
}

export default WebSocketProvider;