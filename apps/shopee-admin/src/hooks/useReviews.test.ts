import { renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from 'src/test-utils'
import { useReviews, useReviewStats, useDeleteReview } from './useReviews'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

describe('useReviews', () => {
  it('fetches reviews', async () => {
    const { result } = renderHook(() => useReviews(0), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.reviews).toBeDefined()
  })
})

describe('useReviewStats', () => {
  it('fetches review stats', async () => {
    const { result } = renderHook(() => useReviewStats(), { wrapper: createQueryWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.total).toBeDefined()
    expect(result.current.data?.average_rating).toBeDefined()
  })
})

describe('useDeleteReview', () => {
  it('deletes a review', async () => {
    const { result } = renderHook(() => useDeleteReview(), { wrapper: createQueryWrapper() })
    result.current.mutate('review-1')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
