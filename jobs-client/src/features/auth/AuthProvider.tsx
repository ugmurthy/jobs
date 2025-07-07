import { ReactNode, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchCurrentUser } from './authSlice';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();
  const { token, apiKey, isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Debug: Log auth state on mount and when it changes
  useEffect(() => {
    console.log('AuthProvider - Auth State:', {
      token: token ? `${token.substring(0, 10)}...` : null,
      apiKey: apiKey ? 'Present' : null,
      isAuthenticated,
      hasUser: !!user,
      localStorage: {
        token: localStorage.getItem('token') ? 'Present' : null,
        apiKey: localStorage.getItem('apiKey') ? 'Present' : null
      }
    });
  }, [token, apiKey, isAuthenticated, user]);

  useEffect(() => {
    // If we have a token or API key but no user data, fetch the current user
    if ((token || apiKey) && isAuthenticated) {
      console.log('AuthProvider - Fetching current user');
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token, apiKey, isAuthenticated]);

  return <>{children}</>;
}