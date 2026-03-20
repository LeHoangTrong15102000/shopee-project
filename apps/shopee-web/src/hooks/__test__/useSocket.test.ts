import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useSocket from '../useSocket';

vi.mock('src/contexts/socket.context', () => ({
  useSocketContext: vi.fn(),
}));

describe('useSocket', () => {
  const mockSocket = {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const socketContext = await import('src/contexts/socket.context');
    vi.mocked(socketContext.useSocketContext).mockReturnValue({
      socket: mockSocket as never,
      isConnected: true,
      connectionStatus: 'connected',
      connect: vi.fn(),
      disconnect: vi.fn(),
    });
  });

  it('should return socket context values', () => {
    const { result } = renderHook(() => useSocket());

    expect(result.current.socket).toBe(mockSocket);
    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionStatus).toBe('connected');
  });

  it('should provide emit function', () => {
    const { result } = renderHook(() => useSocket());

    result.current.emit('test-event', { data: 'test' });

    expect(mockSocket.emit).toHaveBeenCalledWith('test-event', { data: 'test' });
  });

  it('should provide on function', () => {
    const { result } = renderHook(() => useSocket());
    const handler = vi.fn();

    result.current.on('test-event', handler);

    expect(mockSocket.on).toHaveBeenCalledWith('test-event', handler);
  });

  it('should provide off function', () => {
    const { result } = renderHook(() => useSocket());
    const handler = vi.fn();

    result.current.off('test-event', handler);

    expect(mockSocket.off).toHaveBeenCalledWith('test-event', handler);
  });
});
