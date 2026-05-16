import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import useSearchProducts from '../useSearchProducts'

// Unmock nuqs hooks so real behavior works with NuqsTestingAdapter
vi.unmock('src/hooks/nuqs')

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NuqsTestingAdapter>{children}</NuqsTestingAdapter>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('useSearchProducts', () => {
  it('returns all expected form utilities', () => {
    const { result } = renderHook(() => useSearchProducts(), { wrapper: createWrapper() })

    expect(typeof result.current.onSubmitSearch).toBe('function')
    expect(typeof result.current.register).toBe('function')
    expect(typeof result.current.setSearchValue).toBe('function')
    expect(result.current.searchValue).toBe('')
    expect(Object.keys(result.current.errors)).toHaveLength(0)
  })

  it('register returns form registration with correct field name', () => {
    const { result } = renderHook(() => useSearchProducts(), { wrapper: createWrapper() })
    const registration = result.current.register('name')
    expect(registration.name).toBe('name')
    expect(registration.onChange).toBeDefined()
    expect(registration.onBlur).toBeDefined()
    expect(registration.ref).toBeDefined()
  })

  it('setSearchValue updates the search value', () => {
    const { result } = renderHook(() => useSearchProducts(), { wrapper: createWrapper() })

    act(() => {
      result.current.setSearchValue('iphone')
    })

    expect(result.current.searchValue).toBe('iphone')
  })

  it('setSearchValue can be called multiple times with different values', () => {
    const { result } = renderHook(() => useSearchProducts(), { wrapper: createWrapper() })

    act(() => {
      result.current.setSearchValue('iphone')
    })
    expect(result.current.searchValue).toBe('iphone')

    act(() => {
      result.current.setSearchValue('samsung')
    })
    expect(result.current.searchValue).toBe('samsung')

    act(() => {
      result.current.setSearchValue('')
    })
    expect(result.current.searchValue).toBe('')
  })
})
