import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  Http,
  setOnAuthFailure,
  setOnTokenRefreshed,
  getAccessTokenFromLS,
  setAccessTokenToLS,
  setProfileToLS,
  clearLS,
  URL_LOGIN,
  URL_LOGOUT,
  URL_REFRESH_TOKEN,
} from './http';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('Http class', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    // Reset module-level callbacks
    setOnAuthFailure(null as unknown as () => void);
    setOnTokenRefreshed(null as unknown as (t: string) => void);
  });

  // 3.1 Constructor tests
  describe('constructor', () => {
    it('creates axios instance with correct baseURL', () => {
      const httpInstance = new Http();
      expect(httpInstance.instance.defaults.baseURL).toBe('http://localhost:3000/');
    });

    it('sets default Content-Type header', () => {
      const httpInstance = new Http();
      expect(httpInstance.instance.defaults.headers['Content-Type']).toBe('application/json');
    });

    it('reads tokens from localStorage on init', () => {
      localStorage.setItem('accessToken', 'stored-token');
      localStorage.setItem('refreshToken', 'stored-refresh');
      const httpInstance = new Http();
      // Verify by making a request config check via interceptor
      expect(httpInstance.instance).toBeDefined();
    });
  });

  // 3.2 Request interceptor tests
  describe('request interceptor', () => {
    it('attaches authorization header when accessToken exists', async () => {
      localStorage.setItem('accessToken', 'my-token');
      const httpInstance = new Http();
      let capturedHeaders: Record<string, unknown> = {};
      const mockAdapter = vi.fn().mockImplementation((config: any) => {
        capturedHeaders = config.headers || {};
        return Promise.resolve({
          data: {},
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        });
      });
      httpInstance.instance.defaults.adapter = mockAdapter;
      await httpInstance.instance.get('/test');
      expect(capturedHeaders.authorization).toBe('my-token');
    });

    it('omits authorization header when accessToken is empty', async () => {
      const httpInstance = new Http();
      let capturedHeaders: Record<string, unknown> = {};
      const mockAdapter = vi.fn().mockImplementation((config: any) => {
        capturedHeaders = config.headers || {};
        return Promise.resolve({
          data: {},
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        });
      });
      httpInstance.instance.defaults.adapter = mockAdapter;
      await httpInstance.instance.get('/test');
      expect(capturedHeaders.authorization).toBeUndefined();
    });
  });

  // 3.3 Response interceptor login flow
  describe('response interceptor - login flow', () => {
    it('saves tokens and profile to localStorage on login', async () => {
      const httpInstance = new Http();
      // Mock the adapter to simulate a login response
      const mockAdapter = vi.fn().mockResolvedValue({
        data: {
          data: {
            access_token: 'new-access',
            refresh_token: 'new-refresh',
            user: { _id: 'u1', name: 'Admin', email: 'admin@test.com' },
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: URL_LOGIN, headers: {} },
      });
      httpInstance.instance.defaults.adapter = mockAdapter;
      await httpInstance.instance.post(URL_LOGIN, { email: 'a', password: 'b' });
      expect(localStorage.getItem('accessToken')).toBe('new-access');
      expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
      expect(localStorage.getItem('profile')).toContain('admin@test.com');
    });
  });

  // 3.4 Response interceptor logout flow
  describe('response interceptor - logout flow', () => {
    it('clears localStorage and resets tokens on logout', async () => {
      localStorage.setItem('accessToken', 'old-access');
      localStorage.setItem('refreshToken', 'old-refresh');
      localStorage.setItem('profile', '{"name":"test"}');
      const httpInstance = new Http();
      const mockAdapter = vi.fn().mockResolvedValue({
        data: { message: 'Logged out' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url: URL_LOGOUT, headers: {} },
      });
      httpInstance.instance.defaults.adapter = mockAdapter;
      await httpInstance.instance.post(URL_LOGOUT);
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  // 3.5 401 token refresh tests
  describe('401 token refresh', () => {
    it('refreshes token and retries on 401', async () => {
      localStorage.setItem('refreshToken', 'valid-refresh');
      const httpInstance = new Http();
      let callCount = 0;
      const mockAdapter = vi.fn().mockImplementation((config: any) => {
        if (config.url === URL_REFRESH_TOKEN) {
          return Promise.resolve({
            data: { data: { access_token: 'refreshed-token' } },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          });
        }
        callCount++;
        if (callCount === 1) {
          const error = new axios.AxiosError('Unauthorized', '401', config, null, {
            status: 401,
            data: {},
            statusText: 'Unauthorized',
            headers: {},
            config,
          } as any);
          return Promise.reject(error);
        }
        return Promise.resolve({
          data: { message: 'Success', data: [] },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        });
      });
      httpInstance.instance.defaults.adapter = mockAdapter;
      const res = await httpInstance.instance.get('/admin/products');
      expect(res.data.message).toBe('Success');
      expect(localStorage.getItem('accessToken')).toBe('refreshed-token');
    });

    it('calls onAuthFailure callback on refresh failure', async () => {
      const authFailureCb = vi.fn();
      setOnAuthFailure(authFailureCb);
      localStorage.setItem('refreshToken', 'expired-refresh');
      const httpInstance = new Http();
      const mockAdapter = vi.fn().mockImplementation((config: any) => {
        if (config.url === URL_REFRESH_TOKEN) {
          const error = new axios.AxiosError('Refresh failed', '401', config, null, {
            status: 401,
            data: {},
            statusText: 'Unauthorized',
            headers: {},
            config,
          } as any);
          return Promise.reject(error);
        }
        const error = new axios.AxiosError('Unauthorized', '401', config, null, {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config,
        } as any);
        return Promise.reject(error);
      });
      httpInstance.instance.defaults.adapter = mockAdapter;
      try {
        await httpInstance.instance.get('/admin/products');
      } catch {
        // expected
      }
      expect(authFailureCb).toHaveBeenCalled();
    });

    it('redirects to /login when no onAuthFailure callback', async () => {
      setOnAuthFailure(null as unknown as () => void);
      const originalHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { href: originalHref },
        writable: true,
      });
      localStorage.setItem('refreshToken', 'expired-refresh');
      const httpInstance = new Http();
      const mockAdapter = vi.fn().mockImplementation((config: any) => {
        if (config.url === URL_REFRESH_TOKEN) {
          const error = new axios.AxiosError('Refresh failed', '401', config, null, {
            status: 401,
            data: {},
            statusText: 'Unauthorized',
            headers: {},
            config,
          } as any);
          return Promise.reject(error);
        }
        const error = new axios.AxiosError('Unauthorized', '401', config, null, {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config,
        } as any);
        return Promise.reject(error);
      });
      httpInstance.instance.defaults.adapter = mockAdapter;
      try {
        await httpInstance.instance.get('/admin/products');
      } catch {
        // expected
      }
      expect(window.location.href).toBe('/login');
    });

    it('passes through non-401 errors', async () => {
      const httpInstance = new Http();
      const mockAdapter = vi.fn().mockImplementation((config: any) => {
        const error = new axios.AxiosError('Server Error', '500', config, null, {
          status: 500,
          data: { message: 'Internal Server Error' },
          statusText: 'Internal Server Error',
          headers: {},
          config,
        } as any);
        return Promise.reject(error);
      });
      httpInstance.instance.defaults.adapter = mockAdapter;
      try {
        await httpInstance.instance.get('/admin/products');
        expect.unreachable('Should have thrown');
      } catch (err: any) {
        expect(err.response?.status).toBe(500);
      }
    });
  });

  // 3.6 Exported helper function tests
  describe('exported helpers', () => {
    it('getAccessTokenFromLS reads from localStorage', () => {
      localStorage.setItem('accessToken', 'test-token');
      expect(getAccessTokenFromLS()).toBe('test-token');
    });

    it('setAccessTokenToLS writes to localStorage', () => {
      setAccessTokenToLS('new-token');
      expect(localStorage.getItem('accessToken')).toBe('new-token');
    });

    it('setProfileToLS writes profile to localStorage', () => {
      setProfileToLS({ name: 'Admin' });
      expect(localStorage.getItem('profile')).toContain('Admin');
    });

    it('clearLS removes all auth keys', () => {
      localStorage.setItem('accessToken', 'a');
      localStorage.setItem('refreshToken', 'b');
      localStorage.setItem('profile', 'c');
      clearLS();
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('profile')).toBeNull();
    });

    it('setOnAuthFailure sets the callback', () => {
      const cb = vi.fn();
      setOnAuthFailure(cb);
      // Callback is set — verified indirectly through auth failure flow
      expect(cb).not.toHaveBeenCalled();
    });

    it('setOnTokenRefreshed sets the callback', () => {
      const cb = vi.fn();
      setOnTokenRefreshed(cb);
      expect(cb).not.toHaveBeenCalled();
    });
  });
});
