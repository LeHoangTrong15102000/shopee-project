import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from 'src/test-utils'
import { useProducts, useDeleteProduct } from 'src/hooks/useProducts'
import { useCreateProduct } from 'src/hooks/useProductForm'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('Product CRUD Integration', () => {
  it('loads product list', async () => {
    const { result } = renderHook(() => useProducts(0), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.products.length).toBeGreaterThan(0)
  })

  it('creates a product', async () => {
    const { result } = renderHook(() => useCreateProduct(), { wrapper: createQueryWrapper() })
    result.current.mutate({
      name: 'New Product',
      price: 100000,
      quantity: 10,
      category: 'cat-1',
      image: 'https://example.com/img.jpg',
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('deletes a product', async () => {
    const { result } = renderHook(() => useDeleteProduct(), { wrapper: createQueryWrapper() })
    result.current.mutate('prod-1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('full CRUD flow: list → create → delete', async () => {
    const wrapper = createQueryWrapper()

    // List
    const { result: listResult } = renderHook(() => useProducts(0), { wrapper })
    await waitFor(() => expect(listResult.current.isSuccess).toBe(true))
    const initialCount = listResult.current.data?.products.length ?? 0
    expect(initialCount).toBeGreaterThan(0)

    // Create
    const { result: createResult } = renderHook(() => useCreateProduct(), { wrapper })
    createResult.current.mutate({
      name: 'Integration Test Product',
      price: 50000,
      quantity: 5,
      category: 'cat-1',
      image: 'https://example.com/test.jpg',
    })
    await waitFor(() => expect(createResult.current.isSuccess).toBe(true))

    // Delete
    const { result: deleteResult } = renderHook(() => useDeleteProduct(), { wrapper })
    deleteResult.current.mutate('prod-1')
    await waitFor(() => expect(deleteResult.current.isSuccess).toBe(true))
  })
})

