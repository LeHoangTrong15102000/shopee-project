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
import categoryApi from '../category.api';

describe('Category API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCategories', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: [] } };
      vi.mocked(http.get).mockResolvedValue(mockResponse as any);
      const result = await categoryApi.getCategories();
      expect(http.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'));
      const result = await categoryApi.getCategories();
      expect(result.data.message).toEqual(expect.any(String));
    });
  });
});
