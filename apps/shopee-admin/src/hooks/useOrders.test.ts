import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from 'src/test-utils'
import { useOrders, useOrderCountByStatus, useBulkUpdateOrderStatus } from './useOrders'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('useOrders', () => {
  it('fetches orders', async () => {
    const { result } = renderHook(() => useOrders(0, 'all'), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.orders).toBeDefined()
  })

  it('fetches orders with status filter', async () => {
    const { result } = renderHook(() => useOrders(0, 'pending'), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.orders).toBeDefined()
  })
})

describe('useOrderCountByStatus', () => {
  it('fetches order counts', async () => {
    const { result } = renderHook(() => useOrderCountByStatus(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Array.isArray(result.current.data)).toBe(true)
  })
})

describe('useBulkUpdateOrderStatus', () => {
  it('bulk updates order status', async () => {
    const { result } = renderHook(() => useBulkUpdateOrderStatus(), {
      wrapper: createQueryWrapper(),
    })
    result.current.mutate({ order_ids: ['order-1', 'order-2'], status: 'shipped' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
