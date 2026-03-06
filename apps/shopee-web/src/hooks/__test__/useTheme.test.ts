import { renderHook } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createElement, ReactNode } from 'react'
import { useTheme } from '../useTheme'
import { ThemeProvider, ThemeContext } from 'src/contexts/theme.context'

describe('useTheme', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    })

    const mockLocalStorage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      writable: true,
      value: mockLocalStorage
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns theme context when used within ThemeProvider', () => {
    const wrapper = ({ children }: { children: ReactNode }) => createElement(ThemeProvider, null, children)

    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current).toBeDefined()
    expect(result.current.theme).toBeDefined()
    expect(result.current.resolvedTheme).toBeDefined()
  })

  it('throws error when used outside ThemeProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useTheme())
    }).toThrow('useTheme must be used within a ThemeProvider')

    consoleError.mockRestore()
  })

  it('returns theme and toggleTheme from context', () => {
    const wrapper = ({ children }: { children: ReactNode }) => createElement(ThemeProvider, null, children)

    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.theme).toBe('system')
    expect(typeof result.current.toggleTheme).toBe('function')
    expect(typeof result.current.setTheme).toBe('function')
    expect(['light', 'dark']).toContain(result.current.resolvedTheme)
  })

  it('returns custom context values when provided', () => {
    const mockContextValue = {
      theme: 'dark' as const,
      resolvedTheme: 'dark' as const,
      setTheme: vi.fn(),
      toggleTheme: vi.fn()
    }

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(ThemeContext.Provider, { value: mockContextValue }, children)

    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.theme).toBe('dark')
    expect(result.current.resolvedTheme).toBe('dark')
    expect(result.current.setTheme).toBe(mockContextValue.setTheme)
    expect(result.current.toggleTheme).toBe(mockContextValue.toggleTheme)
  })
})
