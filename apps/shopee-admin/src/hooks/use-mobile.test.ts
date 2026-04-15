import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from './use-mobile'

describe('useIsMobile', () => {
  let addEventListenerSpy: ReturnType<typeof vi.fn>
  let removeEventListenerSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    addEventListenerSpy = vi.fn()
    removeEventListenerSpy = vi.fn()
  })

  const mockMatchMedia = (matches: boolean) => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: addEventListenerSpy,
        removeEventListener: removeEventListenerSpy,
        dispatchEvent: vi.fn(),
      })),
    })
  }

  it('returns true when viewport is below mobile breakpoint', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('returns false when viewport is above mobile breakpoint', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('registers change event listener', () => {
    mockMatchMedia(false)
    renderHook(() => useIsMobile())
    expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('cleans up event listener on unmount', () => {
    mockMatchMedia(false)
    const { unmount } = renderHook(() => useIsMobile())
    unmount()
    expect(removeEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('updates when media query changes', () => {
    let changeHandler: ((event: MediaQueryListEvent) => void) | null = null

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event: string, handler: (event: MediaQueryListEvent) => void) => {
          if (event === 'change') changeHandler = handler
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    if (changeHandler) {
      act(() => {
        changeHandler!({ matches: true } as MediaQueryListEvent)
      })
    }
    expect(result.current).toBe(true)
  })
})
