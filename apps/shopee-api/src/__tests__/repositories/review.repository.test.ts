/// <reference types="jest" />

const mockReviewData = {
  _id: '507f1f77bcf86cd799439011',
  user: { _id: '507f1f77bcf86cd799439012', name: 'Test User', email: 'test@test.com' },
  product: '507f1f77bcf86cd799439013',
  purchase: '507f1f77bcf86cd799439014',
  rating: 5,
  comment: 'Great product!',
  images: [],
  helpful_count: 10,
  toObject: () => mockReviewData,
}

const mockCommentData = {
  _id: '507f1f77bcf86cd799439020',
  user: { _id: '507f1f77bcf86cd799439012', name: 'Test User' },
  review: '507f1f77bcf86cd799439011',
  content: 'Nice review!',
  parent_comment: null,
  level: 0,
}

jest.mock('@database/models/review.model', () => {
  const mockModel: any = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011' }),
  }))
  mockModel.find = jest.fn()
  mockModel.findById = jest.fn()
  mockModel.findOne = jest.fn()
  mockModel.findByIdAndUpdate = jest.fn()
  mockModel.countDocuments = jest.fn()
  mockModel.aggregate = jest.fn()
  return { ReviewModel: mockModel }
})

jest.mock('@database/models/review-like.model', () => {
  const mockModel: any = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439030' }),
  }))
  mockModel.findOne = jest.fn()
  mockModel.find = jest.fn()
  mockModel.findByIdAndDelete = jest.fn()
  mockModel.countDocuments = jest.fn()
  return { ReviewLikeModel: mockModel }
})

jest.mock('@database/models/review-comment.model', () => {
  const mockModel: any = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439020' }),
  }))
  mockModel.find = jest.fn()
  mockModel.findById = jest.fn()
  mockModel.countDocuments = jest.fn()
  return { ReviewCommentModel: mockModel }
})

import { ReviewModel } from '@database/models/review.model'
import { ReviewLikeModel } from '@database/models/review-like.model'
import { ReviewCommentModel } from '@database/models/review-comment.model'
import { ReviewRepository } from '../../repositories/review.repository'

describe('ReviewRepository', () => {
  let repository: ReviewRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repository = new ReviewRepository()
  })

  describe('findByProduct', () => {
    it('should find reviews by product with pagination', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockReviewData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort })
      ;(ReviewModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate })
      ;(ReviewModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.findByProduct(
        { product_id: '507f1f77bcf86cd799439013' },
        { page: 1, limit: 10 },
      )

      expect(ReviewModel.find).toHaveBeenCalledWith({ product: '507f1f77bcf86cd799439013' })
      expect(result.data).toEqual([mockReviewData])
    })

    it('should filter by rating when provided', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockReviewData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort })
      ;(ReviewModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate })
      ;(ReviewModel.countDocuments as jest.Mock).mockResolvedValue(1)

      await repository.findByProduct(
        { product_id: '507f1f77bcf86cd799439013', rating: 5 },
        { page: 1, limit: 10 },
      )

      expect(ReviewModel.find).toHaveBeenCalledWith({
        product: '507f1f77bcf86cd799439013',
        rating: 5,
      })
    })
  })

  describe('findById', () => {
    it('should find review by id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockReviewData)
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(ReviewModel.findById as jest.Mock).mockReturnValue({ populate: mockPopulate })

      const result = await repository.findById('507f1f77bcf86cd799439011')

      expect(ReviewModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
      expect(result).toEqual(mockReviewData)
    })
  })

  describe('findByPurchase', () => {
    it('should find review by purchase id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockReviewData)
      ;(ReviewModel.findOne as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.findByPurchase('507f1f77bcf86cd799439014')

      expect(ReviewModel.findOne).toHaveBeenCalledWith({ purchase: '507f1f77bcf86cd799439014' })
      expect(result).toEqual(mockReviewData)
    })
  })

  describe('create', () => {
    it('should create a new review', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockReviewData)
      const mockPopulateProduct = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulateUser = jest.fn().mockReturnValue({ populate: mockPopulateProduct })
      ;(ReviewModel.findById as jest.Mock).mockReturnValue({ populate: mockPopulateUser })

      const result = await repository.create({
        user: '507f1f77bcf86cd799439012',
        product: '507f1f77bcf86cd799439013',
        purchase: '507f1f77bcf86cd799439014',
        rating: 5,
        comment: 'Great!',
      } as any)

      expect(result).toEqual(mockReviewData)
    })
  })

  describe('getProductStats', () => {
    it('should return product review stats', async () => {
      ;(ReviewModel.aggregate as jest.Mock)
        .mockResolvedValueOnce([
          { _id: 5, count: 10 },
          { _id: 4, count: 5 },
        ])
        .mockResolvedValueOnce([{ avg: 4.5 }])
      ;(ReviewModel.countDocuments as jest.Mock).mockResolvedValue(15)

      const result = await repository.getProductStats('507f1f77bcf86cd799439013')

      expect(result.total_reviews).toBe(15)
      expect(result.average_rating).toBe(4.5)
      expect(result.rating_breakdown[5]).toBe(10)
    })
  })

  describe('findUserLike', () => {
    it('should return true if user liked review', async () => {
      ;(ReviewLikeModel.findOne as jest.Mock).mockResolvedValue({ _id: '123' })
      const result = await repository.findUserLike(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439011',
      )
      expect(result).toBe(true)
    })

    it('should return false if user has not liked review', async () => {
      ;(ReviewLikeModel.findOne as jest.Mock).mockResolvedValue(null)
      const result = await repository.findUserLike(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439011',
      )
      expect(result).toBe(false)
    })
  })

  describe('findUserLikes', () => {
    it('should return set of liked review ids', async () => {
      ;(ReviewLikeModel.find as jest.Mock).mockResolvedValue([
        { review: { toString: () => '507f1f77bcf86cd799439011' } },
        { review: { toString: () => '507f1f77bcf86cd799439015' } },
      ])

      const result = await repository.findUserLikes('507f1f77bcf86cd799439012', [
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439015',
      ])

      expect(result.has('507f1f77bcf86cd799439011')).toBe(true)
      expect(result.has('507f1f77bcf86cd799439015')).toBe(true)
    })
  })

  describe('toggleLike', () => {
    it('should unlike if already liked', async () => {
      ;(ReviewLikeModel.findOne as jest.Mock).mockResolvedValue({ _id: '123' })
      ;(ReviewLikeModel.findByIdAndDelete as jest.Mock).mockResolvedValue({})
      ;(ReviewModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({})
      ;(ReviewLikeModel.countDocuments as jest.Mock).mockResolvedValue(9)

      const result = await repository.toggleLike(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439011',
      )

      expect(result.is_liked).toBe(false)
      expect(result.helpful_count).toBe(9)
    })

    it('should like if not already liked', async () => {
      ;(ReviewLikeModel.findOne as jest.Mock).mockResolvedValue(null)
      ;(ReviewModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({})
      ;(ReviewLikeModel.countDocuments as jest.Mock).mockResolvedValue(11)

      const result = await repository.toggleLike(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439011',
      )

      expect(result.is_liked).toBe(true)
      expect(result.helpful_count).toBe(11)
    })
  })

  describe('findCommentsByReview', () => {
    it('should find comments by review with pagination', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockCommentData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort })
      ;(ReviewCommentModel.find as jest.Mock)
        .mockReturnValueOnce({ populate: mockPopulate })
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
          }),
        })
      ;(ReviewCommentModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.findCommentsByReview('507f1f77bcf86cd799439011', {
        page: 1,
        limit: 10,
      })

      expect(result.data).toBeDefined()
      expect(result.pagination.total).toBe(1)
    })
  })

  describe('findCommentById', () => {
    it('should find comment by id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockCommentData)
      ;(ReviewCommentModel.findById as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.findCommentById('507f1f77bcf86cd799439020')

      expect(ReviewCommentModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439020')
      expect(result).toEqual(mockCommentData)
    })
  })

  describe('createComment', () => {
    it('should create a new comment', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockCommentData)
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(ReviewCommentModel.findById as jest.Mock).mockReturnValue({ populate: mockPopulate })

      const result = await repository.createComment({
        user: '507f1f77bcf86cd799439012',
        review: '507f1f77bcf86cd799439011',
        content: 'Nice review!',
        level: 0,
      } as any)

      expect(result).toEqual(mockCommentData)
    })
  })
})
