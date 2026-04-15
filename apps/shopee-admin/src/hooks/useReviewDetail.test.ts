import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from 'src/test-utils'
import { useReviewDetail, useDeleteComment } from './useReviewDetail'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('useReviewDetail', () => {
  it('fetches review detail with valid id', async () => {
    const { result } = renderHook(() => useReviewDetail('review-1'), {
      wrapper: createQueryWrapper(),
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeDefined()
  })

  it('is disabled with undefined id', () => {
    const { result } = renderHook(() => useReviewDetail(undefined), {
      wrapper: createQueryWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useDeleteComment', () => {
  it('deletes a comment', async () => {
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useDeleteComment('review-1', onSuccess), {
      wrapper: createQueryWrapper(),
    })
    result.current.mutate('comment-1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
