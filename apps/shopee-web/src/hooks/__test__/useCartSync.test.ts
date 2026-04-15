import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import useCartSync from '../useCartSync'
import { SocketEvent } from 'src/types/socket.types'

vi.mock('../useSocket')
vi.mock('src/contexts/app.context', async () => {
  const React = await import('react')
  return {
    AppContext: React.createContext({ isAuthenticated: true, profile: { _id: 'user1' } }),
  }
})
vi.mock('react-toastify', () => ({
  toast: {
    info: vi.fn(),
  },
}))
vi.mock('src/i18n/i18n', () => ({
  default: {
    t: vi.fn((key: string) => key),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useCartSync', () => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    const useSocket = await import('../useSocket')
    vi.mocked(useSocket.default).mockReturnValue({
      socket: mockSocket as never,
      isConnected: true,
      connectionStatus: 'connected',
      connect: vi.fn(),
      disconnect: vi.fn(),
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  it('should return initial state', () => {
    const { result } = renderHook(() => useCartSync(), { wrapper: createWrapper() })

    expect(result.current).toEqual({
      lastSyncTimestamp: null,
      isSyncing: false,
    })
  })

  it('should register socket listener on mount', () => {
    renderHook(() => useCartSync(), { wrapper: createWrapper() })

    expect(mockSocket.on).toHaveBeenCalledWith(SocketEvent.CART_UPDATED, expect.any(Function))
  })

  it('should unregister socket listener on unmount', () => {
    const { unmount } = renderHook(() => useCartSync(), { wrapper: createWrapper() })

    unmount()

    expect(mockSocket.off).toHaveBeenCalledWith(SocketEvent.CART_UPDATED, expect.any(Function))
  })
})
