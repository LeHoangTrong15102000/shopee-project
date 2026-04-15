import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from 'src/test-utils'
import { useProducts, useDeleteProduct, useDeleteManyProducts } from './useProducts'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('useProducts', () => {
  it('fetches products', async () => {
    const { result } = renderHook(() => useProducts(0), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.products).toBeDefined()
    expect(result.current.data?.products.length).toBeGreaterThan(0)
  })

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useProducts(0), { wrapper: createQueryWrapper() })
    expect(result.current.isLoading).toBe(true)
  })

  it('passes filter params to query', async () => {
    const { result } = renderHook(() => useProducts(0, { category: 'cat-1', name: 'test' }), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.products).toBeDefined()
  })
})

describe('useDeleteProduct', () => {
  it('deletes a product successfully', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useDeleteProduct(onSuccess), {
      wrapper: createQueryWrapper(),
    })
    result.current.mutate('prod-1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useDeleteManyProducts', () => {
  it('deletes multiple products', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useDeleteManyProducts(onSuccess), {
      wrapper: createQueryWrapper(),
    })
    result.current.mutate(['prod-1', 'prod-2'])
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
