import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import useNotifications from '../useNotifications';

vi.mock('../useSocket');
vi.mock('src/apis/notification.api');
vi.mock('react-toastify', () => ({
  toast: {
    info: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useNotifications', () => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const useSocket = await import('../useSocket');
    vi.mocked(useSocket.default).mockReturnValue({
      socket: mockSocket as never,
      isConnected: true,
      connectionStatus: 'connected',
      connect: vi.fn(),
      disconnect: vi.fn(),
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    });

    const notificationApi = await import('src/apis/notification.api');
    vi.mocked(notificationApi.default.getNotifications).mockResolvedValue({
      data: { data: { notifications: [], unreadCount: 0 } },
    } as never);
    vi.mocked(notificationApi.default.getUnreadCount).mockResolvedValue({
      data: { data: { unreadCount: 0 } },
    } as never);
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() });

    expect(result.current.notifications).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.isConnected).toBe(true);
  });

  it('should provide markAsRead function', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() });

    expect(typeof result.current.markAsRead).toBe('function');
  });

  it('should provide clearAll function', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper: createWrapper() });

    expect(typeof result.current.clearAll).toBe('function');
  });
});
