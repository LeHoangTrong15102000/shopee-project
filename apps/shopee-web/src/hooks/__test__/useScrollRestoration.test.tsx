import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useScrollRestoration } from '../useScrollRestoration'
import { BrowserRouter } from 'react-router'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('useScrollRestoration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render and return expected shape', () => {
    const { result } = renderHook(() => useScrollRestoration(), { wrapper })

    expect(result.current).toHaveProperty('saveCurrentPosition')
    expect(result.current).toHaveProperty('restorePosition')
    expect(result.current).toHaveProperty('scrollToTop')
    expect(typeof result.current.saveCurrentPosition).toBe('function')
    expect(typeof result.current.restorePosition).toBe('function')
    expect(typeof result.current.scrollToTop).toBe('function')
  })

  it('should handle custom key', () => {
    const { result } = renderHook(() => useScrollRestoration('custom-key'), { wrapper })

    expect(result.current.saveCurrentPosition).toBeDefined()
  })

  it('should handle enabled false', () => {
    const { result } = renderHook(() => useScrollRestoration(undefined, false), { wrapper })

    expect(result.current.saveCurrentPosition).toBeDefined()
  })
})
