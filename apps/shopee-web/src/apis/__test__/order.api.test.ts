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
import orderApi from '../order.api';

describe('Order API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrders', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { orders: [], pagination: {} } } };
      vi.mocked(http.get).mockResolvedValue(mockResponse as any);
      const result = await orderApi.getOrders({ status: 'all' });
      expect(http.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'));
      const result = await orderApi.getOrders({ status: 'all' });
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('getOrderById', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1' } } };
      vi.mocked(http.get).mockResolvedValue(mockResponse as any);
      const result = await orderApi.getOrderById('1');
      expect(http.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'));
      const result = await orderApi.getOrderById('1');
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('cancelOrder', () => {
    it('should call http.put on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1', status: 'cancelled' } } };
      vi.mocked(http.put).mockResolvedValue(mockResponse as any);
      const result = await orderApi.cancelOrder('1', 'reason');
      expect(http.put).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.put).mockRejectedValue(new Error('Network error'));
      const result = await orderApi.cancelOrder('1', 'reason');
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('returnOrder', () => {
    it('should call http.put on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1', status: 'returned' } } };
      vi.mocked(http.put).mockResolvedValue(mockResponse as any);
      const result = await orderApi.returnOrder('1', 'reason');
      expect(http.put).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.put).mockRejectedValue(new Error('Network error'));
      const result = await orderApi.returnOrder('1', 'reason');
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('confirmReceived', () => {
    it('should call http.put on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1', status: 'delivered' } } };
      vi.mocked(http.put).mockResolvedValue(mockResponse as any);
      const result = await orderApi.confirmReceived('1');
      expect(http.put).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.put).mockRejectedValue(new Error('Network error'));
      const result = await orderApi.confirmReceived('1');
      expect(result.data.message).toEqual(expect.any(String));
    });
  });
});
