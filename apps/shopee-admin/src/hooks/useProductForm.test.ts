import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from 'src/test-utils'
import { useProductFormData, useCreateProduct, useUpdateProduct } from './useProductForm'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('useProductFormData', () => {
  it('fetches product data when ID is provided', async () => {
    const { result } = renderHook(() => useProductFormData('prod-1'), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
    expect(result.current.data?._id).toBe('prod-1')
  })

  it('is disabled when no ID provided', () => {
    const { result } = renderHook(() => useProductFormData(undefined), {
      wrapper: createQueryWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useCreateProduct', () => {
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
})

describe('useUpdateProduct', () => {
  it('updates a product', async () => {
    const { result } = renderHook(() => useUpdateProduct(), { wrapper: createQueryWrapper() })
    result.current.mutate({
      id: 'prod-1',
      data: {
        name: 'Updated',
        price: 200000,
        quantity: 5,
        category: 'cat-1',
        image: 'https://example.com/img.jpg',
      },
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
