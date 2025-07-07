import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/app/hooks';
// Import actions when implemented
// import { fetchApiKeys } from '@/features/api-keys/apiKeysSlice';

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsed: string | null;
  scopes: string[];
}

export default function ApiKeysPage() {
  const dispatch = useAppDispatch();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>([]);
  const [newKeyExpiration, setNewKeyExpiration] = useState<string>('never');
  const [newKeyCreated, setNewKeyCreated] = useState<{
    name: string;
    key: string;
    prefix: string;
  } | null>(null);

  useEffect(() => {
    const fetchApiKeysList = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // When implemented, use the actual action
        // const result = await dispatch(fetchApiKeys()).unwrap();
        // setApiKeys(result.apiKeys);
        
        // Mock data for now
        setTimeout(() => {
          setApiKeys([
            {
              id: '1',
              name: 'Production API Key',
              prefix: 'pk_live_123',
              createdAt: '2025-04-15T10:30:00Z',
              expiresAt: '2026-04-15T10:30:00Z',
              lastUsed: '2025-05-07T08:45:00Z',
              scopes: ['jobs:read', 'jobs:write', 'webhooks:read'],
            },
            {
              id: '2',
              name: 'Development API Key',
              prefix: 'pk_dev_456',
              createdAt: '2025-05-01T14:20:00Z',
              expiresAt: null,
              lastUsed: '2025-05-06T16:30:00Z',
              scopes: ['jobs:read', 'jobs:write', 'webhooks:read', 'webhooks:write'],
            },
            {
              id: '3',
              name: 'Testing API Key',
              prefix: 'pk_test_789',
              createdAt: '2025-05-05T09:15:00Z',
              expiresAt: null,
              lastUsed: null,
              scopes: ['jobs:read'],
            },
          ]);
          setIsLoading(false);
        }, 1000);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch API keys');
        setIsLoading(false);
      }
    };

    fetchApiKeysList();
  }, [dispatch]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const calculateTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return 'Never expires';
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 30) {
      const diffMonths = Math.floor(diffDays / 30);
      return `Expires in ${diffMonths} month${diffMonths !== 1 ? 's' : ''}`;
    }
    return `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };

  const handleCreateApiKey = () => {
    if (!newKeyName.trim()) {
      setError('API key name is required');
      return;
    }
    
    if (newKeyScopes.length === 0) {
      setError('At least one scope must be selected');
      return;
    }
    
    // When implemented, use the actual action
    // const result = await dispatch(createApiKey({
    //   name: newKeyName,
    //   scopes: newKeyScopes,
    //   expiresIn: newKeyExpiration === 'never' ? null : newKeyExpiration
    // })).unwrap();
    
    // Mock creating a new API key
    const mockNewKey = {
      name: newKeyName,
      key: 'pk_test_' + Math.random().toString(36).substring(2, 15),
      prefix: 'pk_test_' + Math.random().toString(36).substring(2, 7),
    };
    
    setNewKeyCreated(mockNewKey);
    
    // Add to the list
    const newApiKey: ApiKey = {
      id: Math.random().toString(),
      name: newKeyName,
      prefix: mockNewKey.prefix,
      createdAt: new Date().toISOString(),
      expiresAt: newKeyExpiration === 'never' ? null : 
                 new Date(Date.now() + parseInt(newKeyExpiration) * 24 * 60 * 60 * 1000).toISOString(),
      lastUsed: null,
      scopes: newKeyScopes,
    };
    
    setApiKeys([newApiKey, ...apiKeys]);
    setError(null);
  };

  const handleRevokeApiKey = (id: string) => {
    // When implemented, use the actual action
    // dispatch(revokeApiKey(id));
    
    // For now, just update the local state
    setApiKeys(apiKeys.filter(key => key.id !== id));
  };

  const handleScopeToggle = (scope: string) => {
    if (newKeyScopes.includes(scope)) {
      setNewKeyScopes(newKeyScopes.filter(s => s !== scope));
    } else {
      setNewKeyScopes([...newKeyScopes, scope]);
    }
  };

  const availableScopes = [
    { value: 'jobs:read', label: 'Read Jobs', description: 'View job details and status' },
    { value: 'jobs:write', label: 'Write Jobs', description: 'Create and manage jobs' },
    { value: 'webhooks:read', label: 'Read Webhooks', description: 'View webhook configurations' },
    { value: 'webhooks:write', label: 'Write Webhooks', description: 'Create and manage webhooks' },
    { value: 'scheduler:read', label: 'Read Scheduler', description: 'View scheduled jobs' },
    { value: 'scheduler:write', label: 'Write Scheduler', description: 'Create and manage scheduled jobs' },
  ];

  const expirationOptions = [
    { value: 'never', label: 'Never' },
    { value: '30', label: '30 days' },
    { value: '90', label: '90 days' },
    { value: '365', label: '1 year' },
  ];

  return (
    <div className="container p-6 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">API Keys</h1>
        {!showCreateForm && !newKeyCreated && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create New API Key
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 mb-6 text-red-700 bg-red-100 rounded-md dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {newKeyCreated && (
        <div className="p-6 mb-6 bg-green-100 border border-green-300 rounded-lg dark:bg-green-900/30 dark:border-green-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-green-800 dark:text-green-300">
              API Key Created: {newKeyCreated.name}
            </h2>
            <button
              onClick={() => setNewKeyCreated(null)}
              className="text-green-800 dark:text-green-300 hover:text-green-600"
            >
              ✕
            </button>
          </div>
          <p className="mb-2 text-green-800 dark:text-green-300">
            Your API key has been created. Please copy it now as you won't be able to see it again.
          </p>
          <div className="p-3 mb-4 font-mono text-sm bg-white border border-green-300 rounded dark:bg-gray-800 dark:border-green-700">
            {newKeyCreated.key}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(newKeyCreated.key);
              }}
              className="px-3 py-1 text-sm text-green-800 bg-green-200 rounded hover:bg-green-300 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700"
            >
              Copy to Clipboard
            </button>
            <button
              onClick={() => {
                setNewKeyCreated(null);
                setShowCreateForm(false);
                setNewKeyName('');
                setNewKeyScopes([]);
                setNewKeyExpiration('never');
              }}
              className="px-3 py-1 text-sm text-gray-600 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {showCreateForm && !newKeyCreated && (
        <div className="p-6 mb-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold">Create New API Key</h2>
          <div className="mb-4">
            <label htmlFor="keyName" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              API Key Name
            </label>
            <input
              type="text"
              id="keyName"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g., Production API Key"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Scopes
            </label>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {availableScopes.map((scope) => (
                <div
                  key={scope.value}
                  className="flex items-start p-3 border border-gray-200 rounded-md dark:border-gray-700"
                >
                  <input
                    type="checkbox"
                    id={`scope-${scope.value}`}
                    checked={newKeyScopes.includes(scope.value)}
                    onChange={() => handleScopeToggle(scope.value)}
                    className="mt-1 mr-2"
                  />
                  <div>
                    <label
                      htmlFor={`scope-${scope.value}`}
                      className="font-medium text-gray-700 dark:text-gray-300"
                    >
                      {scope.label}
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {scope.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Expiration
            </label>
            <select
              value={newKeyExpiration}
              onChange={(e) => setNewKeyExpiration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {expirationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleCreateApiKey}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create API Key
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewKeyName('');
                setNewKeyScopes([]);
                setNewKeyExpiration('never');
                setError(null);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading API keys...</div>
        </div>
      ) : (
        <div className="overflow-hidden bg-white rounded-lg shadow dark:bg-gray-800">
          {apiKeys.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">No API keys found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Key
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Expiration
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Last Used
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {apiKeys.map((apiKey) => (
                  <tr key={apiKey.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {apiKey.name}
                      </div>
                      <div className="flex mt-1 space-x-1">
                        {apiKey.scopes.map((scope) => (
                          <span
                            key={scope}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900 dark:text-white">
                        {apiKey.prefix}•••••••••••••
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(apiKey.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {calculateTimeRemaining(apiKey.expiresAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(apiKey.lastUsed)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleRevokeApiKey(apiKey.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="mt-8 p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold">API Key Information</h2>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          API keys allow you to authenticate requests to the JobRunner API. Keep your API keys secure and do not share them in publicly accessible areas.
        </p>
        <h3 className="mt-4 mb-2 text-lg font-medium">Authentication</h3>
        <p className="mb-2 text-gray-600 dark:text-gray-400">
          To authenticate API requests, include your API key in the Authorization header:
        </p>
        <div className="p-3 mb-4 font-mono text-sm bg-gray-100 rounded dark:bg-gray-700">
          Authorization: Bearer YOUR_API_KEY
        </div>
        <h3 className="mt-4 mb-2 text-lg font-medium">Scopes</h3>
        <p className="mb-2 text-gray-600 dark:text-gray-400">
          Scopes define the permissions granted to an API key. Only request the minimum scopes necessary for your integration.
        </p>
        <div className="grid grid-cols-1 gap-2 mt-2 md:grid-cols-2 lg:grid-cols-3">
          {availableScopes.map((scope) => (
            <div key={scope.value} className="p-3 bg-gray-100 rounded-md dark:bg-gray-700">
              <p className="font-medium">{scope.label}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {scope.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}