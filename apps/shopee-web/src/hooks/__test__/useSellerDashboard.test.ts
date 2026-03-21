import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { SocketEvent } from 'src/types/socket.types';

const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};

const mockProfile = { roles: ['Admin'] };

vi.mock('../useSocket', () => ({
  default: vi.fn(() => ({
    socket: mockSocket,
    isConnected: true,
    emit: mockSocket.emit,
    on: mockSocket.on,
    off: mockSocket.off,
  })),
}));

vi.mock('src/contexts/app.context', () => ({
  AppContext: {
    _currentValue: { profile: { roles: ['Admin'] } },
  },
}));

describe('useSellerDashboard', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const appContext = await import('src/contexts/app.context');
    vi.spyOn(appContext.AppContext as any, '_currentValue', 'get').mockReturnValue({
      profile: mockProfile,
    } as any);
  });

  it('should return default metrics when user is admin', async () => {
    const useSellerDashboard = (await import('../useSellerDashboard')).default;
    const { result } = renderHook(() => useSellerDashboard());

    expect(result.current.metrics).toEqual({
      today_orders: 0,
      today_revenue: 0,
      pending_orders: 0,
      pending_qa: 0,
    });
    expect(result.current.orderNotifications).toEqual([]);
    expect(result.current.qaNotifications).toEqual([]);
    expect(result.current.isActive).toBe(true);
  });

  it('should subscribe to seller dashboard when admin', async () => {
    const useSellerDashboard = (await import('../useSellerDashboard')).default;
    renderHook(() => useSellerDashboard());

    expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.SUBSCRIBE_SELLER_DASHBOARD);
  });

  it('should update metrics on SELLER_METRICS_UPDATE event', async () => {
    const useSellerDashboard = (await import('../useSellerDashboard')).default;
    const { result } = renderHook(() => useSellerDashboard());

    const getSocketHandler = (eventName: string) => {
      const calls = mockSocket.on.mock.calls;
      const call = calls.find((c: any[]) => c[0] === eventName);
      return call ? call[1] : undefined;
    };

    const handler = getSocketHandler(SocketEvent.SELLER_METRICS_UPDATE);
    expect(handler).toBeDefined();

    const metricsPayload = {
      today_orders: 25,
      today_revenue: 5000,
      pending_orders: 5,
      pending_qa: 3,
    };

    act(() => {
      handler(metricsPayload);
    });

    expect(result.current.metrics).toEqual(metricsPayload);
  });

  it('should add order notifications on SELLER_ORDER_NOTIFICATION event', async () => {
    const useSellerDashboard = (await import('../useSellerDashboard')).default;
    const { result } = renderHook(() => useSellerDashboard());

    const getSocketHandler = (eventName: string) => {
      const calls = mockSocket.on.mock.calls;
      const call = calls.find((c: any[]) => c[0] === eventName);
      return call ? call[1] : undefined;
    };

    const handler = getSocketHandler(SocketEvent.SELLER_ORDER_NOTIFICATION);
    expect(handler).toBeDefined();

    const orderNotification = {
      order_id: 'order-123',
      customer_name: 'John Doe',
      total: 150,
      status: 'pending',
      created_at: '2026-03-16T10:00:00Z',
    };

    act(() => {
      handler(orderNotification);
    });

    expect(result.current.orderNotifications).toHaveLength(1);
    expect(result.current.orderNotifications[0]).toEqual(orderNotification);
  });

  it('should add QA notifications on SELLER_QA_NOTIFICATION event', async () => {
    const useSellerDashboard = (await import('../useSellerDashboard')).default;
    const { result } = renderHook(() => useSellerDashboard());

    const getSocketHandler = (eventName: string) => {
      const calls = mockSocket.on.mock.calls;
      const call = calls.find((c: any[]) => c[0] === eventName);
      return call ? call[1] : undefined;
    };

    const handler = getSocketHandler(SocketEvent.SELLER_QA_NOTIFICATION);
    expect(handler).toBeDefined();

    const qaNotification = {
      question_id: 'qa-123',
      product_id: 'prod-123',
      customer_name: 'Jane Smith',
      question: 'Is this product available?',
      created_at: '2026-03-16T10:00:00Z',
    };

    act(() => {
      handler(qaNotification);
    });

    expect(result.current.qaNotifications).toHaveLength(1);
    expect(result.current.qaNotifications[0]).toEqual(qaNotification);
  });

  it('should limit order notifications to 50 items', async () => {
    const useSellerDashboard = (await import('../useSellerDashboard')).default;
    const { result } = renderHook(() => useSellerDashboard());

    const getSocketHandler = (eventName: string) => {
      const calls = mockSocket.on.mock.calls;
      const call = calls.find((c: any[]) => c[0] === eventName);
      return call ? call[1] : undefined;
    };

    const handler = getSocketHandler(SocketEvent.SELLER_ORDER_NOTIFICATION);

    act(() => {
      for (let i = 0; i < 55; i++) {
        handler({
          order_id: `order-${i}`,
          customer_name: 'Customer',
          total: 100,
          status: 'pending',
          created_at: '2026-03-16T10:00:00Z',
        });
      }
    });

    expect(result.current.orderNotifications).toHaveLength(50);
  });

  it('should unsubscribe and reset state on unmount', async () => {
    const useSellerDashboard = (await import('../useSellerDashboard')).default;
    const { unmount } = renderHook(() => useSellerDashboard());

    unmount();

    expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.UNSUBSCRIBE_SELLER_DASHBOARD);
    expect(mockSocket.off).toHaveBeenCalledWith(
      SocketEvent.SELLER_ORDER_NOTIFICATION,
      expect.any(Function),
    );
    expect(mockSocket.off).toHaveBeenCalledWith(
      SocketEvent.SELLER_METRICS_UPDATE,
      expect.any(Function),
    );
    expect(mockSocket.off).toHaveBeenCalledWith(
      SocketEvent.SELLER_QA_NOTIFICATION,
      expect.any(Function),
    );
  });
});
