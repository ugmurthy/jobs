import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setApiKey } from '@/features/auth/authSlice';
import { useToast } from '@/components/ui/use-toast';

interface LocationState {
  from?: {
    pathname: string;
  };
}

export default function ApiKeyLoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isLoading } = useAppSelector((state) => state.auth);
  
  const [apiKey, setApiKeyValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const locationState = location.state as LocationState;
  const from = locationState?.from?.pathname || '/dashboard';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('API key login form submitted');
      
      const result = await dispatch(setApiKey(apiKey)).unwrap();
      console.log('API key login dispatch result:', result);
      
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('API key login error caught in component:', err);
      toast({
        title: 'Login Failed',
        description: err.message || 'Failed to login with API key. Please check your API key.',
        variant: 'destructive',
      });
      setError(err.message || 'Failed to login with API key');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">Login with API Key</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Enter your API key to authenticate and access your account.
        </p>
      </div>
      
      {error && (
        <div className="p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="apiKey" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            API Key
          </label>
          <input
            id="apiKey"
            type="text"
            value={apiKey}
            onChange={(e) => setApiKeyValue(e.target.value)}
            className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
            placeholder="Enter your API key"
            disabled={isLoading || isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Your API key can be found in the API Keys section of your account.
          </p>
        </div>
        
        <div>
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || isSubmitting}
          >
            {isLoading || isSubmitting ? 'Logging in...' : 'Log in with API Key'}
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
              Or
            </span>
          </div>
        </div>
        
        <div className="mt-6">
          <Link
            to="/auth/login"
            className="flex justify-center w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Login with Username and Password
          </Link>
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