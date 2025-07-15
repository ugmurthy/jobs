import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { store } from '@/app/store';
import { login } from '@/features/auth/authSlice';
import { useToast } from '@/components/ui/use-toast';
import { loginSchema } from '@/lib/validation';
import { useValidatedForm } from '@/lib/form-validation';

interface LocationState {
  from?: {
    pathname: string;
  };
}

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isLoading } = useAppSelector((state) => state.auth);
  
  const [rememberMe, setRememberMe] = useState(false);
  
  const locationState = location.state as LocationState;
  const from = locationState?.from?.pathname || '/dashboard';
  
  const {
    register,
    handleSubmit,
    formState,
    error,
    setError,
    isSubmitting
  } = useValidatedForm(loginSchema, async (data) => {
    try {
      console.log('Login form submitted with data:', { username: data.username, password: '[REDACTED]' });
      
      const result = await dispatch(login({ username: data.username, password: data.password })).unwrap();
      console.log('Login dispatch result:', result);
      
      // Check auth state after login
      const authState = store.getState().auth;
      console.log('Auth state after login:', {
        isAuthenticated: authState.isAuthenticated,
        hasToken: !!authState.token,
        hasUser: !!authState.user
      });
      
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error caught in component:', err);
      toast({
        title: 'Login Failed',
        description: err.message || 'Failed to login. Please check your credentials.',
        variant: 'destructive',
      });
      setError(err.message || 'Failed to login');
    }
  });
  
  const handleApiKeyLogin = () => {
    navigate('/auth/api-key');
  };
  
  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Log in to your account</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Welcome back! Please enter your credentials to access your account.
        </p>
      </div>
      
      {error && (
        <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Username
          </label>
          <input
            id="username"
            type="text"
            {...register('username')}
            className={`w-full px-3 py-2 border ${formState.errors?.username ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
            placeholder="Enter your username"
            disabled={isLoading || isSubmitting}
          />
          {formState.errors?.username && (
            <p className="mt-1 text-sm text-red-600">{formState.errors?.username?.message}</p>
          )}
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <Link
              to="/auth/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            {...register('password')}
            className={`w-full px-3 py-2 border ${formState.errors?.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
            placeholder="Enter your password"
            disabled={isLoading || isSubmitting}
          />
          {formState.errors?.password && (
            <p className="mt-1 text-sm text-red-600">{formState.errors?.password?.message}</p>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              disabled={isLoading}
            />
            <label htmlFor="remember-me" className="block ml-2 text-sm text-gray-700 dark:text-gray-300">
              Remember me
            </label>
          </div>
        </div>
        
        <div>
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || isSubmitting}
          >
            {isLoading || isSubmitting ? 'Logging in...' : 'Log in'}
          </button>
        </div>
      </form>
      
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-400">
              Or continue with
            </span>
          </div>
        </div>
        
        <div className="mt-6">
          <button
            type="button"
            onClick={handleApiKeyLogin}
            className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            disabled={isLoading}
          >
            API Key
          </button>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link
            to="/auth/register"
            className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}