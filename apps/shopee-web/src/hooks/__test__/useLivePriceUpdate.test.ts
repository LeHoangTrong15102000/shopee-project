import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useLivePriceUpdate from '../useLivePriceUpdate'
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

describe('useLivePriceUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return null prices initially', () => {
    const { result } = renderHook(() => useLivePriceUpdate('prod-123'))

    expect(result.current.price).toBeNull()
    expect(result.current.priceBeforeDiscount).toBeNull()
    expect(result.current.hasChanged).toBe(false)
    expect(result.current.previousPrice).toBeNull()
  })

  it('should subscribe to product room when productId is provided', () => {
    renderHook(() => useLivePriceUpdate('prod-123'))

    expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.SUBSCRIBE_PRODUCT, {
      product_id: 'prod-123',
    })
  })

  it('should update price on PRICE_UPDATED event', () => {
    const { result } = renderHook(() => useLivePriceUpdate('prod-123'))

    const getSocketHandler = (eventName: string) => {
      const calls = mockSocket.on.mock.calls
      const call = calls.find((c: any[]) => c[0] === eventName)
      return call ? call[1] : undefined
    }

    const handler = getSocketHandler(SocketEvent.PRICE_UPDATED)
    expect(handler).toBeDefined()

    const priceUpdate = {
      product_id: 'prod-123',
      old_price: 100,
      new_price: 80,
      new_price_before_discount: 120,
    }

    act(() => {
      handler(priceUpdate)
    })

    expect(result.current.price).toBe(80)
    expect(result.current.priceBeforeDiscount).toBe(120)
    expect(result.current.previousPrice).toBe(100)
    expect(result.current.hasChanged).toBe(true)
  })

  it('should reset hasChanged flag after 3 seconds', () => {
    const { result } = renderHook(() => useLivePriceUpdate('prod-123'))

    const getSocketHandler = (eventName: string) => {
      const calls = mockSocket.on.mock.calls
      const call = calls.find((c: any[]) => c[0] === eventName)
      return call ? call[1] : undefined
    }

    const handler = getSocketHandler(SocketEvent.PRICE_UPDATED)

    act(() => {
      handler({
        product_id: 'prod-123',
        old_price: 100,
        new_price: 80,
        new_price_before_discount: 120,
      })
    })

    expect(result.current.hasChanged).toBe(true)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.hasChanged).toBe(false)
  })

  it('should handle no productId gracefully', () => {
    const { result } = renderHook(() => useLivePriceUpdate(undefined))

    expect(result.current.price).toBeNull()
    expect(mockSocket.emit).not.toHaveBeenCalled()
  })

  it('should unsubscribe from product room on unmount', () => {
    const { unmount } = renderHook(() => useLivePriceUpdate('prod-123'))

    unmount()

    expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvent.UNSUBSCRIBE_PRODUCT, {
      product_id: 'prod-123',
    })
    expect(mockSocket.off).toHaveBeenCalledWith(SocketEvent.PRICE_UPDATED, expect.any(Function))
  })

  it('should ignore price updates for different product IDs', () => {
    const { result } = renderHook(() => useLivePriceUpdate('prod-123'))

    const getSocketHandler = (eventName: string) => {
      const calls = mockSocket.on.mock.calls
      const call = calls.find((c: any[]) => c[0] === eventName)
      return call ? call[1] : undefined
    }

    const handler = getSocketHandler(SocketEvent.PRICE_UPDATED)

    act(() => {
      handler({
        product_id: 'prod-999',
        old_price: 100,
        new_price: 80,
        new_price_before_discount: 120,
      })
    })

    expect(result.current.price).toBeNull()
    expect(result.current.hasChanged).toBe(false)
  })
})
