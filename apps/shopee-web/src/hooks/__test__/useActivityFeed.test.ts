import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import useActivityFeed from '../useActivityFeed'

vi.mock('../useSocket', () => ({
  default: vi.fn(() => ({ socket: null, isConnected: false })),
}))

describe('useActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render and return expected shape', () => {
    const { result } = renderHook(() => useActivityFeed('product-123'))

    expect(result.current).toHaveProperty('activities')
    expect(result.current).toHaveProperty('latestActivity')
    expect(Array.isArray(result.current.activities)).toBe(true)
    expect(result.current.latestActivity).toBeNull()
  })

  it('should handle undefined productId', () => {
    const { result } = renderHook(() => useActivityFeed(undefined))

    expect(result.current.activities).toEqual([])
    expect(result.current.latestActivity).toBeNull()
  })
})
