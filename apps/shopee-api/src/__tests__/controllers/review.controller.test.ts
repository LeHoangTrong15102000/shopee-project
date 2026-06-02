/// <reference types="jest" />
import { Request, Response } from 'express'
import { STATUS } from '@constants/status'

jest.mock('../../services/base.service', () => {
  class ValidationError extends Error {
    constructor(m: string) {
      super(m)
      this.name = 'ValidationError'
    }
  }
  class NotFoundError extends Error {
    constructor(m: string) {
      super(m)
      this.name = 'NotFoundError'
    }
  }
  class BusinessError extends Error {
    constructor(m: string) {
      super(m)
      this.name = 'BusinessError'
    }
  }
  class ForbiddenError extends Error {
    constructor(m: string) {
      super(m)
      this.name = 'ForbiddenError'
    }
  }
  return { ValidationError, NotFoundError, BusinessError, ForbiddenError }
})

jest.mock('../../container', () => ({
  reviewService: {
    createReview: jest.fn(),
    getProductReviews: jest.fn(),
    toggleReviewLike: jest.fn(),
    createReviewComment: jest.fn(),
    getReviewComments: jest.fn(),
    canReviewPurchase: jest.fn(),
    updateReview: jest.fn(),
    deleteReview: jest.fn(),
  },
}))

jest.mock('../../socket/utils/review-emit', () => ({
  emitNewReview: jest.fn(),
  emitNewReviewComment: jest.fn(),
  emitReviewLiked: jest.fn(),
}))

jest.mock('../../socket/utils/activity-emit', () => ({
  emitActivityEvent: jest.fn(),
}))

import { reviewService } from '../../container'
import {
  createReview,
  getProductReviews,
  toggleReviewLike,
  createReviewComment,
  getReviewComments,
  canReviewPurchase,
  updateReview,
  deleteReview,
} from '../../controllers/review.controller'
import {
  ValidationError,
  NotFoundError,
  BusinessError,
  ForbiddenError,
} from '@services/base.service'

const mockReviewService = reviewService as jest.Mocked<typeof reviewService>

const createMockRequest = (options: any = {}): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
  headers: options.headers || {},
  jwtDecoded: options.jwtDecoded || {
    id: 'user123',
    email: 'test@test.com',
    roles: ['User'],
    created_at: '2024-01-01',
  },
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

describe('Review Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createReview', () => {
    it('should create review successfully', async () => {
      const mockReview = {
        _id: 'review123',
        user: { name: 'Test User', avatar: 'avatar.jpg' },
        rating: 5,
        comment: 'Great product!',
        images: ['img1.jpg'],
        createdAt: new Date(),
      }
      mockReviewService.createReview.mockResolvedValue({
        review: mockReview,
        productId: 'prod123',
      } as any)

      const req = createMockRequest({
        body: {
          purchase_id: 'purchase123',
          rating: 5,
          comment: 'Great product!',
          images: ['img1.jpg'],
        },
      })
      const res = createMockResponse()

      await createReview(req as any, res as Response)

      expect(mockReviewService.createReview).toHaveBeenCalledWith(
        'user123',
        'purchase123',
        5,
        'Great product!',
        ['img1.jpg'],
      )
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Đánh giá sản phẩm thành công',
        data: mockReview,
      })
    })

    it('should throw on ValidationError', async () => {
      mockReviewService.createReview.mockRejectedValue(new ValidationError('Invalid rating'))

      const req = createMockRequest({ body: { purchase_id: 'p1', rating: 10, comment: 'Test' } })
      const res = createMockResponse()

      await expect(createReview(req as Request, res as Response)).rejects.toThrow('Invalid rating')
    })

    it('should throw on BusinessError', async () => {
      mockReviewService.createReview.mockRejectedValue(new BusinessError('Already reviewed'))

      const req = createMockRequest({ body: { purchase_id: 'p1', rating: 5, comment: 'Test' } })
      const res = createMockResponse()

      await expect(createReview(req as Request, res as Response)).rejects.toThrow(
        'Already reviewed',
      )
    })

    it('should throw on generic error', async () => {
      mockReviewService.createReview.mockRejectedValue(new Error('Database error'))

      const req = createMockRequest({ body: { purchase_id: 'p1', rating: 5, comment: 'Test' } })
      const res = createMockResponse()

      await expect(createReview(req as Request, res as Response)).rejects.toThrow('Database error')
    })
  })

  describe('getProductReviews', () => {
    it('should return reviews with pagination and stats', async () => {
      const mockResult = {
        reviews: [{ _id: 'r1', rating: 5, comment: 'Great!' }],
        pagination: { page: 1, limit: 10, total: 1, page_size: 1 },
        stats: { average_rating: 4.5, total_reviews: 100 },
      }
      mockReviewService.getProductReviews.mockResolvedValue(mockResult as any)

      const req = createMockRequest({
        params: { product_id: 'prod123' },
        query: { page: '1', limit: '10' },
      })
      const res = createMockResponse()

      await getProductReviews(req as any, res as Response)

      expect(mockReviewService.getProductReviews).toHaveBeenCalledWith(
        'prod123',
        'user123',
        { rating: undefined, sort: 'newest' },
        { page: 1, limit: 10 },
      )
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy danh sách đánh giá thành công',
        data: {
          reviews: mockResult.reviews,
          pagination: mockResult.pagination,
          stats: mockResult.stats,
        },
      })
    })

    it('should throw on generic error', async () => {
      mockReviewService.getProductReviews.mockRejectedValue(new Error('Database error'))

      const req = createMockRequest({ params: { product_id: 'prod123' } })
      const res = createMockResponse()

      await expect(getProductReviews(req as Request, res as Response)).rejects.toThrow(
        'Database error',
      )
    })
  })

  describe('toggleReviewLike', () => {
    it('should return liked message when review is liked', async () => {
      mockReviewService.toggleReviewLike.mockResolvedValue({
        is_liked: true,
        helpful_count: 5,
        productId: 'prod123',
      } as any)

      const req = createMockRequest({ params: { review_id: 'review123' } })
      const res = createMockResponse()

      await toggleReviewLike(req as any, res as Response)

      expect(mockReviewService.toggleReviewLike).toHaveBeenCalledWith('user123', 'review123')
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Thích đánh giá thành công',
        data: { is_liked: true, helpful_count: 5 },
      })
    })

    it('should return unliked message when review is unliked', async () => {
      mockReviewService.toggleReviewLike.mockResolvedValue({
        is_liked: false,
        helpful_count: 4,
        productId: 'prod123',
      } as any)

      const req = createMockRequest({ params: { review_id: 'review123' } })
      const res = createMockResponse()

      await toggleReviewLike(req as any, res as Response)

      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Bỏ thích đánh giá thành công',
        data: { is_liked: false, helpful_count: 4 },
      })
    })

    it('should throw on ValidationError', async () => {
      mockReviewService.toggleReviewLike.mockRejectedValue(new ValidationError('Invalid review id'))

      const req = createMockRequest({ params: { review_id: 'invalid' } })
      const res = createMockResponse()

      await expect(toggleReviewLike(req as Request, res as Response)).rejects.toThrow(
        'Invalid review id',
      )
    })

    it('should throw on NotFoundError', async () => {
      mockReviewService.toggleReviewLike.mockRejectedValue(new NotFoundError('Review not found'))

      const req = createMockRequest({ params: { review_id: 'notfound' } })
      const res = createMockResponse()

      await expect(toggleReviewLike(req as Request, res as Response)).rejects.toThrow(
        'Review not found',
      )
    })

    it('should throw on generic error', async () => {
      mockReviewService.toggleReviewLike.mockRejectedValue(new Error('Database error'))

      const req = createMockRequest({ params: { review_id: 'review123' } })
      const res = createMockResponse()

      await expect(toggleReviewLike(req as Request, res as Response)).rejects.toThrow(
        'Database error',
      )
    })
  })

  describe('createReviewComment', () => {
    it('should create comment successfully', async () => {
      const mockComment = {
        _id: 'comment123',
        user: { name: 'Test User', avatar: 'avatar.jpg' },
        content: 'Nice review!',
        level: 0,
        createdAt: new Date(),
      }
      mockReviewService.createReviewComment.mockResolvedValue({
        comment: mockComment,
        productId: 'prod123',
      } as any)

      const req = createMockRequest({ body: { review_id: 'review123', content: 'Nice review!' } })
      const res = createMockResponse()

      await createReviewComment(req as any, res as Response)

      expect(mockReviewService.createReviewComment).toHaveBeenCalledWith(
        'user123',
        'review123',
        'Nice review!',
        undefined,
      )
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Tạo bình luận thành công',
        data: mockComment,
      })
    })

    it('should throw on ValidationError', async () => {
      mockReviewService.createReviewComment.mockRejectedValue(
        new ValidationError('Content too short'),
      )

      const req = createMockRequest({ body: { review_id: 'r1', content: 'Hi' } })
      const res = createMockResponse()

      await expect(createReviewComment(req as Request, res as Response)).rejects.toThrow(
        'Content too short',
      )
    })

    it('should throw on NotFoundError', async () => {
      mockReviewService.createReviewComment.mockRejectedValue(new NotFoundError('Review not found'))

      const req = createMockRequest({ body: { review_id: 'notfound', content: 'Test comment' } })
      const res = createMockResponse()

      await expect(createReviewComment(req as Request, res as Response)).rejects.toThrow(
        'Review not found',
      )
    })

    it('should throw on generic error', async () => {
      mockReviewService.createReviewComment.mockRejectedValue(new Error('Database error'))

      const req = createMockRequest({ body: { review_id: 'r1', content: 'Test' } })
      const res = createMockResponse()

      await expect(createReviewComment(req as Request, res as Response)).rejects.toThrow(
        'Database error',
      )
    })
  })

  describe('getReviewComments', () => {
    it('should return comments with pagination', async () => {
      const mockResult = {
        data: [{ _id: 'c1', content: 'Nice!' }],
        pagination: { page: 1, limit: 10, total: 1, page_size: 1 },
      }
      mockReviewService.getReviewComments.mockResolvedValue(mockResult as any)

      const req = createMockRequest({
        params: { review_id: 'review123' },
        query: { page: '1', limit: '10' },
      })
      const res = createMockResponse()

      await getReviewComments(req as any, res as Response)

      expect(mockReviewService.getReviewComments).toHaveBeenCalledWith('review123', {
        page: 1,
        limit: 10,
      })
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy danh sách bình luận thành công',
        data: {
          comments: mockResult.data,
          pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
        },
      })
    })

    it('should throw on ValidationError', async () => {
      mockReviewService.getReviewComments.mockRejectedValue(
        new ValidationError('Invalid review id'),
      )

      const req = createMockRequest({ params: { review_id: 'invalid' } })
      const res = createMockResponse()

      await expect(getReviewComments(req as Request, res as Response)).rejects.toThrow(
        'Invalid review id',
      )
    })

    it('should throw on generic error', async () => {
      mockReviewService.getReviewComments.mockRejectedValue(new Error('Database error'))

      const req = createMockRequest({ params: { review_id: 'review123' } })
      const res = createMockResponse()

      await expect(getReviewComments(req as Request, res as Response)).rejects.toThrow(
        'Database error',
      )
    })
  })

  describe('canReviewPurchase', () => {
    it('should return can review result successfully', async () => {
      const mockResult = { can_review: true, reason: null }
      mockReviewService.canReviewPurchase.mockResolvedValue(mockResult as any)

      const req = createMockRequest({ params: { purchase_id: 'purchase123' } })
      const res = createMockResponse()

      await canReviewPurchase(req as any, res as Response)

      expect(mockReviewService.canReviewPurchase).toHaveBeenCalledWith('user123', 'purchase123')
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Kiểm tra quyền đánh giá thành công',
        data: mockResult,
      })
    })

    it('should throw on ValidationError', async () => {
      mockReviewService.canReviewPurchase.mockRejectedValue(
        new ValidationError('Invalid purchase id'),
      )

      const req = createMockRequest({ params: { purchase_id: 'invalid' } })
      const res = createMockResponse()

      await expect(canReviewPurchase(req as Request, res as Response)).rejects.toThrow(
        'Invalid purchase id',
      )
    })

    it('should throw on generic error', async () => {
      mockReviewService.canReviewPurchase.mockRejectedValue(new Error('Database error'))

      const req = createMockRequest({ params: { purchase_id: 'purchase123' } })
      const res = createMockResponse()

      await expect(canReviewPurchase(req as Request, res as Response)).rejects.toThrow(
        'Database error',
      )
    })
  })

  describe('updateReview', () => {
    it('should update review successfully', async () => {
      const updatedReview = {
        _id: 'review123',
        rating: 4,
        comment: 'Updated comment',
        images: ['img1.jpg'],
      }
      ;(mockReviewService as any).updateReview.mockResolvedValue(updatedReview as any)

      const req = createMockRequest({
        params: { review_id: 'review123' },
        body: { rating: 4, comment: 'Updated comment', images: ['img1.jpg'] },
      })
      const res = createMockResponse()

      await updateReview(req as any, res as Response)

      expect((mockReviewService as any).updateReview).toHaveBeenCalledWith('user123', 'review123', {
        rating: 4,
        comment: 'Updated comment',
        images: ['img1.jpg'],
      })
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cập nhật đánh giá thành công',
        data: updatedReview,
      })
    })

    it('should throw on ValidationError', async () => {
      ;(mockReviewService as any).updateReview.mockRejectedValue(
        new ValidationError('Invalid rating'),
      )

      const req = createMockRequest({
        params: { review_id: 'review123' },
        body: { rating: 10, comment: 'Test' },
      })
      const res = createMockResponse()

      await expect(updateReview(req as Request, res as Response)).rejects.toThrow('Invalid rating')
    })

    it('should throw on NotFoundError', async () => {
      ;(mockReviewService as any).updateReview.mockRejectedValue(
        new NotFoundError('Review not found'),
      )

      const req = createMockRequest({ params: { review_id: 'r1' }, body: { rating: 5 } })
      const res = createMockResponse()

      await expect(updateReview(req as Request, res as Response)).rejects.toThrow(
        'Review not found',
      )
    })

    it('should throw on ForbiddenError', async () => {
      ;(mockReviewService as any).updateReview.mockRejectedValue(
        new ForbiddenError('Không có quyền cập nhật'),
      )

      const req = createMockRequest({ params: { review_id: 'r1' }, body: { rating: 5 } })
      const res = createMockResponse()

      await expect(updateReview(req as Request, res as Response)).rejects.toThrow(
        'Không có quyền cập nhật',
      )
    })

    it('should throw on generic error', async () => {
      ;(mockReviewService as any).updateReview.mockRejectedValue(new Error('Database error'))

      const req = createMockRequest({ params: { review_id: 'r1' }, body: { rating: 5 } })
      const res = createMockResponse()

      await expect(updateReview(req as Request, res as Response)).rejects.toThrow('Database error')
    })
  })

  describe('deleteReview', () => {
    it('should delete review successfully', async () => {
      ;(mockReviewService as any).deleteReview.mockResolvedValue(undefined as any)

      const req = createMockRequest({ params: { review_id: 'review123' } })
      const res = createMockResponse()

      await deleteReview(req as any, res as Response)

      expect((mockReviewService as any).deleteReview).toHaveBeenCalledWith('user123', 'review123')
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      expect(res.json).toHaveBeenCalledWith({ message: 'Xóa đánh giá thành công' })
    })

    it('should throw on ValidationError', async () => {
      ;(mockReviewService as any).deleteReview.mockRejectedValue(new ValidationError('Invalid id'))

      const req = createMockRequest({ params: { review_id: 'invalid' } })
      const res = createMockResponse()

      await expect(deleteReview(req as Request, res as Response)).rejects.toThrow('Invalid id')
    })

    it('should throw on NotFoundError', async () => {
      ;(mockReviewService as any).deleteReview.mockRejectedValue(
        new NotFoundError('Review not found'),
      )

      const req = createMockRequest({ params: { review_id: 'notfound' } })
      const res = createMockResponse()

      await expect(deleteReview(req as Request, res as Response)).rejects.toThrow(
        'Review not found',
      )
    })

    it('should throw on ForbiddenError', async () => {
      ;(mockReviewService as any).deleteReview.mockRejectedValue(
        new ForbiddenError('Không có quyền xóa'),
      )

      const req = createMockRequest({ params: { review_id: 'r1' } })
      const res = createMockResponse()

      await expect(deleteReview(req as Request, res as Response)).rejects.toThrow(
        'Không có quyền xóa',
      )
    })

    it('should throw on generic error', async () => {
      ;(mockReviewService as any).deleteReview.mockRejectedValue(new Error('Database error'))

      const req = createMockRequest({ params: { review_id: 'r1' } })
      const res = createMockResponse()

      await expect(deleteReview(req as Request, res as Response)).rejects.toThrow('Database error')
    })
  })
})
