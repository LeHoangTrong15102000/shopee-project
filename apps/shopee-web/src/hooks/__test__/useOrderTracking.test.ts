import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useOrderTracking from '../useOrderTracking';
import { SocketEvent } from 'src/types/socket.types';

vi.mock('../useSocket');
vi.mock('react-toastify', () => ({
  toast: {
    info: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  },
}));
vi.mock('src/i18n/i18n', () => ({
  default: {
    t: vi.fn((key: string) => key),
  },
}));

describe('useOrderTracking', () => {
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
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useOrderTracking('order-123'));

    expect(result.current).toEqual({
      currentStatus: null,
      lastUpdate: null,
      statusHistory: [],
      isSubscribed: true,
    });
  });

  it('should subscribe to order when orderId is provided', () => {
    renderHook(() => useOrderTracking('order-123'));

    expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.SUBSCRIBE_ORDER, {
      order_id: 'order-123',
    });
  });

  it('should register socket listener', () => {
    renderHook(() => useOrderTracking('order-123'));

    expect(mockSocket.on).toHaveBeenCalledWith(
      SocketEvent.ORDER_STATUS_UPDATED,
      expect.any(Function),
    );
  });

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => useOrderTracking('order-123'));

    unmount();

    expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.UNSUBSCRIBE_ORDER, {
      order_id: 'order-123',
    });
    expect(mockSocket.off).toHaveBeenCalledWith(
      SocketEvent.ORDER_STATUS_UPDATED,
      expect.any(Function),
    );
  });

  it('should not subscribe when orderId is undefined', () => {
    renderHook(() => useOrderTracking(undefined));

    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
});
