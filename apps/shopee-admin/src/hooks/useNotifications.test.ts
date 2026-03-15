import { renderHook, waitFor } from '@testing-library/react';
import { createQueryWrapper } from 'src/test-utils';
import {
  useNotifications,
  useCreateNotification,
  useDeleteNotification,
  useMarkNotificationAsRead,
  useNotificationUnreadCount,
} from './useNotifications';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('useNotifications', () => {
  it('fetches notifications', async () => {
    const { result } = renderHook(() => useNotifications(0), { wrapper: createQueryWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.notifications).toBeDefined();
  });
});

describe('useNotificationUnreadCount', () => {
  it('fetches unread count', async () => {
    const { result } = renderHook(() => useNotificationUnreadCount(), {
      wrapper: createQueryWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(typeof result.current.data).toBe('number');
  });
});

describe('useCreateNotification', () => {
  it('creates a notification', async () => {
    const { result } = renderHook(() => useCreateNotification(), { wrapper: createQueryWrapper() });
    result.current.mutate({
      type: 'targeted',
      form: { user_id: 'user-1', title: 'Test', message: 'Test message' },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useDeleteNotification', () => {
  it('deletes a notification', async () => {
    const { result } = renderHook(() => useDeleteNotification(), { wrapper: createQueryWrapper() });
    result.current.mutate('notif-1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useMarkNotificationAsRead', () => {
  it('marks notification as read', async () => {
    const { result } = renderHook(() => useMarkNotificationAsRead(), {
      wrapper: createQueryWrapper(),
    });
    result.current.mutate('notif-1');
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
