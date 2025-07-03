# API Key Authentication Guide

This guide explains how to use API key authentication with the JobRunner API.

## Overview

The API now supports two authentication methods:

1. **JWT Authentication** - For user-to-server communication (web applications, mobile apps)
2. **API Key Authentication** - For machine-to-machine communication (integrations, scripts)

Both methods can be used interchangeably on all protected endpoints.

## API Key Management

### Creating an API Key

To create a new API key, send a POST request to the `/api-keys` endpoint:

```bash
curl -X POST \
  http://localhost:4000/api-keys \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "My Integration Key",
    "permissions": ["read:jobs", "write:jobs"],
    "expiresAt": "2025-12-31T23:59:59Z"
  }'
```

The response will include the full API key. **This is the only time the full key will be shown**, so make sure to store it securely:

```json
{
  "message": "API key created successfully",
  "apiKey": {
    "id": 1,
    "userId": 42,
    "name": "My Integration Key",
    "prefix": "abc12345",
    "permissions": ["read:jobs", "write:jobs"],
    "lastUsed": null,
    "createdAt": "2025-07-07T13:55:00Z",
    "expiresAt": "2025-12-31T23:59:59Z",
    "isActive": true,
    "key": "abc12345def67890ghi12345jkl67890mno12345pqr67890"
  }
}
```

### Listing API Keys

To list all your API keys, send a GET request to the `/api-keys` endpoint:

```bash
curl -X GET \
  http://localhost:4000/api-keys \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

The response will include all your API keys, but only with their prefixes (not the full keys):

```json
{
  "message": "API keys retrieved successfully",
  "apiKeys": [
    {
      "id": 1,
      "userId": 42,
      "name": "My Integration Key",
      "prefix": "abc12345",
      "permissions": ["read:jobs", "write:jobs"],
      "lastUsed": "2025-07-07T14:00:00Z",
      "createdAt": "2025-07-07T13:55:00Z",
      "expiresAt": "2025-12-31T23:59:59Z",
      "isActive": true
    }
  ]
}
```

### Updating an API Key

To update an API key, send a PUT request to the `/api-keys/{id}` endpoint:

```bash
curl -X PUT \
  http://localhost:4000/api-keys/1 \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Updated Key Name",
    "permissions": ["read:jobs"],
    "isActive": true
  }'
```

### Revoking an API Key

To revoke an API key, send a DELETE request to the `/api-keys/{id}` endpoint:

```bash
curl -X DELETE \
  http://localhost:4000/api-keys/1 \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

## Using API Keys for Authentication

To authenticate with an API key, include it in the `X-API-Key` header:

```bash
curl -X GET \
  http://localhost:4000/jobs \
  -H 'X-API-Key: abc12345def67890ghi12345jkl67890mno12345pqr67890'
```

## Best Practices

1. **Store API keys securely** - Treat API keys like passwords. Don't hardcode them in source code or commit them to version control.

2. **Use specific permissions** - Only grant the permissions that are needed for each integration.

3. **Set expiration dates** - Use expiration dates for API keys to limit their lifetime.

4. **Rotate keys regularly** - Create new API keys and revoke old ones on a regular schedule.

5. **Monitor usage** - Check the `lastUsed` timestamp to identify unused API keys that can be revoked.

6. **One key per integration** - Use separate API keys for different integrations to limit the impact if a key is compromised.

## Permissions

The following permissions are currently supported:

- `read:jobs` - Allows reading job information
- `write:jobs` - Allows creating and updating jobs
- `read:webhooks` - Allows reading webhook information
- `write:webhooks` - Allows creating and updating webhooks
- `admin` - Full administrative access (use with caution)

## Security Considerations

- API keys are stored hashed in the database, similar to passwords
- Only the key prefix is displayed in the UI and API responses after creation
- API keys can be revoked at any time
- Rate limiting is applied to API key usage
- Failed authentication attempts are logged