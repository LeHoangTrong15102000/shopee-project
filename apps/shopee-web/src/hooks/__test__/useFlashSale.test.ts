import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useFlashSale from '../useFlashSale';
import { SocketEvent } from 'src/types/socket.types';

vi.mock('../useSocket');

describe('useFlashSale', () => {
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
    const { result } = renderHook(() => useFlashSale('sale-123'));

    expect(result.current).toEqual({
      remainingSeconds: 0,
      products: [],
      isActive: false,
      isEnded: false,
      isConnectedToServer: true,
    });
  });

  it('should subscribe to flash sale when saleId is provided', () => {
    renderHook(() => useFlashSale('sale-123'));

    expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.SUBSCRIBE_FLASH_SALE, {
      sale_id: 'sale-123',
    });
  });

  it('should register socket listeners', () => {
    renderHook(() => useFlashSale('sale-123'));

    expect(mockSocket.on).toHaveBeenCalledWith(SocketEvent.FLASH_SALE_TICK, expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(
      SocketEvent.FLASH_SALE_STOCK_UPDATE,
      expect.any(Function),
    );
  });

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => useFlashSale('sale-123'));

    unmount();

    expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.UNSUBSCRIBE_FLASH_SALE, {
      sale_id: 'sale-123',
    });
    expect(mockSocket.off).toHaveBeenCalledWith(SocketEvent.FLASH_SALE_TICK, expect.any(Function));
    expect(mockSocket.off).toHaveBeenCalledWith(
      SocketEvent.FLASH_SALE_STOCK_UPDATE,
      expect.any(Function),
    );
  });

  it('should not subscribe when saleId is undefined', () => {
    renderHook(() => useFlashSale(undefined));

    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
});
