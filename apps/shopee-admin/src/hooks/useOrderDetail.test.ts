import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from 'src/test-utils'
import { useOrderDetail, useUpdateOrderStatus } from './useOrderDetail'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('useOrderDetail', () => {
  it('fetches order by ID', async () => {
    const { result } = renderHook(() => useOrderDetail('order-1'), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?._id).toBe('order-1')
  })

  it('is disabled when no ID', () => {
    const { result } = renderHook(() => useOrderDetail(undefined), {
      wrapper: createQueryWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useUpdateOrderStatus', () => {
  it('updates order status', async () => {
    const { result } = renderHook(() => useUpdateOrderStatus('order-1'), {
      wrapper: createQueryWrapper(),
    })
    result.current.mutate('shipped')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
