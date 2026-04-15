import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useViewerCount from '../useViewerCount'

const mockSocketOn = vi.fn()
const mockSocketOff = vi.fn()
const mockSocket = { on: mockSocketOn, off: mockSocketOff }

vi.mock('../useSocket', () => ({
  default: vi.fn(() => ({ socket: mockSocket, isConnected: true })),
}))

describe('useViewerCount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with zero viewers and not popular', () => {
    const { result } = renderHook(() => useViewerCount('p1'))
    expect(result.current.viewerCount).toBe(0)
    expect(result.current.isPopular).toBe(false)
  })

  it('subscribes to VIEWER_COUNT_UPDATE on mount', () => {
    renderHook(() => useViewerCount('p1'))
    expect(mockSocketOn).toHaveBeenCalledWith('viewer_count_update', expect.any(Function))
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useViewerCount('p1'))
    unmount()
    expect(mockSocketOff).toHaveBeenCalledWith('viewer_count_update', expect.any(Function))
  })

  it('updates viewer count when event matches product', () => {
    const { result } = renderHook(() => useViewerCount('p1'))
    const handler = mockSocketOn.mock.calls.find((c) => c[0] === 'viewer_count_update')?.[1]
    act(() => {
      handler({ product_id: 'p1', viewer_count: 15 })
    })
    expect(result.current.viewerCount).toBe(15)
    expect(result.current.isPopular).toBe(true)
  })

  it('ignores events for different product', () => {
    const { result } = renderHook(() => useViewerCount('p1'))
    const handler = mockSocketOn.mock.calls.find((c) => c[0] === 'viewer_count_update')?.[1]
    act(() => {
      handler({ product_id: 'p2', viewer_count: 50 })
    })
    expect(result.current.viewerCount).toBe(0)
  })

  it('does not subscribe when productId is undefined', () => {
    mockSocketOn.mockClear()
    renderHook(() => useViewerCount(undefined))
    // Should not call socket.on since productId is falsy
    expect(mockSocketOn).not.toHaveBeenCalled()
  })

  it('isPopular is false when count <= 10', () => {
    const { result } = renderHook(() => useViewerCount('p1'))
    const handler = mockSocketOn.mock.calls.find((c) => c[0] === 'viewer_count_update')?.[1]
    act(() => {
      handler({ product_id: 'p1', viewer_count: 10 })
    })
    expect(result.current.isPopular).toBe(false)
  })

  it('isPopular is true when count > 10', () => {
    const { result } = renderHook(() => useViewerCount('p1'))
    const handler = mockSocketOn.mock.calls.find((c) => c[0] === 'viewer_count_update')?.[1]
    act(() => {
      handler({ product_id: 'p1', viewer_count: 11 })
    })
    expect(result.current.isPopular).toBe(true)
  })
})
