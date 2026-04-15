import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import usePresence from '../usePresence'
import { SocketEvent } from 'src/types/socket.types'

const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
}

vi.mock('../useSocket', () => ({
  default: vi.fn(() => ({
    socket: mockSocket,
    isConnected: true,
    emit: mockSocket.emit,
    on: mockSocket.on,
    off: mockSocket.off,
  })),
}))

describe('usePresence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return offline status initially', () => {
    const { result } = renderHook(() => usePresence('user-123'))

    expect(result.current.status).toBe('offline')
    expect(result.current.lastSeen).toBeNull()
    expect(result.current.isOnline).toBe(false)
  })

  it('should emit GET_PRESENCE on mount when userId is provided', () => {
    renderHook(() => usePresence('user-123'))

    expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.GET_PRESENCE, {
      user_id: 'user-123',
    })
  })

  it('should update status on PRESENCE_STATUS event', () => {
    const { result } = renderHook(() => usePresence('user-123'))

    const getSocketHandler = (eventName: string) => {
      const calls = mockSocket.on.mock.calls
      const call = calls.find((c: any[]) => c[0] === eventName)
      return call ? call[1] : undefined
    }

    const handler = getSocketHandler(SocketEvent.PRESENCE_STATUS)
    expect(handler).toBeDefined()

    const presencePayload = {
      user_id: 'user-123',
      status: 'online' as const,
      last_seen: '2026-03-16T10:00:00Z',
    }

    act(() => {
      handler(presencePayload)
    })

    expect(result.current.status).toBe('online')
    expect(result.current.lastSeen).toBe('2026-03-16T10:00:00Z')
    expect(result.current.isOnline).toBe(true)
  })

  it('should update status on PRESENCE_UPDATE event', () => {
    const { result } = renderHook(() => usePresence('user-123'))

    const getSocketHandler = (eventName: string) => {
      const calls = mockSocket.on.mock.calls
      const call = calls.find((c: any[]) => c[0] === eventName)
      return call ? call[1] : undefined
    }

    const handler = getSocketHandler(SocketEvent.PRESENCE_UPDATE)
    expect(handler).toBeDefined()

    const updatePayload = {
      user_id: 'user-123',
      status: 'online' as const,
      last_seen: null,
    }

    act(() => {
      handler(updatePayload)
    })

    expect(result.current.status).toBe('online')
    expect(result.current.isOnline).toBe(true)
  })

  it('should derive isOnline from status correctly', () => {
    const { result } = renderHook(() => usePresence('user-123'))

    const getSocketHandler = (eventName: string) => {
      const calls = mockSocket.on.mock.calls
      const call = calls.find((c: any[]) => c[0] === eventName)
      return call ? call[1] : undefined
    }

    const handler = getSocketHandler(SocketEvent.PRESENCE_STATUS)

    act(() => {
      handler({
        user_id: 'user-123',
        status: 'offline' as const,
        last_seen: '2026-03-16T09:00:00Z',
      })
    })

    expect(result.current.isOnline).toBe(false)

    act(() => {
      handler({
        user_id: 'user-123',
        status: 'online' as const,
        last_seen: null,
      })
    })

    expect(result.current.isOnline).toBe(true)
  })

  it('should not emit GET_PRESENCE when userId is undefined', () => {
    renderHook(() => usePresence(undefined))

    expect(mockSocket.emit).not.toHaveBeenCalled()
  })

  it('should cleanup socket listeners on unmount', () => {
    const { unmount } = renderHook(() => usePresence('user-123'))

    unmount()

    expect(mockSocket.off).toHaveBeenCalledWith(SocketEvent.PRESENCE_STATUS, expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith(SocketEvent.PRESENCE_UPDATE, expect.any(Function))
  })

  it('should ignore presence updates for different user IDs', () => {
    const { result } = renderHook(() => usePresence('user-123'))

    const getSocketHandler = (eventName: string) => {
      const calls = mockSocket.on.mock.calls
      const call = calls.find((c: any[]) => c[0] === eventName)
      return call ? call[1] : undefined
    }

    const handler = getSocketHandler(SocketEvent.PRESENCE_UPDATE)

    act(() => {
      handler({
        user_id: 'user-999',
        status: 'online' as const,
        last_seen: null,
      })
    })

    expect(result.current.status).toBe('offline')
    expect(result.current.isOnline).toBe(false)
  })
})
