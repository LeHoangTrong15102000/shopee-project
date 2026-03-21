import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useOptimisticNotification } from '../useOptimisticNotification';
import notificationApi from 'src/apis/notification.api';
import { showSuccessToast, showErrorToast, logOptimisticError } from '../../shared/utils';
import { TOAST_MESSAGES } from '../../shared/constants';
import { QUERY_KEYS } from '../../shared/types';
import * as useQueryInvalidationModule from 'src/hooks/useQueryInvalidation';

vi.mock('src/apis/notification.api');
vi.mock('src/hooks/useQueryInvalidation', () => ({
  useQueryInvalidation: vi.fn(() => ({
    invalidateNotifications: vi.fn(),
  })),
}));
vi.mock('../../shared/utils', () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
  logOptimisticError: vi.fn(),
}));

const mockNotificationsData = {
  data: {
    message: 'Success',
    data: {
      notifications: [
        {
          _id: 'notif-1',
          title: 'Test Notification 1',
          content: 'Content 1',
          type: 'order' as const,
          isRead: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          _id: 'notif-2',
          title: 'Test Notification 2',
          content: 'Content 2',
          type: 'promotion' as const,
          isRead: false,
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
        {
          _id: 'notif-3',
          title: 'Test Notification 3',
          content: 'Content 3',
          type: 'system' as const,
          isRead: true,
          createdAt: '2024-01-03T00:00:00Z',
          updatedAt: '2024-01-03T00:00:00Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 3,
        total_pages: 1,
      },
      unreadCount: 2,
    },
  },
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useOptimisticNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook initialization', () => {
    it('should return markAsReadMutation', () => {
      const { result } = renderHook(() => useOptimisticNotification(), {
        wrapper: createWrapper(),
      });

      expect(result.current.markAsReadMutation).toBeDefined();
      expect(typeof result.current.markAsReadMutation.mutate).toBe('function');
    });

    it('should return markAllAsReadMutation', () => {
      const { result } = renderHook(() => useOptimisticNotification(), {
        wrapper: createWrapper(),
      });

      expect(result.current.markAllAsReadMutation).toBeDefined();
      expect(typeof result.current.markAllAsReadMutation.mutate).toBe('function');
    });

    it('should have correct mutation properties', () => {
      const { result } = renderHook(() => useOptimisticNotification(), {
        wrapper: createWrapper(),
      });

      expect(result.current.markAsReadMutation.isPending).toBe(false);
      expect(result.current.markAllAsReadMutation.isPending).toBe(false);
    });
  });

  describe('markAsReadMutation', () => {
    it('should optimistically update notification to read', async () => {
      const wrapper = createWrapper();
      const queryClient = (wrapper({ children: null }) as any as React.ReactElement).props
        .client as QueryClient;

      queryClient.setQueryData(QUERY_KEYS.NOTIFICATIONS, mockNotificationsData);

      const { result } = renderHook(() => useOptimisticNotification(), { wrapper });

      vi.mocked(notificationApi.markAsRead).mockResolvedValue({
        data: {
          message: 'Success',
          data: { ...mockNotificationsData.data.data.notifications[0], isRead: true },
        },
      });

      result.current.markAsReadMutation.mutate('notif-1');

      await waitFor(() => {
        const updatedData = queryClient.getQueryData(
          QUERY_KEYS.NOTIFICATIONS,
        ) as typeof mockNotificationsData;
        const notification = updatedData?.data.data.notifications.find((n) => n._id === 'notif-1');
        expect(notification?.isRead).toBe(true);
      });
    });

    it('should decrease unreadCount when marking unread notification as read', async () => {
      const wrapper = createWrapper();
      const queryClient = (wrapper({ children: null }) as any as React.ReactElement).props
        .client as QueryClient;

      queryClient.setQueryData(QUERY_KEYS.NOTIFICATIONS, mockNotificationsData);

      const { result } = renderHook(() => useOptimisticNotification(), { wrapper });

      vi.mocked(notificationApi.markAsRead).mockResolvedValue({
        data: {
          message: 'Success',
          data: { ...mockNotificationsData.data.data.notifications[0], isRead: true },
        },
      });

      result.current.markAsReadMutation.mutate('notif-1');

      await waitFor(() => {
        const updatedData = queryClient.getQueryData(
          QUERY_KEYS.NOTIFICATIONS,
        ) as typeof mockNotificationsData;
        expect(updatedData?.data.data.unreadCount).toBe(1);
      });
    });

    it('should not decrease unreadCount when marking already read notification', async () => {
      const wrapper = createWrapper();
      const queryClient = (wrapper({ children: null }) as any as React.ReactElement).props
        .client as QueryClient;

      queryClient.setQueryData(QUERY_KEYS.NOTIFICATIONS, mockNotificationsData);

      const { result } = renderHook(() => useOptimisticNotification(), { wrapper });

      vi.mocked(notificationApi.markAsRead).mockResolvedValue({
        data: {
          message: 'Success',
          data: { ...mockNotificationsData.data.data.notifications[2], isRead: true },
        },
      });

      result.current.markAsReadMutation.mutate('notif-3');

      await waitFor(() => {
        const updatedData = queryClient.getQueryData(
          QUERY_KEYS.NOTIFICATIONS,
        ) as typeof mockNotificationsData;
        expect(updatedData?.data.data.unreadCount).toBe(2);
      });
    });

    it('should not decrease unreadCount below 0', async () => {
      const wrapper = createWrapper();
      const queryClient = (wrapper({ children: null }) as any as React.ReactElement).props
        .client as QueryClient;

      const dataWithZeroUnread = {
        ...mockNotificationsData,
        data: {
          ...mockNotificationsData.data,
          data: {
            ...mockNotificationsData.data.data,
            unreadCount: 0,
          },
        },
      };

      queryClient.setQueryData(QUERY_KEYS.NOTIFICATIONS, dataWithZeroUnread);

      const { result } = renderHook(() => useOptimisticNotification(), { wrapper });

      vi.mocked(notificationApi.markAsRead).mockResolvedValue({
        data: {
          message: 'Success',
          data: { ...mockNotificationsData.data.data.notifications[0], isRead: true },
        },
      });

      result.current.markAsReadMutation.mutate('notif-1');

      await waitFor(() => {
        const updatedData = queryClient.getQueryData(
          QUERY_KEYS.NOTIFICATIONS,
        ) as typeof mockNotificationsData;
        expect(updatedData?.data.data.unreadCount).toBe(0);
      });
    });

    it('should handle case when query data is undefined', async () => {
      const wrapper = createWrapper();
      const queryClient = (wrapper({ children: null }) as any as React.ReactElement).props
        .client as QueryClient;

      const { result } = renderHook(() => useOptimisticNotification(), { wrapper });

      vi.mocked(notificationApi.markAsRead).mockResolvedValue({
        data: {
          message: 'Success',
          data: { ...mockNotificationsData.data.data.notifications[0], isRead: true },
        },
      });

      result.current.markAsReadMutation.mutate('notif-1');

      await waitFor(() => {
        const data = queryClient.getQueryData(QUERY_KEYS.NOTIFICATIONS);
        expect(data).toBeUndefined();
      });
    });

    it('should restore previous data on error', async () => {
      const wrapper = createWrapper();
      const queryClient = (wrapper({ children: null }) as any as React.ReactElement).props
        .client as QueryClient;

      queryClient.setQueryData(QUERY_KEYS.NOTIFICATIONS, mockNotificationsData);

      const { result } = renderHook(() => useOptimisticNotification(), { wrapper });

      const error = new Error('Network error');
      vi.mocked(notificationApi.markAsRead).mockRejectedValue(error);

      result.current.markAsReadMutation.mutate('notif-1');

      await waitFor(() => {
        expect(result.current.markAsReadMutation.isError).toBe(true);
      });

      const restoredData = queryClient.getQueryData(QUERY_KEYS.NOTIFICATIONS);
      expect(restoredData).toEqual(mockNotificationsData);
    });

    it('should show error toast on failure', async () => {
      const wrapper = createWrapper();
      const queryClient = (wrapper({ children: null }) as any as React.ReactElement).props
        .client as QueryClient;

      queryClient.setQueryData(QUERY_KEYS.NOTIFICATIONS, mockNotificationsData);

      const { result } = renderHook(() => useOptimisticNotification(), { wrapper });

      const error = new Error('Network error');
      vi.mocked(notificationApi.markAsRead).mockRejectedValue(error);

      result.current.markAsReadMutation.mutate('notif-1');

      await waitFor(() => {
        expect(showErrorToast).toHaveBeenCalledWith(TOAST_MESSAGES.MARK_AS_READ_ERROR);
      });
    });

    it('should log error on failure', async () => {
      const wrapper = createWrapper();
      const queryClient = (wrapper({ children: null }) as any as React.ReactElement).props
        .client as QueryClient;

      queryClient.setQueryData(QUERY_KEYS.NOTIFICATIONS, mockNotificationsData);

      const { result } = renderHook(() => useOptimisticNotification(), { wrapper });

      const error = new Error('Network error');
      vi.mocked(notificationApi.markAsRead).mockRejectedValue(error);

      result.current.markAsReadMutation.mutate('notif-1');

      await waitFor(() => {
        expect(logOptimisticError).toHaveBeenCalledWith('Mark as read', error, expect.any(Object));
      });
    });

    it('should handle error when context is undefined', async () => {
      const wrapper = createWrapper();

      const { result } = renderHook(() => useOptimisticNotification(), { wrapper });

      const error = new Error('Network error');
      vi.mocked(notificationApi.markAsRead).mockRejectedValue(error);

      result.current.markAsReadMutation.mutate('notif-1');

      await waitFor(() => {
        expect(result.current.markAsReadMutation.isError).toBe(true);
      });

      expect(showErrorToast).toHaveBeenCalledWith(TOAST_MESSAGES.MARK_AS_READ_ERROR);
    });

    it('should invalidate notifications on settled', async () => {
      const invalidateNotifications = vi.fn();
      vi.mocked(useQueryInvalidationModule.useQueryInvalidation).mockReturnValue({
        invalidateNotifications,
      } as any);

      const wrapper = createWrapper();
      const queryClient = (wrapper({ children: null }) as any as React.ReactElement).props
        .client as QueryClient;

      queryClient.setQueryData(QUERY_KEYS.NOTIFICATIONS, mockNotificationsData);

      const { result } = renderHook(() => useOptimisticNotification(), { wrapper });

      vi.mocked(notificationApi.markAsRead).mockResolvedValue({
        data: {
          message: 'Success',
          data: { ...mockNotificationsData.data.data.notifications[0], isRead: true },
        },
      });

      result.current.markAsReadMutation.mutate('notif-1');

      await waitFor(() => {
        expect(invalidateNotifications).toHaveBeenCalled();
      });
    });
  });

  describe('markAllAsReadMutation', () => {
    it('should optimistically mark all notifications as read', async () => {
      const wrapper = createWrapper();
      const queryClient = (wrapper({ children: null }) as any as React.ReactElement).props
        .client as QueryClient;

      queryClient.setQueryData(QUERY_KEYS.NOTIFICATIONS, mockNotificationsData);

      const { result } = renderHook(() => useOptimisticNotification(), { wrapper });

      vi.mocked(notificationApi.markAllAsRead).mockResolvedValue({
        data: { message: 'Success', data: { message: 'All marked as read' } },
      });

      result.current.markAllAsReadMutation.mutate();

      await waitFor(() => {
        const updatedData = queryClient.getQueryData(
          QUERY_KEYS.NOTIFICATIONS,
        ) as typeof mockNotificationsData;
        const allRead = updatedData?.data.data.notifications.every((n) => n.isRead);
        expect(allRead).toBe(true);
      });
    });

    it('should set unreadCount to 0', async () => {
      const wrapper = createWrapper();
      const queryClient = (wrapper({ children: null }) as any as React.ReactElement).props
        .client as QueryClient;

      queryClient.setQueryData(QUERY_KEYS.NOTIFICATIONS, mockNotificationsData);

      const { result } = renderHook(() => useOptimisticNotification(), { wrapper });

      vi.mocked(notificationApi.markAllAsRead).mockResolvedValue({
        data: { message: 'Success', data: { message: 'All marked as read' } },
      });

      result.current.markAllAsReadMutation.mutate();

      await waitFor(() => {
        const updatedData = queryClient.getQueryData(
          QUERY_KEYS.NOTIFICATIONS,
        ) as typeof mockNotificationsData;
        expect(updatedData?.data.data.unreadCount).toBe(0);
      });
    });

    it('should handle case when query data is undefined', async () => {
      const wrapper = createWrapper();
      const queryClient = (wrapper({ children: null }) as any as React.ReactElement).props
        .client as QueryClient;

      const { result } = renderHook(() => useOptimisticNotification(), { wrapper });

      vi.mocked(notificationApi.markAllAsRead).mockResolvedValue({
        data: { message: 'Success', data: { message: 'All marked as read' } },
      });

      result.current.markAllAsReadMutation.mutate();

      await waitFor(() => {
        const data = queryClient.getQueryData(QUERY_KEYS.NOTIFICATIONS);
        expect(data).toBeUndefined();
      });
    });

    it('should restore previous data on error', async () => {
      const wrapper = createWrapper();
      const queryClient = (wrapper({ children: null }) as any as React.ReactElement).props
        .client as QueryClient;

      queryClient.setQueryData(QUERY_KEYS.NOTIFICATIONS, mockNotificationsData);

      const { result } = renderHook(() => useOptimisticNotification(), { wrapper });

      const error = new Error('Network error');
      vi.mocked(notificationApi.markAllAsRead).mockRejectedValue(error);

      result.current.markAllAsReadMutation.mutate();

      await waitFor(() => {
        expect(result.current.markAllAsReadMutation.isError).toBe(true);
      });

      const restoredData = queryClient.getQueryData(QUERY_KEYS.NOTIFICATIONS);
      expect(restoredData).toEqual(mockNotificationsData);
    });

    it('should show error toast on failure', async () => {
      const wrapper = createWrapper();
      const queryClient = (wrapper({ children: null }) as any as React.ReactElement).props
        .client as QueryClient;

      queryClient.setQueryData(QUERY_KEYS.NOTIFICATIONS, mockNotificationsData);

      const { result } = renderHook(() => useOptimisticNotification(), { wrapper });

      const error = new Error('Network error');
      vi.mocked(notificationApi.markAllAsRead).mockRejectedValue(error);

      result.current.markAllAsReadMutation.mutate();

      await waitFor(() => {
        expect(showErrorToast).toHaveBeenCalledWith(TOAST_MESSAGES.MARK_ALL_AS_READ_ERROR);
      });
    });

    it('should log error on failure', async () => {
      const wrapper = createWrapper();
      const queryClient = (wrapper({ children: null }) as any as React.ReactElement).props
        .client as QueryClient;

      queryClient.setQueryData(QUERY_KEYS.NOTIFICATIONS, mockNotificationsData);

      const { result } = renderHook(() => useOptimisticNotification(), { wrapper });

      const error = new Error('Network error');
      vi.mocked(notificationApi.markAllAsRead).mockRejectedValue(error);

      result.current.markAllAsReadMutation.mutate();

      await waitFor(() => {
        expect(logOptimisticError).toHaveBeenCalledWith(
          'Mark all as read',
          error,
          expect.any(Object),
        );
      });
    });

    it('should handle error when context is undefined', async () => {
      const wrapper = createWrapper();

      const { result } = renderHook(() => useOptimisticNotification(), { wrapper });

      const error = new Error('Network error');
      vi.mocked(notificationApi.markAllAsRead).mockRejectedValue(error);

      result.current.markAllAsReadMutation.mutate();

      await waitFor(() => {
        expect(result.current.markAllAsReadMutation.isError).toBe(true);
      });

      expect(showErrorToast).toHaveBeenCalledWith(TOAST_MESSAGES.MARK_ALL_AS_READ_ERROR);
    });

    it('should show success toast on success', async () => {
      const wrapper = createWrapper();
      const queryClient = (wrapper({ children: null }) as any as React.ReactElement).props
        .client as QueryClient;

      queryClient.setQueryData(QUERY_KEYS.NOTIFICATIONS, mockNotificationsData);

      const { result } = renderHook(() => useOptimisticNotification(), { wrapper });

      vi.mocked(notificationApi.markAllAsRead).mockResolvedValue({
        data: { message: 'Success', data: { message: 'All marked as read' } },
      });

      result.current.markAllAsReadMutation.mutate();

      await waitFor(() => {
        expect(showSuccessToast).toHaveBeenCalledWith(TOAST_MESSAGES.MARK_ALL_AS_READ_SUCCESS);
      });
    });

    it('should invalidate notifications on settled', async () => {
      const invalidateNotifications = vi.fn();
      vi.mocked(useQueryInvalidationModule.useQueryInvalidation).mockReturnValue({
        invalidateNotifications,
      } as any);

      const wrapper = createWrapper();
      const queryClient = (wrapper({ children: null }) as any as React.ReactElement).props
        .client as QueryClient;

      queryClient.setQueryData(QUERY_KEYS.NOTIFICATIONS, mockNotificationsData);

      const { result } = renderHook(() => useOptimisticNotification(), { wrapper });

      vi.mocked(notificationApi.markAllAsRead).mockResolvedValue({
        data: { message: 'Success', data: { message: 'All marked as read' } },
      });

      result.current.markAllAsReadMutation.mutate();

      await waitFor(() => {
        expect(invalidateNotifications).toHaveBeenCalled();
      });
    });

    it('should preserve previousUnreadCount in context', async () => {
      const wrapper = createWrapper();
      const queryClient = (wrapper({ children: null }) as any as React.ReactElement).props
        .client as QueryClient;

      queryClient.setQueryData(QUERY_KEYS.NOTIFICATIONS, mockNotificationsData);

      const { result } = renderHook(() => useOptimisticNotification(), { wrapper });

      const error = new Error('Network error');
      vi.mocked(notificationApi.markAllAsRead).mockRejectedValue(error);

      result.current.markAllAsReadMutation.mutate();

      await waitFor(() => {
        expect(logOptimisticError).toHaveBeenCalledWith(
          'Mark all as read',
          error,
          expect.objectContaining({
            previousUnreadCount: 2,
          }),
        );
      });
    });

    it('should handle previousUnreadCount as 0 when no data exists', async () => {
      const wrapper = createWrapper();

      const { result } = renderHook(() => useOptimisticNotification(), { wrapper });

      const error = new Error('Network error');
      vi.mocked(notificationApi.markAllAsRead).mockRejectedValue(error);

      result.current.markAllAsReadMutation.mutate();

      await waitFor(() => {
        expect(logOptimisticError).toHaveBeenCalledWith(
          'Mark all as read',
          error,
          expect.objectContaining({
            previousUnreadCount: 0,
          }),
        );
      });
    });
  });
});
