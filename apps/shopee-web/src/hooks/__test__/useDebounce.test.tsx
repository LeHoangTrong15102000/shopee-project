import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import useDebounce from '../useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500))
    expect(result.current).toBe('initial')
  })

  it('debounces value changes after delay', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'first', delay: 500 }
    })

    expect(result.current).toBe('first')

    rerender({ value: 'second', delay: 500 })
    expect(result.current).toBe('first')

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('first')

    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('second')
  })

  it('trims whitespace from debounced value', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: '  trimmed  ', delay: 300 }
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('trimmed')

    rerender({ value: '   spaces   ', delay: 300 })
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current).toBe('spaces')
  })

  it('handles null value', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: null as string | null, delay: 500 }
    })

    expect(result.current).toBe(null)

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current).toBeUndefined()

    rerender({ value: 'not null', delay: 500 })
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current).toBe('not null')
  })

  it('cleans up timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
    const { unmount, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'test', delay: 500 }
    })

    rerender({ value: 'changed', delay: 500 })
    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })
})
