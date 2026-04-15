import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from 'src/test-utils'
import { useVoucherDetail, useVoucherUsage } from './useVoucherDetail'

describe('useVoucherDetail', () => {
  it('fetches voucher detail with valid id', async () => {
    const { result } = renderHook(() => useVoucherDetail('voucher-1'), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })

  it('is disabled with undefined id', () => {
    const { result } = renderHook(() => useVoucherDetail(undefined), {
      wrapper: createQueryWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useVoucherUsage', () => {
  it('fetches voucher usage with valid id', async () => {
    const { result } = renderHook(() => useVoucherUsage('voucher-1'), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })

  it('is disabled with undefined id', () => {
    const { result } = renderHook(() => useVoucherUsage(undefined), {
      wrapper: createQueryWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
  })
})
