/// <reference types="jest" />

const mockWishlistData = {
  _id: '507f1f77bcf86cd799439011',
  user: '507f1f77bcf86cd799439012',
  product: '507f1f77bcf86cd799439013',
  addedAt: new Date(),
  toObject: () => mockWishlistData,
}

jest.mock('@database/models/wishlist.model', () => {
  const mockModel: any = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({ toObject: () => mockWishlistData }),
  }))
  mockModel.findById = jest.fn()
  mockModel.findOne = jest.fn()
  mockModel.find = jest.fn()
  mockModel.findByIdAndUpdate = jest.fn()
  mockModel.findByIdAndDelete = jest.fn()
  mockModel.findOneAndDelete = jest.fn()
  mockModel.countDocuments = jest.fn()
  mockModel.deleteMany = jest.fn()
  mockModel.updateMany = jest.fn()
  mockModel.exists = jest.fn()
  return { WishlistModel: mockModel }
})

import { WishlistModel } from '@database/models/wishlist.model'
import { WishlistRepository } from '../../repositories/wishlist.repository'

describe('WishlistRepository', () => {
  let repository: WishlistRepository

  beforeEach(() => {
    jest.clearAllMocks()
    repository = new WishlistRepository()
  })

  describe('findById', () => {
    it('should find wishlist item by id with populated product', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockWishlistData)
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(WishlistModel.findById as jest.Mock).mockReturnValue({ populate: mockPopulate })

      const result = await repository.findById('507f1f77bcf86cd799439011')

      expect(WishlistModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
      expect(result).toEqual(mockWishlistData)
    })
  })

  describe('findOne', () => {
    it('should find one wishlist item with filter', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockWishlistData)
      ;(WishlistModel.findOne as jest.Mock).mockReturnValue({ lean: mockLean })

      const filter = { user: '507f1f77bcf86cd799439012' }
      const result = await repository.findOne(filter)

      expect(WishlistModel.findOne).toHaveBeenCalledWith(filter)
      expect(result).toEqual(mockWishlistData)
    })
  })

  describe('find', () => {
    it('should find wishlist items with filter', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockWishlistData])
      ;(WishlistModel.find as jest.Mock).mockReturnValue({ lean: mockLean })

      const filter = { user: '507f1f77bcf86cd799439012' }
      const result = await repository.find(filter)

      expect(WishlistModel.find).toHaveBeenCalledWith(filter, null, undefined)
      expect(result).toEqual([mockWishlistData])
    })
  })

  describe('findPaginated', () => {
    it('should return paginated results', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockWishlistData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort })
      ;(WishlistModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate })
      ;(WishlistModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.findPaginated({}, { page: 1, limit: 10 })

      expect(result).toEqual({
        data: [mockWishlistData],
        pagination: { page: 1, limit: 10, page_size: 1, total: 1 },
      })
    })
  })

  describe('create', () => {
    it('should create a new wishlist item', async () => {
      const result = await repository.create({ user: '507f1f77bcf86cd799439012', product: '507f1f77bcf86cd799439013' } as any)
      expect(result).toEqual(mockWishlistData)
    })
  })

  describe('updateById', () => {
    it('should update wishlist item by id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockWishlistData)
      ;(WishlistModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.updateById('507f1f77bcf86cd799439011', { addedAt: new Date() })

      expect(WishlistModel.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', expect.any(Object), { new: true })
      expect(result).toEqual(mockWishlistData)
    })
  })

  describe('updateMany', () => {
    it('should update many wishlist items', async () => {
      ;(WishlistModel.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 5 })

      const result = await repository.updateMany({ user: '507f1f77bcf86cd799439012' }, { $set: { addedAt: new Date() } })

      expect(result).toBe(5)
    })
  })

  describe('deleteById', () => {
    it('should delete wishlist item by id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockWishlistData)
      ;(WishlistModel.findByIdAndDelete as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.deleteById('507f1f77bcf86cd799439011')

      expect(WishlistModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
      expect(result).toEqual(mockWishlistData)
    })
  })

  describe('deleteMany', () => {
    it('should delete many wishlist items', async () => {
      ;(WishlistModel.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 3 })

      const result = await repository.deleteMany({ user: '507f1f77bcf86cd799439012' })

      expect(result).toBe(3)
    })
  })

  describe('count', () => {
    it('should count documents', async () => {
      ;(WishlistModel.countDocuments as jest.Mock).mockResolvedValue(5)
      const result = await repository.count({ user: '507f1f77bcf86cd799439012' })
      expect(result).toBe(5)
    })
  })

  describe('exists', () => {
    it('should return true if document exists', async () => {
      ;(WishlistModel.exists as jest.Mock).mockResolvedValue({ _id: '507f1f77bcf86cd799439011' })
      const result = await repository.exists({ user: '507f1f77bcf86cd799439012' })
      expect(result).toBe(true)
    })

    it('should return false if document does not exist', async () => {
      ;(WishlistModel.exists as jest.Mock).mockResolvedValue(null)
      const result = await repository.exists({ user: 'nonexistent' })
      expect(result).toBe(false)
    })
  })

  describe('findByUser', () => {
    it('should find wishlist items by user with pagination', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockWishlistData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort })
      ;(WishlistModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate })
      ;(WishlistModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.findByUser('507f1f77bcf86cd799439012', { page: 1, limit: 10 })

      expect(result.data).toEqual([mockWishlistData])
    })
  })

  describe('isInWishlist', () => {
    it('should return true if product is in wishlist', async () => {
      ;(WishlistModel.exists as jest.Mock).mockResolvedValue({ _id: '507f1f77bcf86cd799439011' })
      const result = await repository.isInWishlist('507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013')
      expect(result).toBe(true)
    })

    it('should return false if product is not in wishlist', async () => {
      ;(WishlistModel.exists as jest.Mock).mockResolvedValue(null)
      const result = await repository.isInWishlist('507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013')
      expect(result).toBe(false)
    })
  })

  describe('addToWishlist', () => {
    it('should return existing item if already in wishlist', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockWishlistData)
      ;(WishlistModel.findOne as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.addToWishlist('507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013')

      expect(result).toEqual(mockWishlistData)
    })

    it('should create new item if not in wishlist', async () => {
      const mockLean = jest.fn().mockResolvedValue(null)
      ;(WishlistModel.findOne as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.addToWishlist('507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013')

      expect(result).toEqual(mockWishlistData)
    })
  })

  describe('removeFromWishlist', () => {
    it('should remove product from wishlist', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockWishlistData)
      ;(WishlistModel.findOneAndDelete as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.removeFromWishlist('507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013')

      expect(WishlistModel.findOneAndDelete).toHaveBeenCalled()
      expect(result).toEqual(mockWishlistData)
    })
  })

  describe('clearUserWishlist', () => {
    it('should clear all wishlist items for user', async () => {
      ;(WishlistModel.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 5 })

      const result = await repository.clearUserWishlist('507f1f77bcf86cd799439012')

      expect(result).toBe(5)
    })
  })

  describe('getUserWishlistCount', () => {
    it('should return count of user wishlist items', async () => {
      ;(WishlistModel.countDocuments as jest.Mock).mockResolvedValue(10)

      const result = await repository.getUserWishlistCount('507f1f77bcf86cd799439012')

      expect(result).toBe(10)
    })
  })

  describe('checkProducts', () => {
    it('should return map of product ids to wishlist status', async () => {
      const mockLean = jest.fn().mockResolvedValue([
        { product: { toString: () => '507f1f77bcf86cd799439013' } },
      ])
      ;(WishlistModel.find as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.checkProducts('507f1f77bcf86cd799439012', ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014'])

      expect(result.get('507f1f77bcf86cd799439013')).toBe(true)
      expect(result.get('507f1f77bcf86cd799439014')).toBe(false)
    })
  })
})

