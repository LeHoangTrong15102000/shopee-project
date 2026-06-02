// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock web-vitals
const mockOnCLS = vi.fn()
const mockOnFCP = vi.fn()
const mockOnINP = vi.fn()
const mockOnLCP = vi.fn()
const mockOnTTFB = vi.fn()

vi.mock('web-vitals', () => ({
  onCLS: mockOnCLS,
  onFCP: mockOnFCP,
  onINP: mockOnINP,
  onLCP: mockOnLCP,
  onTTFB: mockOnTTFB,
}))

// Minimal renderHook using require (react-dom not in shared-utils deps)
function renderHook<T>(hookFn: () => T) {
  const React = require('react')
  const { createRoot } = require('react-dom/client')
  const { act } = React

  let result: T
  function TestComponent() {
    result = hookFn()
    return null
  }

  const container = document.createElement('div')
  const root = createRoot(container)

  act(() => {
    root.render(React.createElement(TestComponent))
  })

  return { result: result! }
}

const flushPromises = () => new Promise<void>((r) => setTimeout(r, 50))

describe('useWebVitals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers all 5 web vitals observers via dynamic import', async () => {
    const { useWebVitals } = await import('../useWebVitals')
    const { act } = require('react')

    act(() => {
      renderHook(() => useWebVitals())
    })

    await act(async () => {
      await flushPromises()
    })

    expect(mockOnCLS).toHaveBeenCalled()
    expect(mockOnFCP).toHaveBeenCalled()
    expect(mockOnINP).toHaveBeenCalled()
    expect(mockOnLCP).toHaveBeenCalled()
    expect(mockOnTTFB).toHaveBeenCalled()
  })

  it('calls custom reportFn when provided', async () => {
    const { useWebVitals } = await import('../useWebVitals')
    const { act } = require('react')
    const reportFn = vi.fn()

    act(() => {
      renderHook(() => useWebVitals(reportFn))
    })

    await act(async () => {
      await flushPromises()
    })

    // Get the handler that was passed to onCLS
    const clsCalls = mockOnCLS.mock.calls
    expect(clsCalls.length).toBeGreaterThan(0)
    const handler = clsCalls[clsCalls.length - 1][0]
    const metric = { name: 'CLS', value: 0.05 }
    handler(metric)

    expect(reportFn).toHaveBeenCalledWith(metric)
  })

  it('logs to console in dev mode when no reportFn provided', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {
      /* noop */
    })
    const { useWebVitals } = await import('../useWebVitals')
    const { act } = require('react')

    act(() => {
      renderHook(() => useWebVitals())
    })

    await act(async () => {
      await flushPromises()
    })

    const lcpCalls = mockOnLCP.mock.calls
    expect(lcpCalls.length).toBeGreaterThan(0)
    const handler = lcpCalls[lcpCalls.length - 1][0]
    const metric = { name: 'LCP', value: 1234.56 }
    handler(metric)

    expect(consoleSpy).toHaveBeenCalledWith('[Web Vitals] LCP: 1234.56', metric)
    consoleSpy.mockRestore()
  })

  it('uses same handler for all 5 metrics', async () => {
    const { useWebVitals } = await import('../useWebVitals')
    const { act } = require('react')
    const reportFn = vi.fn()

    act(() => {
      renderHook(() => useWebVitals(reportFn))
    })

    await act(async () => {
      await flushPromises()
    })

    const getLastHandler = (mock: ReturnType<typeof vi.fn>) =>
      mock.mock.calls[mock.mock.calls.length - 1][0]

    const handlers = [
      getLastHandler(mockOnCLS),
      getLastHandler(mockOnFCP),
      getLastHandler(mockOnINP),
      getLastHandler(mockOnLCP),
      getLastHandler(mockOnTTFB),
    ]

    for (const handler of handlers) {
      expect(handler).toBe(handlers[0])
    }
  })

  it('silently handles web-vitals import failure', async () => {
    vi.doMock('web-vitals', () => {
      throw new Error('Module not found')
    })

    vi.resetModules()
    const mod = await import('../useWebVitals')
    const { act } = require('react')

    // Should not throw
    expect(() => {
      act(() => {
        renderHook(() => mod.useWebVitals())
      })
    }).not.toThrow()

    // Restore original mock
    vi.doMock('web-vitals', () => ({
      onCLS: mockOnCLS,
      onFCP: mockOnFCP,
      onINP: mockOnINP,
      onLCP: mockOnLCP,
      onTTFB: mockOnTTFB,
    }))
  })
})
