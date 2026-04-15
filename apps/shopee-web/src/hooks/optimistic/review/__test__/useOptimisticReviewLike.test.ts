import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useOptimisticReviewLike } from '../useOptimisticReviewLike'

vi.mock('src/apis/review.api')
vi.mock('../../useQueryInvalidation', () => ({
  useQueryInvalidation: vi.fn(() => ({
    invalidateProductReviews: vi.fn(),
  })),
}))
vi.mock('../../shared/utils', () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
  logOptimisticError: vi.fn(),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useOptimisticReviewLike', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return mutation object', () => {
    const { result } = renderHook(() => useOptimisticReviewLike('product-123'), {
      wrapper: createWrapper(),
    })

    expect(result.current).toBeDefined()
    expect(typeof result.current.mutate).toBe('function')
  })

  it('should have correct mutation properties', () => {
    const { result } = renderHook(() => useOptimisticReviewLike('product-123'), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.isSuccess).toBe(false)
  })

  it('should accept reviewId as parameter', () => {
    const { result } = renderHook(() => useOptimisticReviewLike('product-123'), {
      wrapper: createWrapper(),
    })

    expect(() => {
      result.current.mutate('review-456')
    }).not.toThrow()
  })
})
