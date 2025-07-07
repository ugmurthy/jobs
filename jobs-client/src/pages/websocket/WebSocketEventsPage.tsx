import { useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import { WebSocketEvent } from '@/features/websocket/websocketSlice';

export default function WebSocketEventsPage() {
  const { connected, error, events } = useAppSelector((state) => state.websocket);
  const [filter, setFilter] = useState<string>('all');
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());

  const toggleEventExpansion = (index: number) => {
    const newExpandedEvents = new Set(expandedEvents);
    if (expandedEvents.has(index)) {
      newExpandedEvents.delete(index);
    } else {
      newExpandedEvents.add(index);
    }
    setExpandedEvents(newExpandedEvents);
  };

  const getEventTypeColor = (type: string) => {
    if (type.startsWith('job:')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    } else if (type.startsWith('webhook:')) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    } else if (type.startsWith('system:')) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    } else {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'job') return event.type.startsWith('job:');
    if (filter === 'webhook') return event.type.startsWith('webhook:');
    if (filter === 'system') return event.type.startsWith('system:');
    return true;
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="container p-6 mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">WebSocket Events</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Real-time events from the server
        </p>
      </div>

      {/* Connection Status */}
      <div className="mb-6">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="font-medium">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {error && (
          <div className="mt-2 text-sm text-red-600 dark:text-red-400">
            Error: {error}
          </div>
        )}
      </div>

      {/* Event Filters */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'all'
                ? 'bg-blue-600 text-white dark:bg-blue-700'
                : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setFilter('job')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'job'
                ? 'bg-blue-600 text-white dark:bg-blue-700'
                : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            Job Events
          </button>
          <button
            onClick={() => setFilter('webhook')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'webhook'
                ? 'bg-blue-600 text-white dark:bg-blue-700'
                : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            Webhook Events
          </button>
          <button
            onClick={() => setFilter('system')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'system'
                ? 'bg-blue-600 text-white dark:bg-blue-700'
                : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}
          >
            System Events
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-lg shadow dark:bg-gray-800">
        {filteredEvents.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No events received yet. Events will appear here in real-time as they occur.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredEvents.map((event, index) => (
              <li key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex justify-between cursor-pointer" onClick={() => toggleEventExpansion(index)}>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-3 ${getEventTypeColor(event.type)}`}>
                      {event.type}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  <div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        expandedEvents.has(index) ? 'transform rotate-180' : ''
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                
                {expandedEvents.has(index) && (
                  <div className="mt-3 p-3 bg-gray-100 rounded dark:bg-gray-700">
                    <pre className="text-xs overflow-auto whitespace-pre-wrap">
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}