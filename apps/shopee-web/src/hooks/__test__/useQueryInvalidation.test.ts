import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useQueryInvalidation } from '../useQueryInvalidation'

describe('useQueryInvalidation', () => {
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

  it('invalidateProducts calls invalidateQueries', async () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useQueryInvalidation(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.invalidateProducts()
    })

    expect(invalidateQueriesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['products']
      })
    )
  })

  it('invalidateCart calls invalidateQueries', async () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useQueryInvalidation(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.invalidateCart()
    })

    expect(invalidateQueriesSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['purchases', { status: -1 }]
      })
    )
  })

  it('clearAllCache calls queryClient.clear()', () => {
    const clearSpy = vi.spyOn(queryClient, 'clear')
    const { result } = renderHook(() => useQueryInvalidation(), { wrapper: createWrapper() })

    act(() => {
      result.current.clearAllCache()
    })

    expect(clearSpy).toHaveBeenCalledTimes(1)
  })

  it('removeQuery calls queryClient.removeQueries with correct key', () => {
    const removeQueriesSpy = vi.spyOn(queryClient, 'removeQueries')
    const { result } = renderHook(() => useQueryInvalidation(), { wrapper: createWrapper() })
    const testKey = ['test', 'query', 'key']

    act(() => {
      result.current.removeQuery(testKey)
    })

    expect(removeQueriesSpy).toHaveBeenCalledWith({ queryKey: testKey })
  })

  it('batchInvalidate calls all operations', () => {
    const { result } = renderHook(() => useQueryInvalidation(), { wrapper: createWrapper() })

    const operation1 = vi.fn()
    const operation2 = vi.fn()
    const operation3 = vi.fn()

    act(() => {
      result.current.batchInvalidate([operation1, operation2, operation3])
    })

    expect(operation1).toHaveBeenCalledTimes(1)
    expect(operation2).toHaveBeenCalledTimes(1)
    expect(operation3).toHaveBeenCalledTimes(1)
  })
})
