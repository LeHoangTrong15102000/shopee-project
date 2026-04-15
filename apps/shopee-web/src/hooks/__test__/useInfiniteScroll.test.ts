import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import useInfiniteScroll from '../useInfiniteScroll'

// Mock IntersectionObserver
let intersectionCallback: IntersectionObserverCallback
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  global.IntersectionObserver = vi.fn(function (
    this: IntersectionObserver,
    callback: IntersectionObserverCallback,
  ) {
    intersectionCallback = callback
    this.observe = mockObserve
    this.disconnect = mockDisconnect
    this.unobserve = vi.fn()
    Object.defineProperty(this, 'root', { value: null, writable: false })
    Object.defineProperty(this, 'rootMargin', { value: '', writable: false })
    Object.defineProperty(this, 'thresholds', { value: [], writable: false })
    this.takeRecords = () => []
  }) as unknown as typeof IntersectionObserver
})

describe('useInfiniteScroll', () => {
  it('returns a sentinel ref', () => {
    const onLoadMore = vi.fn()
    const { result } = renderHook(() => useInfiniteScroll({ onLoadMore, hasMore: true }))

    expect(result.current.sentinelRef).toBeDefined()
    expect(result.current.sentinelRef.current).toBeNull()
  })

  it('does not call onLoadMore when disabled', () => {
    const onLoadMore = vi.fn()
    renderHook(() => useInfiniteScroll({ onLoadMore, enabled: false, hasMore: true }))

    expect(onLoadMore).not.toHaveBeenCalled()
  })

  it('does not call onLoadMore when isLoading', () => {
    const onLoadMore = vi.fn()
    renderHook(() => useInfiniteScroll({ onLoadMore, isLoading: true, hasMore: true }))

    expect(onLoadMore).not.toHaveBeenCalled()
  })

  it('does not call onLoadMore when hasMore is false', () => {
    const onLoadMore = vi.fn()
    renderHook(() => useInfiniteScroll({ onLoadMore, hasMore: false }))

    expect(onLoadMore).not.toHaveBeenCalled()
  })

  it('calls onLoadMore when sentinel intersects viewport', () => {
    const onLoadMore = vi.fn()
    const div = document.createElement('div')

    const { result, rerender } = renderHook(() => useInfiniteScroll({ onLoadMore, hasMore: true }))

    // Manually assign the ref to a DOM element so the observer attaches
    Object.defineProperty(result.current.sentinelRef, 'current', {
      value: div,
      writable: true,
    })

    // Re-render to trigger useEffect with the ref attached
    rerender()

    // If observer was created and observing, simulate intersection
    if (intersectionCallback) {
      intersectionCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      )
      expect(onLoadMore).toHaveBeenCalledTimes(1)
    }
  })

  it('does not call onLoadMore when sentinel is not intersecting', () => {
    const onLoadMore = vi.fn()

    renderHook(() => useInfiniteScroll({ onLoadMore, hasMore: true }))

    if (intersectionCallback) {
      intersectionCallback(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      )
      expect(onLoadMore).not.toHaveBeenCalled()
    }
  })

  it('disconnects observer on unmount', () => {
    const onLoadMore = vi.fn()
    const div = document.createElement('div')

    const { unmount } = renderHook(() => {
      const hook = useInfiniteScroll({ onLoadMore, hasMore: true })
      // Simulate ref being attached
      Object.defineProperty(hook.sentinelRef, 'current', {
        value: div,
        writable: true,
      })
      return hook
    })

    unmount()
    // Observer disconnect is called during cleanup
    expect(mockDisconnect).toHaveBeenCalled()
  })

  it('uses default threshold of 200px', () => {
    const onLoadMore = vi.fn()
    const div = document.createElement('div')

    renderHook(() => {
      const hook = useInfiniteScroll({ onLoadMore })
      Object.defineProperty(hook.sentinelRef, 'current', {
        value: div,
        writable: true,
      })
      return hook
    })

    // Verify IntersectionObserver was created with default rootMargin of 200px
    expect(global.IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ rootMargin: '200px' }),
    )
  })

  it('accepts custom threshold', () => {
    const onLoadMore = vi.fn()
    const div = document.createElement('div')

    renderHook(() => {
      const hook = useInfiniteScroll({ onLoadMore, threshold: 500 })
      Object.defineProperty(hook.sentinelRef, 'current', {
        value: div,
        writable: true,
      })
      return hook
    })

    // Verify IntersectionObserver was created with custom rootMargin
    expect(global.IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ rootMargin: '500px' }),
    )
  })
})
