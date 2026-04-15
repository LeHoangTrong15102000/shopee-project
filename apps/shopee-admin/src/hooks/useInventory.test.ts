import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from 'src/test-utils'
import { useLowStock, useOutOfStock, useUpdateStock, useBulkUpdateStock } from './useInventory'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('useLowStock', () => {
  it('fetches low stock products', async () => {
    const { result } = renderHook(() => useLowStock(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })
})

describe('useOutOfStock', () => {
  it('fetches out of stock products', async () => {
    const { result } = renderHook(() => useOutOfStock(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })
})

describe('useUpdateStock', () => {
  it('updates stock successfully', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useUpdateStock(onSuccess), {
      wrapper: createQueryWrapper(),
    })
    result.current.mutate({ id: 'inv-1', qty: 50 })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useBulkUpdateStock', () => {
  it('bulk updates stock successfully', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useBulkUpdateStock(onSuccess), {
      wrapper: createQueryWrapper(),
    })
    result.current.mutate([{ product_id: 'inv-1', quantity: 50 }])
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
