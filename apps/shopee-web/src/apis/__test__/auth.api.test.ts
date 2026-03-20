import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('src/utils/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}));

import http from 'src/utils/http';
import authApi from '../auth.api';

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerAccount', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { access_token: 'token', user: {} } } };
      vi.mocked(http.post).mockResolvedValue(mockResponse as any);
      const result = await authApi.registerAccount({ email: 'test@test.com', password: 'pass' });
      expect(http.post).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'));
      const result = await authApi.registerAccount({ email: 'test@test.com', password: 'pass' });
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('loginAccount', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { access_token: 'token', user: {} } } };
      vi.mocked(http.post).mockResolvedValue(mockResponse as any);
      const result = await authApi.loginAccount({ email: 'test@test.com', password: 'pass' });
      expect(http.post).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'));
      const result = await authApi.loginAccount({ email: 'test@test.com', password: 'pass' });
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('logoutAccount', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok' } };
      vi.mocked(http.post).mockResolvedValue(mockResponse as any);
      const result = await authApi.logoutAccount();
      expect(http.post).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'));
      const result = await authApi.logoutAccount();
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('refreshAccessToken', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { access_token: 'new-token' } } };
      vi.mocked(http.post).mockResolvedValue(mockResponse as any);
      const result = await authApi.refreshAccessToken({ refresh_token: 'refresh' });
      expect(http.post).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'));
      const result = await authApi.refreshAccessToken({ refresh_token: 'refresh' });
      expect(result.data.message).toEqual(expect.any(String));
    });
  });
});
