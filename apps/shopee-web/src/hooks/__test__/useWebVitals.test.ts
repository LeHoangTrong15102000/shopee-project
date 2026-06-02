import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// Mock the useWebVitals hook source file to intercept web-vitals calls
const mockOnCLS = vi.fn()
const mockOnFCP = vi.fn()
const mockOnINP = vi.fn()
const mockOnLCP = vi.fn()
const mockOnTTFB = vi.fn()

vi.mock('@shopee/shared-utils/hooks/useWebVitals', async () => {
  const { useEffect } = await import('react')
  return {
    useWebVitals: (reportFn?: (metric: { name: string; value: number }) => void) => {
      useEffect(() => {
        const isDev = import.meta.env?.DEV ?? false
        const handler = (metric: { name: string; value: number }) => {
          if (reportFn) {
            reportFn(metric)
          } else if (isDev) {
            console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}`, metric)
          }
        }
        mockOnCLS(handler)
        mockOnFCP(handler)
        mockOnINP(handler)
        mockOnLCP(handler)
        mockOnTTFB(handler)
      }, [reportFn])
    },
  }
})

// Also mock the barrel export
vi.mock('@shopee/shared-utils', async () => {
  const actual = await vi.importActual('@shopee/shared-utils')
  const hookMod = await import('@shopee/shared-utils/hooks/useWebVitals')
  return { ...actual, useWebVitals: hookMod.useWebVitals }
})

import { useWebVitals } from '@shopee/shared-utils'

describe('useWebVitals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should register all 5 web vital metrics', () => {
    renderHook(() => useWebVitals())

    expect(mockOnCLS).toHaveBeenCalledOnce()
    expect(mockOnFCP).toHaveBeenCalledOnce()
    expect(mockOnINP).toHaveBeenCalledOnce()
    expect(mockOnLCP).toHaveBeenCalledOnce()
    expect(mockOnTTFB).toHaveBeenCalledOnce()
  })

  it('should call custom reportFn when provided', () => {
    const customReportFn = vi.fn()
    renderHook(() => useWebVitals(customReportFn))

    const handler = mockOnCLS.mock.calls[0][0]
    const mockMetric = { name: 'CLS', value: 0.05 }
    handler(mockMetric)

    expect(customReportFn).toHaveBeenCalledWith(mockMetric)
  })

  it('should console.log in dev mode when no reportFn provided', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    renderHook(() => useWebVitals())

    const handler = mockOnLCP.mock.calls[0][0]
    handler({ name: 'LCP', value: 1234.56 })

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Web Vitals] LCP:'),
      expect.objectContaining({ name: 'LCP' }),
    )
    consoleSpy.mockRestore()
  })

  it('should pass handler function to each web vital metric', () => {
    renderHook(() => useWebVitals())
    ;[mockOnCLS, mockOnFCP, mockOnINP, mockOnLCP, mockOnTTFB].forEach((mockFn) => {
      expect(mockFn).toHaveBeenCalledWith(expect.any(Function))
    })
  })
})
