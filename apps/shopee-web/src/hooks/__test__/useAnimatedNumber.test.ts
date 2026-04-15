import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useAnimatedNumber from '../useAnimatedNumber'

describe('useAnimatedNumber', () => {
  let rafCallbacks: ((time: number) => void)[] = []
  let rafId = 0

  beforeEach(() => {
    rafCallbacks = []
    rafId = 0
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb)
      return ++rafId
    })
    vi.spyOn(performance, 'now').mockReturnValue(0)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns initial value', () => {
    const { result } = renderHook(() => useAnimatedNumber(100))
    expect(result.current).toBe(100)
  })

  it('handles zero value', () => {
    const { result } = renderHook(() => useAnimatedNumber(0))
    expect(result.current).toBe(0)
  })

  it('handles custom duration', () => {
    const { result } = renderHook(() => useAnimatedNumber(50, 200))
    expect(result.current).toBe(50)
  })

  it('animates when value changes', () => {
    const { result, rerender } = renderHook(({ value }) => useAnimatedNumber(value, 400), {
      initialProps: { value: 0 },
    })

    rerender({ value: 100 })

    // requestAnimationFrame should have been called
    expect(window.requestAnimationFrame).toHaveBeenCalled()

    // Simulate animation at halfway point
    vi.mocked(performance.now).mockReturnValue(200)
    act(() => {
      if (rafCallbacks.length > 0) {
        rafCallbacks[rafCallbacks.length - 1](200)
      }
    })

    // Value should be partially animated (not 0, not 100 yet)
    expect(result.current).toBeGreaterThan(0)
  })

  it('completes animation at end of duration', () => {
    const { result, rerender } = renderHook(({ value }) => useAnimatedNumber(value, 400), {
      initialProps: { value: 0 },
    })

    rerender({ value: 100 })

    // Simulate animation at end
    vi.mocked(performance.now).mockReturnValue(400)
    act(() => {
      if (rafCallbacks.length > 0) {
        rafCallbacks[rafCallbacks.length - 1](400)
      }
    })

    expect(result.current).toBe(100)
  })

  it('does not animate when value stays the same', () => {
    const { rerender } = renderHook(({ value }) => useAnimatedNumber(value, 400), {
      initialProps: { value: 50 },
    })

    vi.mocked(window.requestAnimationFrame).mockClear()
    rerender({ value: 50 })

    expect(window.requestAnimationFrame).not.toHaveBeenCalled()
  })

  it('handles negative values', () => {
    const { result } = renderHook(() => useAnimatedNumber(-50))
    expect(result.current).toBe(-50)
  })
})
