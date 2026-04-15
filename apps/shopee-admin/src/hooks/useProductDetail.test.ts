import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from 'src/test-utils'
import { useProductDetail } from './useProductDetail'

describe('useProductDetail', () => {
  it('fetches product detail with valid id', async () => {
    const { result } = renderHook(() => useProductDetail('prod-1'), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })

  it('is disabled with undefined id', () => {
    const { result } = renderHook(() => useProductDetail(undefined), {
      wrapper: createQueryWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
  })
})
