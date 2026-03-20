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
import loyaltyApi from '../loyalty.api';

describe('Loyalty API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPoints', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { total_points: 1000 } } };
      vi.mocked(http.get).mockResolvedValue(mockResponse as any);
      const result = await loyaltyApi.getPoints();
      expect(http.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'));
      const result = await loyaltyApi.getPoints();
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('getTransactions', () => {
    it('should call http.get on success', async () => {
      const mockResponse = {
        data: { message: 'ok', data: { transactions: [], pagination: {} } },
      };
      vi.mocked(http.get).mockResolvedValue(mockResponse as any);
      const result = await loyaltyApi.getTransactions();
      expect(http.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'));
      const result = await loyaltyApi.getTransactions();
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('getRewards', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: [] } };
      vi.mocked(http.get).mockResolvedValue(mockResponse as any);
      const result = await loyaltyApi.getRewards();
      expect(http.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'));
      const result = await loyaltyApi.getRewards();
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('redeemPoints', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { success: true } } };
      vi.mocked(http.post).mockResolvedValue(mockResponse as any);
      const result = await loyaltyApi.redeemPoints('1');
      expect(http.post).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'));
      const result = await loyaltyApi.redeemPoints('1');
      expect(result.data.message).toEqual(expect.any(String));
    });
  });
});
