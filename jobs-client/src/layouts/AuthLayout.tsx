import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left side - Branding/Info */}
      <div className="hidden w-1/2 bg-blue-600 lg:block">
        <div className="flex flex-col items-center justify-center h-full p-12 text-white">
          <div className="max-w-md mx-auto">
            <h1 className="mb-6 text-4xl font-bold">JobRunner</h1>
            <p className="mb-8 text-xl">
              The modern job processing platform for developers.
            </p>
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 mt-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold">Reliable Job Processing</h3>
                  <p className="text-blue-200">
                    Process background jobs with guaranteed delivery and automatic retries.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 mt-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold">Real-time Monitoring</h3>
                  <p className="text-blue-200">
                    Track job progress and status in real-time with detailed insights.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 mt-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold">Flexible Scheduling</h3>
                  <p className="text-blue-200">
                    Schedule jobs with cron expressions or specific dates and times.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="w-full lg:w-1/2">
        <div className="flex items-center justify-center min-h-screen p-6">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:hidden">
              <h1 className="text-3xl font-bold text-blue-600">JobRunner</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                The modern job processing platform
              </p>
            </div>
            
            {/* Auth form will be rendered here via Outlet */}
            <Outlet />
            
            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} JobRunner. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}