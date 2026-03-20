import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let requestInterceptorSuccess: any;
let requestInterceptorError: any;
let responseInterceptorSuccess: any;
let responseInterceptorError: any;

const mockAxiosInstance = {
  interceptors: {
    request: {
      use: vi.fn((success: any, error: any) => {
        requestInterceptorSuccess = success;
        requestInterceptorError = error;
      }),
    },
    response: {
      use: vi.fn((success: any, error: any) => {
        responseInterceptorSuccess = success;
        responseInterceptorError = error;
      }),
    },
  },
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('src/utils/auth', () => ({
  clearLS: vi.fn(),
  getAccessTokenFromLS: vi.fn(() => 'mock-access-token'),
  getRefreshTokenFromLS: vi.fn(() => 'mock-refresh-token'),
  setAccessTokenToLS: vi.fn(),
  setProfileToLS: vi.fn(),
  setRefreshTokenToLS: vi.fn(),
}));

vi.mock('@shopee/shared-utils', () => ({
  isAxiosExpiredTokenError: vi.fn(),
  isAxiosUnauthorizedError: vi.fn(),
}));

describe('Http class', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('creates axios instance', async () => {
    const axios = (await import('axios')).default;
    await import('../http');

    expect(axios.create).toHaveBeenCalled();
  });

  it('request interceptor is registered', async () => {
    await import('../http');

    expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    expect(requestInterceptorSuccess).toBeDefined();
  });

  it('response interceptor is registered', async () => {
    await import('../http');

    expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    expect(responseInterceptorSuccess).toBeDefined();
    expect(responseInterceptorError).toBeDefined();
  });

  it('request interceptor adds auth token to headers', async () => {
    await import('../http');

    const config = { headers: {} as any };
    const result = requestInterceptorSuccess(config);

    expect(result.headers.authorization).toBe('mock-access-token');
  });

  it('response interceptor returns response on success', async () => {
    await import('../http');

    const response = { config: { url: '/api/test' }, data: {} };
    const result = responseInterceptorSuccess(response);

    expect(result).toBe(response);
  });
});
