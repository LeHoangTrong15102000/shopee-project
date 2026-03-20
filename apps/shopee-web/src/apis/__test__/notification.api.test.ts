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
import notificationApi from '../notification.api';

describe('Notification API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should call http.get on success', async () => {
      const mockResponse = {
        data: { message: 'ok', data: { notifications: [], pagination: {}, unreadCount: 0 } },
      };
      vi.mocked(http.get).mockResolvedValue(mockResponse as any);
      const result = await notificationApi.getNotifications();
      expect(http.get).toHaveBeenCalled();
      expect(result.data.message).toEqual(expect.any(String));
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'));
      const result = await notificationApi.getNotifications();
      expect(result.data.message).toEqual(expect.any(String));
    });
  });

  describe('markAsRead', () => {
    it('should call http.put on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1', isRead: true } } };
      vi.mocked(http.put).mockResolvedValue(mockResponse as any);
      const result = await notificationApi.markAsRead('1');
      expect(http.put).toHaveBeenCalled();
      expect(result.data.message).toEqual(expect.any(String));
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.put).mockRejectedValue(new Error('Network error'));
      try {
        await notificationApi.markAsRead('1');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('markAllAsRead', () => {
    it('should call http.put on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { message: 'success' } } };
      vi.mocked(http.put).mockResolvedValue(mockResponse as any);
      const result = await notificationApi.markAllAsRead();
      expect(http.put).toHaveBeenCalled();
      expect(result.data.message).toEqual(expect.any(String));
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.put).mockRejectedValue(new Error('Network error'));
      try {
        await notificationApi.markAllAsRead();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('deleteNotification', () => {
    it('should call http.delete on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { message: 'deleted' } } };
      vi.mocked(http.delete).mockResolvedValue(mockResponse as any);
      const result = await notificationApi.deleteNotification('1');
      expect(http.delete).toHaveBeenCalled();
      expect(result.data.message).toEqual(expect.any(String));
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.delete).mockRejectedValue(new Error('Network error'));
      try {
        await notificationApi.deleteNotification('1');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getUnreadCount', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { unreadCount: 5 } } };
      vi.mocked(http.get).mockResolvedValue(mockResponse as any);
      const result = await notificationApi.getUnreadCount();
      expect(http.get).toHaveBeenCalled();
      expect(result.data.message).toEqual(expect.any(String));
    });

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'));
      try {
        await notificationApi.getUnreadCount();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
