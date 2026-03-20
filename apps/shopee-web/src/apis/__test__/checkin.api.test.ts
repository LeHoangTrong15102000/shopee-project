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
import checkinApi from '../checkin.api';

describe('Checkin API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkIn', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { streak: 1, reward: {} } } };
      vi.mocked(http.post).mockResolvedValue(mockResponse as any);
      const result = await checkinApi.checkIn();
      expect(http.post).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'));
      const result = await checkinApi.checkIn();
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('getStreak', () => {
    it('should call http.get on success', async () => {
      const mockResponse = {
        data: { message: 'ok', data: { current_streak: 5, can_checkin_today: true } },
      };
      vi.mocked(http.get).mockResolvedValue(mockResponse as any);
      const result = await checkinApi.getStreak();
      expect(http.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'));
      const result = await checkinApi.getStreak();
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('getHistory', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { data: [], pagination: {} } } };
      vi.mocked(http.get).mockResolvedValue(mockResponse as any);
      const result = await checkinApi.getHistory();
      expect(http.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'));
      const result = await checkinApi.getHistory();
      expect(result.data.message).toEqual(expect.any(String));
    });
  });
});
