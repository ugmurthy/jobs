import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-9xl font-extrabold text-gray-700 dark:text-gray-300">404</h1>
        
        <div className="mt-4 mb-8">
          <div className="h-1 w-16 bg-blue-600 mx-auto"></div>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">
          Page Not Found
        </h2>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          The page you are looking for might have been removed, had its name changed, 
          or is temporarily unavailable.
        </p>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
          <Link
            to="/"
            className="px-6 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go to Dashboard
          </Link>
          
          <Link
            to="/jobs"
            className="px-6 py-3 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            View Jobs
          </Link>
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}