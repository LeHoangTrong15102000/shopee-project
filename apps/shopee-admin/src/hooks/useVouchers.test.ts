import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from 'src/test-utils'
import {
  useVouchers,
  useVoucherStats,
  useCreateVoucher,
  useUpdateVoucher,
  useDeleteVoucher,
  useToggleVoucher,
} from './useVouchers'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('useVouchers', () => {
  it('fetches vouchers', async () => {
    const { result } = renderHook(() => useVouchers(0), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.vouchers).toBeDefined()
  })
})

describe('useVoucherStats', () => {
  it('fetches voucher stats', async () => {
    const { result } = renderHook(() => useVoucherStats(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.total).toBeDefined()
    expect(result.current.data?.active).toBeDefined()
  })
})

describe('useCreateVoucher', () => {
  it('creates a voucher', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useCreateVoucher(onSuccess), {
      wrapper: createQueryWrapper(),
    })
    result.current.mutate({
      code: 'NEWCODE',
      discount_type: 'percentage',
      discount_value: 25,
      start_date: '2024-01-01',
      end_date: '2024-12-31',
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useUpdateVoucher', () => {
  it('updates a voucher', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useUpdateVoucher(onSuccess), {
      wrapper: createQueryWrapper(),
    })
    result.current.mutate({ id: 'voucher-1', body: { is_active: false } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useDeleteVoucher', () => {
  it('deletes a voucher', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useDeleteVoucher(onSuccess), {
      wrapper: createQueryWrapper(),
    })
    result.current.mutate('voucher-1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useToggleVoucher', () => {
  it('toggles voucher active status', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useToggleVoucher(onSuccess), {
      wrapper: createQueryWrapper(),
    })
    result.current.mutate({ id: 'voucher-1', is_active: false })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
