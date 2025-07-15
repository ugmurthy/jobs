import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from '../api';

// Mock fetch
global.fetch = vi.fn();

describe('API Client', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should make a GET request with query parameters', async () => {
    // Mock successful response
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ data: 'test data' }),
      headers: {
        get: vi.fn().mockReturnValue('application/json'),
      },
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    // Make request with query parameters
    const params = {
      page: 1,
      limit: 10,
      search: 'test',
      status: 'active',
    };

    const result = await api.get('/jobs', { params });

    // Check that fetch was called with the correct URL including query parameters
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchUrl = (global.fetch as any).mock.calls[0][0];
    
    // Verify URL contains all query parameters
    expect(fetchUrl).toContain('/api/jobs?');
    expect(fetchUrl).toContain('page=1');
    expect(fetchUrl).toContain('limit=10');
    expect(fetchUrl).toContain('search=test');
    expect(fetchUrl).toContain('status=active');
    
    // Verify response was processed correctly
    expect(result).toEqual({ data: 'test data' });
  });

  it('should handle null and undefined query parameters', async () => {
    // Mock successful response
    const mockResponse = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ data: 'test data' }),
      headers: {
        get: vi.fn().mockReturnValue('application/json'),
      },
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    // Make request with some null/undefined parameters
    const params = {
      page: 1,
      limit: 10,
      search: null,
      status: undefined,
    };

    await api.get('/jobs', { params });

    // Check that fetch was called with the correct URL (without null/undefined params)
    const fetchUrl = (global.fetch as any).mock.calls[0][0];
    
    // Verify URL contains only non-null parameters
    expect(fetchUrl).toContain('/api/jobs?');
    expect(fetchUrl).toContain('page=1');
    expect(fetchUrl).toContain('limit=10');
    expect(fetchUrl).not.toContain('search=');
    expect(fetchUrl).not.toContain('status=');
  });

  it('should handle error responses', async () => {
    // Mock error response
    const mockResponse = {
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({ 
        message: 'Bad request', 
        details: 'Invalid parameters' 
      }),
      headers: {
        get: vi.fn().mockReturnValue('application/json'),
      },
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    // Make request
    try {
      await api.get('/jobs');
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      // Verify error was processed correctly
      expect(error.status).toBe(400);
      expect(error.message).toBe('Bad request');
      expect(error.details).toBe('Invalid parameters');
    }
  });

  it('should handle network errors', async () => {
    // Mock network error
    (global.fetch as any).mockRejectedValue(new Error('Failed to fetch'));

    // Make request
    try {
      await api.get('/jobs');
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      // Verify error was processed correctly
      expect(error.status).toBe(0);
      expect(error.message).toBe('Network error. Please check your connection.');
    }
  });

  it('should handle timeout errors', async () => {
    // Mock AbortError (timeout)
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    (global.fetch as any).mockRejectedValue(abortError);

    // Make request with short timeout
    try {
      await api.get('/jobs', { timeout: 100 });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      // Verify error was processed correctly
      expect(error.status).toBe(408);
      expect(error.message).toBe('Request timeout');
    }
  });
});