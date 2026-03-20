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
import purchaseApi from '../purchases.api';

describe('Purchases API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addToCart', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1' } } };
      vi.mocked(http.post).mockResolvedValue(mockResponse as any);
      const result = await purchaseApi.addToCart({ product_id: '1', buy_count: 1 });
      expect(http.post).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'));
      const result = await purchaseApi.addToCart({ product_id: '1', buy_count: 1 });
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('getPurchases', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: [] } };
      vi.mocked(http.get).mockResolvedValue(mockResponse as any);
      const result = await purchaseApi.getPurchases({ status: 0 });
      expect(http.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'));
      const result = await purchaseApi.getPurchases({ status: 0 });
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('buyPurchases', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: [] } };
      vi.mocked(http.post).mockResolvedValue(mockResponse as any);
      const result = await purchaseApi.buyPurchases([{ product_id: '1', buy_count: 1 }]);
      expect(http.post).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'));
      const result = await purchaseApi.buyPurchases([{ product_id: '1', buy_count: 1 }]);
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('updatePurchase', () => {
    it('should call http.put on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1' } } };
      vi.mocked(http.put).mockResolvedValue(mockResponse as any);
      const result = await purchaseApi.updatePurchase({ product_id: '1', buy_count: 2 });
      expect(http.put).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.put).mockRejectedValue(new Error('Network error'));
      const result = await purchaseApi.updatePurchase({ product_id: '1', buy_count: 2 });
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('deletePurchase', () => {
    it('should call http.delete on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { deleted_count: 1 } } };
      vi.mocked(http.delete).mockResolvedValue(mockResponse as any);
      const result = await purchaseApi.deletePurchase(['1']);
      expect(http.delete).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.delete).mockRejectedValue(new Error('Network error'));
      const result = await purchaseApi.deletePurchase(['1']);
      expect(result.data.message).toEqual(expect.any(String));
    });
  });
});
