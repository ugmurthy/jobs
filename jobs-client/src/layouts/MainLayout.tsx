import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';

export default function MainLayout() {
  const location = useLocation();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  // Check if the current route is an auth route
  const isAuthRoute = location.pathname.startsWith('/auth');
  
  // If user is not authenticated and not on an auth route, they should be redirected to login
  // This redirection would typically be handled by a protected route component
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {!isAuthRoute && (
        <header className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="container flex items-center justify-between h-16 px-4 mx-auto sm:px-6 lg:px-8">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">JobRunner</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="relative">
                    <button className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                      <span className="mr-1">{user?.username || 'User'}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {/* Dropdown menu would go here */}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/auth/login"
                    className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/auth/register"
                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
      )}
      
      <main className="flex-1">
        <Outlet />
      </main>
      
      {!isAuthRoute && (
        <footer className="py-4 bg-white border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="container px-4 mx-auto sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between space-y-2 sm:flex-row sm:space-y-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                &copy; {new Date().getFullYear()} JobRunner. All rights reserved.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Terms of Service
                </a>
                <a
                  href="#"
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}