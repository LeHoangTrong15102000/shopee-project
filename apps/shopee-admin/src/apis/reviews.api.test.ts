import { describe, it, expect, vi, beforeEach } from 'vitest'
import reviewsApi from './reviews.api'

vi.mock('src/utils/http', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import http from 'src/utils/http'
const mockHttp = http as unknown as Record<string, ReturnType<typeof vi.fn>>

describe('reviews.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getReviews calls GET /admin/reviews with params', () => {
    const params = { page: 1, limit: 10, rating: 5 }
    reviewsApi.getReviews(params)
    expect(mockHttp.get).toHaveBeenCalledWith('admin/reviews', { params })
  })

  it('getReview calls GET /admin/reviews/:id', () => {
    reviewsApi.getReview('rev-1')
    expect(mockHttp.get).toHaveBeenCalledWith('admin/reviews/rev-1')
  })

  it('getReviewStats calls GET /admin/reviews/stats', () => {
    reviewsApi.getReviewStats()
    expect(mockHttp.get).toHaveBeenCalledWith('admin/reviews/stats')
  })

  it('deleteReview calls DELETE /admin/reviews/:id', () => {
    reviewsApi.deleteReview('rev-1')
    expect(mockHttp.delete).toHaveBeenCalledWith('admin/reviews/rev-1')
  })

  it('deleteComment calls DELETE /admin/reviews/comments/:id', () => {
    reviewsApi.deleteComment('comment-1')
    expect(mockHttp.delete).toHaveBeenCalledWith('admin/reviews/comments/comment-1')
  })
})
