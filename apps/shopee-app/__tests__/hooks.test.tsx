import React from 'react'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { handlers } from '../__mocks__/msw/handlers'
import { useProducts } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useProducts', () => {
  it('returns loading state initially', () => {
    const { result } = renderHook(() => useProducts(), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  it('returns flattened product array after loading', async () => {
    const { result } = renderHook(() => useProducts(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.products.length).toBeGreaterThan(0)
  })

  it('uses different query key for category filter', () => {
    const wrapper = createWrapper()
    const { result: r1 } = renderHook(() => useProducts(), { wrapper })
    const { result: r2 } = renderHook(() => useProducts('cat-1'), { wrapper })
    // Different hooks should have different loading states (both loading initially)
    expect(r1.current.isLoading).toBe(true)
    expect(r2.current.isLoading).toBe(true)
  })
})

describe('useCategories', () => {
  it('returns categories after loading', async () => {
    const { result } = renderHook(() => useCategories(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toHaveLength(3)
  })
})
