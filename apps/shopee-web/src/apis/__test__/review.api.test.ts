import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('src/utils/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}))

import http from 'src/utils/http'
import reviewApi from '../review.api'

describe('Review API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createReview', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1' } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await reviewApi.createReview({
        purchase_id: '1',
        rating: 5,
        comment: 'Great',
      })
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      const result = await reviewApi.createReview({
        purchase_id: '1',
        rating: 5,
        comment: 'Great',
      })
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('updateReview', () => {
    it('should call http.put on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1' } } }
      vi.mocked(http.put).mockResolvedValue(mockResponse as any)
      const result = await reviewApi.updateReview('1', { rating: 4 })
      expect(http.put).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.put).mockRejectedValue(new Error('Network error'))
      const result = await reviewApi.updateReview('1', { rating: 4 })
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('deleteReview', () => {
    it('should call http.delete on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { deleted: true } } }
      vi.mocked(http.delete).mockResolvedValue(mockResponse as any)
      const result = await reviewApi.deleteReview('1')
      expect(http.delete).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.delete).mockRejectedValue(new Error('Network error'))
      const result = await reviewApi.deleteReview('1')
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('getProductReviews', () => {
    it('should call http.get on success', async () => {
      const mockResponse = {
        data: { message: 'ok', data: { reviews: [], pagination: {}, stats: {} } },
      }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await reviewApi.getProductReviews('1')
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      const result = await reviewApi.getProductReviews('1')
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('toggleReviewLike', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { is_liked: true, helpful_count: 1 } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await reviewApi.toggleReviewLike('1')
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      const result = await reviewApi.toggleReviewLike('1')
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('createComment', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1' } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await reviewApi.createComment({ review_id: '1', content: 'Nice' })
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      const result = await reviewApi.createComment({ review_id: '1', content: 'Nice' })
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('getReviewComments', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { comments: [], pagination: {} } } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await reviewApi.getReviewComments('1')
      expect(http.get).toHaveBeenCalled()
      expect(result.data.message).toEqual(expect.any(String))
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      const result = await reviewApi.getReviewComments('1')
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('canReviewPurchase', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { can_review: true } } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await reviewApi.canReviewPurchase('1')
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      const result = await reviewApi.canReviewPurchase('1')
      expect(result.data.message).toEqual(expect.any(String))
    })
  })
})
