import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useSearchWithCancellation } from '../useSearchWithCancellation'

vi.mock('src/apis/product.api', () => ({
  default: {
    getProducts: vi.fn(() => Promise.resolve({ data: { data: { products: [] } } }))
  }
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false }
    }
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useSearchWithCancellation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not fetch when name is empty (enabled: false)', async () => {
    const productApi = await import('src/apis/product.api')

    const { result } = renderHook(() => useSearchWithCancellation({ name: '' }), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false)
    })

    expect(productApi.default.getProducts).not.toHaveBeenCalled()
  })

  it('returns cancelSearch function', () => {
    const { result } = renderHook(() => useSearchWithCancellation({ name: 'test' }), {
      wrapper: createWrapper()
    })

    expect(typeof result.current.cancelSearch).toBe('function')
  })

  it('cancelSearch calls queryClient.cancelQueries', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    })
    const cancelQueriesSpy = vi.spyOn(queryClient, 'cancelQueries')

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useSearchWithCancellation({ name: 'phone' }), {
      wrapper
    })

    result.current.cancelSearch()

    expect(cancelQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['products', { name: 'phone' }]
    })
  })
})
