/// <reference types="jest" />
import { Request, Response } from 'express'
import { ValidationError, NotFoundError } from '@services/base.service'
import {
  adminGetReviews,
  adminGetReviewById,
  adminDeleteReview,
  adminDeleteComment,
  adminGetReviewStats,
} from '../../controllers/admin-review.controller'

jest.mock('../../container', () => ({
  reviewService: {
    adminGetReviews: jest.fn(),
    adminGetReviewById: jest.fn(),
    adminDeleteReview: jest.fn(),
    adminDeleteComment: jest.fn(),
    adminGetStats: jest.fn(),
  },
}))

import { reviewService } from '../../container'

const createMockRequest = (options: any = {}): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

describe('Admin Review Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('adminGetReviews', () => {
    it('should get reviews with filters and pagination', async () => {
      const req = createMockRequest({
        query: {
          page: '3',
          limit: '25',
          sort_by: 'rating',
          order: 'asc',
          rating: '5',
          product_id: 'prod456',
          user_id: 'user789',
          search: 'great product',
        },
      })
      const res = createMockResponse()
      const mockData = { items: [], total: 0 }

      ;(reviewService.adminGetReviews as jest.Mock).mockResolvedValue(mockData)

      await adminGetReviews(req as Request, res as Response)

      expect(reviewService.adminGetReviews).toHaveBeenCalledWith(
        {
          rating: 5,
          product_id: 'prod456',
          user_id: 'user789',
          search: 'great product',
        },
        { page: 3, limit: 25, sort_by: 'rating', order: 'asc' }
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith({
        message: 'Lấy danh sách đánh giá thành công',
        data: mockData,
      })
    })

    it('should use default pagination values', async () => {
      const req = createMockRequest({ query: {} })
      const res = createMockResponse()
      const mockData = { items: [], total: 0 }

      ;(reviewService.adminGetReviews as jest.Mock).mockResolvedValue(mockData)

      await adminGetReviews(req as Request, res as Response)

      expect(reviewService.adminGetReviews).toHaveBeenCalledWith(
        { rating: undefined, product_id: undefined, user_id: undefined, search: undefined },
        { page: 1, limit: 20, sort_by: undefined, order: undefined }
      )
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('adminGetReviewById', () => {
    it('should get review by id successfully', async () => {
      const req = createMockRequest({ params: { id: 'rev123' } })
      const res = createMockResponse()
      const mockData = { id: 'rev123', rating: 5, comment: 'Excellent' }

      ;(reviewService.adminGetReviewById as jest.Mock).mockResolvedValue(mockData)

      await adminGetReviewById(req as Request, res as Response)

      expect(reviewService.adminGetReviewById).toHaveBeenCalledWith('rev123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith({
        message: 'Lấy chi tiết đánh giá thành công',
        data: mockData,
      })
    })

    it('should handle NotFoundError', async () => {
      const req = createMockRequest({ params: { id: 'rev999' } })
      const res = createMockResponse()

      ;(reviewService.adminGetReviewById as jest.Mock).mockRejectedValue(
        new NotFoundError('Review not found')
      )

      await expect(adminGetReviewById(req as Request, res as Response)).rejects.toThrow()
    })
  })

  describe('adminDeleteReview', () => {
    it('should delete a review successfully', async () => {
      const req = createMockRequest({ params: { id: 'rev123' } })
      const res = createMockResponse()
      const mockData = { success: true }

      ;(reviewService.adminDeleteReview as jest.Mock).mockResolvedValue(mockData)

      await adminDeleteReview(req as Request, res as Response)

      expect(reviewService.adminDeleteReview).toHaveBeenCalledWith('rev123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith({
        message: 'Xóa đánh giá thành công',
        data: mockData,
      })
    })

    it('should handle ValidationError', async () => {
      const req = createMockRequest({ params: { id: 'rev123' } })
      const res = createMockResponse()

      ;(reviewService.adminDeleteReview as jest.Mock).mockRejectedValue(
        new ValidationError('Cannot delete review')
      )

      await expect(adminDeleteReview(req as Request, res as Response)).rejects.toThrow()
    })
  })

  describe('adminDeleteComment', () => {
    it('should delete a comment successfully', async () => {
      const req = createMockRequest({ params: { id: 'com123' } })
      const res = createMockResponse()
      const mockData = { success: true }

      ;(reviewService.adminDeleteComment as jest.Mock).mockResolvedValue(mockData)

      await adminDeleteComment(req as Request, res as Response)

      expect(reviewService.adminDeleteComment).toHaveBeenCalledWith('com123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith({
        message: 'Xóa bình luận thành công',
        data: mockData,
      })
    })

    it('should handle NotFoundError', async () => {
      const req = createMockRequest({ params: { id: 'com999' } })
      const res = createMockResponse()

      ;(reviewService.adminDeleteComment as jest.Mock).mockRejectedValue(
        new NotFoundError('Comment not found')
      )

      await expect(adminDeleteComment(req as Request, res as Response)).rejects.toThrow()
    })
  })

  describe('adminGetReviewStats', () => {
    it('should get review statistics', async () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const mockData = { total_reviews: 500, average_rating: 4.5 }

      ;(reviewService.adminGetStats as jest.Mock).mockResolvedValue(mockData)

      await adminGetReviewStats(req as Request, res as Response)

      expect(reviewService.adminGetStats).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith({
        message: 'Lấy thống kê đánh giá thành công',
        data: mockData,
      })
    })
  })
})
