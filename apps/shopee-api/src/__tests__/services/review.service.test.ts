/// <reference types="jest" />
import { ReviewService } from '@services/review.service'
import { IReviewRepository } from '@repositories/interfaces/review.repository.interface'
import { IPurchaseRepository } from '@repositories/interfaces/purchase.repository.interface'
import { IProductRepository } from '@repositories/interfaces/product.repository.interface'
import {
  NotFoundError,
  BusinessError,
  ValidationError,
  ForbiddenError,
} from '@services/base.service'
import { STATUS_PURCHASE } from '@constants/purchase'
import { Types } from 'mongoose'

describe('ReviewService', () => {
  let service: ReviewService
  const validObjectId = new Types.ObjectId()

  const mockReviewRepository: jest.Mocked<IReviewRepository> = {
    findByProduct: jest.fn(),
    findById: jest.fn(),
    findByPurchase: jest.fn(),
    create: jest.fn(),
    getProductStats: jest.fn(),
    findUserLike: jest.fn(),
    findUserLikes: jest.fn(),
    toggleLike: jest.fn(),
    findCommentsByReview: jest.fn(),
    findCommentById: jest.fn(),
    createComment: jest.fn(),
  } as unknown as jest.Mocked<IReviewRepository>

  const mockPurchaseRepository: jest.Mocked<IPurchaseRepository> = {
    findByIdAndUser: jest.fn(),
  } as unknown as jest.Mocked<IPurchaseRepository>

  const mockProductRepository: jest.Mocked<IProductRepository> = {
    updateRating: jest.fn(),
  } as unknown as jest.Mocked<IProductRepository>

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ReviewService(mockReviewRepository, mockPurchaseRepository, mockProductRepository)
  })

  describe('createReview', () => {
    it('should create review when purchase is delivered and not reviewed', async () => {
      mockPurchaseRepository.findByIdAndUser.mockResolvedValue({
        product: validObjectId,
        status: STATUS_PURCHASE.DELIVERED,
      } as any)
      mockReviewRepository.findByPurchase.mockResolvedValue(null)
      mockReviewRepository.create.mockResolvedValue({ _id: validObjectId, rating: 5 } as any)
      mockReviewRepository.getProductStats.mockResolvedValue({
        average_rating: 4.5,
        total_reviews: 10,
        rating_breakdown: {},
      } as any)
      mockProductRepository.updateRating.mockResolvedValue(undefined)

      const result = await service.createReview(
        validObjectId.toString(),
        validObjectId.toString(),
        5,
        'Great!',
        [],
      )
      expect(result.review).toBeDefined()
      expect(mockProductRepository.updateRating).toHaveBeenCalled()
    })

    it('should throw BusinessError when purchase not delivered', async () => {
      mockPurchaseRepository.findByIdAndUser.mockResolvedValue({
        product: validObjectId,
        status: STATUS_PURCHASE.IN_PROGRESS,
      } as any)
      await expect(
        service.createReview(validObjectId.toString(), validObjectId.toString(), 5, 'Great!', []),
      ).rejects.toThrow(BusinessError)
    })

    it('should throw BusinessError when already reviewed', async () => {
      mockPurchaseRepository.findByIdAndUser.mockResolvedValue({
        product: validObjectId,
        status: STATUS_PURCHASE.DELIVERED,
      } as any)
      mockReviewRepository.findByPurchase.mockResolvedValue({ _id: validObjectId } as any)
      await expect(
        service.createReview(validObjectId.toString(), validObjectId.toString(), 5, 'Great!', []),
      ).rejects.toThrow(BusinessError)
    })
  })

  describe('getProductReviews', () => {
    it('should return reviews without like status when no userId', async () => {
      mockReviewRepository.findByProduct.mockResolvedValue({
        data: [{ _id: validObjectId }],
        pagination: { page: 1, limit: 10, total: 1, page_size: 1 },
      } as any)
      mockReviewRepository.getProductStats.mockResolvedValue({
        average_rating: 4.5,
        total_reviews: 1,
      } as any)

      const result = await service.getProductReviews(
        validObjectId.toString(),
        undefined,
        {},
        { page: 1, limit: 10 },
      )
      expect(result.reviews).toHaveLength(1)
      expect(mockReviewRepository.findUserLikes).not.toHaveBeenCalled()
    })

    it('should add is_liked when userId provided', async () => {
      mockReviewRepository.findByProduct.mockResolvedValue({
        data: [{ _id: validObjectId }],
        pagination: { page: 1, limit: 10, total: 1, page_size: 1 },
      } as any)
      mockReviewRepository.findUserLikes.mockResolvedValue(new Set([validObjectId.toString()]))
      mockReviewRepository.getProductStats.mockResolvedValue({
        average_rating: 4.5,
        total_reviews: 1,
      } as any)

      const result = await service.getProductReviews(
        validObjectId.toString(),
        validObjectId.toString(),
        {},
        { page: 1, limit: 10 },
      )
      expect(result.reviews[0].is_liked).toBe(true)
    })
  })

  describe('toggleReviewLike', () => {
    it('should toggle like when review found', async () => {
      mockReviewRepository.findById.mockResolvedValue({
        _id: validObjectId,
        product: validObjectId,
      } as any)
      mockReviewRepository.toggleLike.mockResolvedValue({ is_liked: true, helpful_count: 5 })

      const result = await service.toggleReviewLike(
        validObjectId.toString(),
        validObjectId.toString(),
      )
      expect(result.is_liked).toBe(true)
    })

    it('should throw NotFoundError when review not found', async () => {
      mockReviewRepository.findById.mockResolvedValue(null)
      await expect(
        service.toggleReviewLike(validObjectId.toString(), validObjectId.toString()),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('createReviewComment', () => {
    it('should create comment without parent', async () => {
      mockReviewRepository.findById.mockResolvedValue({
        _id: validObjectId,
        product: validObjectId,
      } as any)
      mockReviewRepository.createComment.mockResolvedValue({
        _id: validObjectId,
        content: 'Nice',
      } as any)

      const result = await service.createReviewComment(
        validObjectId.toString(),
        validObjectId.toString(),
        'Nice',
      )
      expect(result.comment).toBeDefined()
    })

    it('should create comment with parent', async () => {
      mockReviewRepository.findById.mockResolvedValue({
        _id: validObjectId,
        product: validObjectId,
      } as any)
      mockReviewRepository.findCommentById.mockResolvedValue({
        _id: validObjectId,
        level: 1,
      } as any)
      mockReviewRepository.createComment.mockResolvedValue({ _id: validObjectId, level: 2 } as any)

      const result = await service.createReviewComment(
        validObjectId.toString(),
        validObjectId.toString(),
        'Reply',
        validObjectId.toString(),
      )
      expect(result.comment).toBeDefined()
    })

    it('should throw BusinessError when max level exceeded', async () => {
      mockReviewRepository.findById.mockResolvedValue({
        _id: validObjectId,
        product: validObjectId,
      } as any)
      mockReviewRepository.findCommentById.mockResolvedValue({
        _id: validObjectId,
        level: 3,
      } as any)

      await expect(
        service.createReviewComment(
          validObjectId.toString(),
          validObjectId.toString(),
          'Reply',
          validObjectId.toString(),
        ),
      ).rejects.toThrow(BusinessError)
    })
  })

  describe('canReviewPurchase', () => {
    it('should return can_review true when delivered and not reviewed', async () => {
      mockPurchaseRepository.findByIdAndUser.mockResolvedValue({
        status: STATUS_PURCHASE.DELIVERED,
      } as any)
      mockReviewRepository.findByPurchase.mockResolvedValue(null)

      const result = await service.canReviewPurchase(
        validObjectId.toString(),
        validObjectId.toString(),
      )
      expect(result.can_review).toBe(true)
    })

    it('should return can_review false when already reviewed', async () => {
      mockPurchaseRepository.findByIdAndUser.mockResolvedValue({
        status: STATUS_PURCHASE.DELIVERED,
      } as any)
      mockReviewRepository.findByPurchase.mockResolvedValue({ _id: validObjectId } as any)

      const result = await service.canReviewPurchase(
        validObjectId.toString(),
        validObjectId.toString(),
      )
      expect(result.can_review).toBe(false)
      expect(result.review_id).toBeDefined()
    })

    it('should return can_review false when not delivered', async () => {
      mockPurchaseRepository.findByIdAndUser.mockResolvedValue({
        status: STATUS_PURCHASE.IN_PROGRESS,
      } as any)

      const result = await service.canReviewPurchase(
        validObjectId.toString(),
        validObjectId.toString(),
      )
      expect(result.can_review).toBe(false)
    })
  })

  describe('getReviewComments', () => {
    it('should return paginated comments', async () => {
      mockReviewRepository.findCommentsByReview.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, page_size: 0 },
      } as any)

      const result = await service.getReviewComments(validObjectId.toString(), {
        page: 1,
        limit: 10,
      })
      expect(result).toHaveProperty('data')
    })

    it('should throw ValidationError for invalid reviewId', async () => {
      await expect(service.getReviewComments('invalid-id', { page: 1, limit: 10 })).rejects.toThrow(
        ValidationError,
      )
    })
  })

  describe('updateReview', () => {
    it('should update review successfully', async () => {
      const mockReview = {
        _id: validObjectId,
        user: validObjectId,
        product: validObjectId,
        rating: 4,
      }
      mockReviewRepository.findById.mockResolvedValue(mockReview as any)
      ;(mockReviewRepository as any).updateById = jest
        .fn()
        .mockResolvedValue({ ...mockReview, rating: 5 })
      mockReviewRepository.getProductStats.mockResolvedValue({
        average_rating: 4.5,
        total_reviews: 1,
      } as any)
      mockProductRepository.updateRating.mockResolvedValue(undefined)

      const result = await service.updateReview(
        validObjectId.toString(),
        validObjectId.toString(),
        { rating: 5, comment: 'Updated' },
      )
      expect(result).toBeDefined()
    })

    it('should throw ForbiddenError when user is not the review owner', async () => {
      const otherUserId = new Types.ObjectId()
      const mockReview = { _id: validObjectId, user: otherUserId, product: validObjectId }
      mockReviewRepository.findById.mockResolvedValue(mockReview as any)

      await expect(
        service.updateReview(validObjectId.toString(), validObjectId.toString(), { comment: 'X' }),
      ).rejects.toThrow(ForbiddenError)
    })

    it('should throw NotFoundError when review not found', async () => {
      mockReviewRepository.findById.mockResolvedValue(null)
      await expect(
        service.updateReview(validObjectId.toString(), validObjectId.toString(), { rating: 3 }),
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw ValidationError for invalid userId', async () => {
      await expect(
        service.updateReview('invalid', validObjectId.toString(), { rating: 3 }),
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('deleteReview', () => {
    it('should delete review successfully', async () => {
      const mockReview = { _id: validObjectId, user: validObjectId, product: validObjectId }
      mockReviewRepository.findById.mockResolvedValue(mockReview as any)
      ;(mockReviewRepository as any).deleteById = jest.fn().mockResolvedValue(undefined)
      mockReviewRepository.getProductStats.mockResolvedValue({
        average_rating: 4.0,
        total_reviews: 0,
      } as any)
      mockProductRepository.updateRating.mockResolvedValue(undefined)

      const result = await service.deleteReview(validObjectId.toString(), validObjectId.toString())
      expect(result.deleted).toBe(true)
    })

    it('should throw ForbiddenError when user is not the review owner', async () => {
      const otherUserId = new Types.ObjectId()
      const mockReview = { _id: validObjectId, user: otherUserId, product: validObjectId }
      mockReviewRepository.findById.mockResolvedValue(mockReview as any)

      await expect(
        service.deleteReview(validObjectId.toString(), validObjectId.toString()),
      ).rejects.toThrow(ForbiddenError)
    })

    it('should throw NotFoundError when review not found', async () => {
      mockReviewRepository.findById.mockResolvedValue(null)
      await expect(
        service.deleteReview(validObjectId.toString(), validObjectId.toString()),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('adminGetReviewById', () => {
    it('should return review by id', async () => {
      mockReviewRepository.findById.mockResolvedValue({ _id: validObjectId } as any)
      const result = await service.adminGetReviewById(validObjectId.toString())
      expect(result).toBeDefined()
    })

    it('should throw ValidationError for invalid id', async () => {
      await expect(service.adminGetReviewById('bad-id')).rejects.toThrow(ValidationError)
    })

    it('should throw NotFoundError when not found', async () => {
      mockReviewRepository.findById.mockResolvedValue(null)
      await expect(service.adminGetReviewById(validObjectId.toString())).rejects.toThrow(
        NotFoundError,
      )
    })
  })

  describe('adminGetReviews', () => {
    it('should call findAllWithFilters', async () => {
      ;(mockReviewRepository as any).findAllWithFilters = jest
        .fn()
        .mockResolvedValue({ data: [], pagination: {} })
      const result = await service.adminGetReviews({}, { page: 1, limit: 10 })
      expect((mockReviewRepository as any).findAllWithFilters).toHaveBeenCalled()
    })
  })

  describe('adminDeleteReview', () => {
    it('should delete review as admin', async () => {
      const mockReview = { _id: validObjectId, product: validObjectId }
      mockReviewRepository.findById.mockResolvedValue(mockReview as any)
      ;(mockReviewRepository as any).deleteById = jest.fn().mockResolvedValue(undefined)
      mockReviewRepository.getProductStats.mockResolvedValue({
        average_rating: 4.0,
        total_reviews: 0,
      } as any)
      mockProductRepository.updateRating.mockResolvedValue(undefined)

      const result = await service.adminDeleteReview(validObjectId.toString())
      expect(result.deleted).toBe(true)
    })

    it('should throw NotFoundError when review not found', async () => {
      mockReviewRepository.findById.mockResolvedValue(null)
      await expect(service.adminDeleteReview(validObjectId.toString())).rejects.toThrow(
        NotFoundError,
      )
    })
  })

  describe('adminDeleteComment', () => {
    it('should delete comment as admin', async () => {
      mockReviewRepository.findCommentById.mockResolvedValue({ _id: validObjectId } as any)
      ;(mockReviewRepository as any).deleteCommentById = jest.fn().mockResolvedValue(undefined)

      const result = await service.adminDeleteComment(validObjectId.toString())
      expect(result.deleted).toBe(true)
    })

    it('should throw NotFoundError when comment not found', async () => {
      mockReviewRepository.findCommentById.mockResolvedValue(null)
      await expect(service.adminDeleteComment(validObjectId.toString())).rejects.toThrow(
        NotFoundError,
      )
    })
  })

  describe('adminGetStats', () => {
    it('should call getReviewStats', async () => {
      ;(mockReviewRepository as any).getReviewStats = jest.fn().mockResolvedValue({ total: 10 })
      const result = await service.adminGetStats()
      expect((mockReviewRepository as any).getReviewStats).toHaveBeenCalled()
    })
  })

  describe('createReview - validation errors', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(
        service.createReview('invalid-id', validObjectId.toString(), 5, 'Good', []),
      ).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid purchaseId', async () => {
      await expect(
        service.createReview(validObjectId.toString(), 'invalid-id', 5, 'Good', []),
      ).rejects.toThrow(ValidationError)
    })

    it('should throw BusinessError when purchase not found', async () => {
      mockPurchaseRepository.findByIdAndUser.mockResolvedValue(null)
      await expect(
        service.createReview(validObjectId.toString(), validObjectId.toString(), 5, 'Good', []),
      ).rejects.toThrow(BusinessError)
    })
  })
})
