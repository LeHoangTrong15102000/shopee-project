import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { usePrefetch } from '../usePrefetch'

vi.mock('src/apis/product.api', () => ({
  default: {
    getProductDetail: vi.fn(),
    getProducts: vi.fn(),
    getSearchSuggestions: vi.fn()
  }
}))

vi.mock('src/apis/category.api', () => ({
  default: { getCategories: vi.fn() }
}))

vi.mock('src/apis/user.api', () => ({
  default: { getProfile: vi.fn() }
}))

vi.mock('src/apis/purchases.api', () => ({
  default: { getPurchases: vi.fn() }
}))

describe('usePrefetch', () => {
  let queryClient: QueryClient

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)
  }

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
    vi.clearAllMocks()
  })

  it('prefetchProduct calls queryClient.prefetchQuery with correct key', async () => {
    const prefetchQuerySpy = vi.spyOn(queryClient, 'prefetchQuery')
    const { result } = renderHook(() => usePrefetch(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.prefetchProduct('product-123')
    })

    expect(prefetchQuerySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['products', 'detail', 'product-123']
      })
    )
  })

  it('prefetchSearchSuggestions skips when searchTerm is too short', async () => {
    const prefetchQuerySpy = vi.spyOn(queryClient, 'prefetchQuery')
    const { result } = renderHook(() => usePrefetch(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.prefetchSearchSuggestions('a')
    })

    expect(prefetchQuerySpy).not.toHaveBeenCalled()
  })

  it('prefetchSearchSuggestions calls when searchTerm >= 2 chars', async () => {
    const prefetchQuerySpy = vi.spyOn(queryClient, 'prefetchQuery')
    const { result } = renderHook(() => usePrefetch(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.prefetchSearchSuggestions('ab')
    })

    expect(prefetchQuerySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['searchSuggestions', 'ab']
      })
    )
  })

  it('isCached returns true when data exists', () => {
    const testKey = ['test', 'key']
    queryClient.setQueryData(testKey, { data: 'cached' })

    const { result } = renderHook(() => usePrefetch(), { wrapper: createWrapper() })

    expect(result.current.isCached(testKey)).toBe(true)
  })

  it('isCached returns false when no data', () => {
    const { result } = renderHook(() => usePrefetch(), { wrapper: createWrapper() })

    expect(result.current.isCached(['nonexistent', 'key'])).toBe(false)
  })

  it('batchPrefetch calls all provided functions', () => {
    const { result } = renderHook(() => usePrefetch(), { wrapper: createWrapper() })

    const fn1 = vi.fn()
    const fn2 = vi.fn()
    const fn3 = vi.fn()

    act(() => {
      result.current.batchPrefetch([fn1, fn2, fn3])
    })

    expect(fn1).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledTimes(1)
    expect(fn3).toHaveBeenCalledTimes(1)
  })
})
