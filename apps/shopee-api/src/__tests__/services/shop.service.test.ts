/// <reference types="jest" />

const mockShopFindById = jest.fn()
const mockShopFindByIdAndUpdate = jest.fn()
const mockProductFind = jest.fn()
const mockProductCountDocuments = jest.fn()

jest.mock('@database/models/shop.model', () => ({
  ShopModel: {
    findById: jest.fn(() => ({ lean: mockShopFindById })),
    findByIdAndUpdate: mockShopFindByIdAndUpdate,
  },
}))

jest.mock('@database/models/product.model', () => ({
  ProductModel: {
    find: jest.fn(() => ({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: mockProductFind,
    })),
    countDocuments: mockProductCountDocuments,
  },
}))

import { ShopService } from '@services/shop.service'
import { ShopModel } from '@database/models/shop.model'

const VALID_ID = '507f1f77bcf86cd799439011'
const INVALID_ID = 'not-an-id'

describe('ShopService', () => {
  let service: ShopService

  beforeEach(() => {
    service = new ShopService()
    jest.clearAllMocks()
  })

  describe('getShop', () => {
    it('throws ValidationError for invalid id', async () => {
      await expect(service.getShop(INVALID_ID)).rejects.toThrow('Invalid shop id')
    })

    it('throws NotFoundError when shop not found', async () => {
      mockShopFindById.mockResolvedValue(null)
      await expect(service.getShop(VALID_ID)).rejects.toThrow()
    })

    it('throws NotFoundError for suspended shop', async () => {
      mockShopFindById.mockResolvedValue({
        _id: VALID_ID,
        status: 'suspended',
        followers: [],
        followerCount: 0,
        rating: 4.5,
      })
      await expect(service.getShop(VALID_ID)).rejects.toThrow()
    })

    it('throws NotFoundError for banned shop', async () => {
      mockShopFindById.mockResolvedValue({
        _id: VALID_ID,
        status: 'banned',
        followers: [],
        followerCount: 0,
        rating: 4.5,
      })
      await expect(service.getShop(VALID_ID)).rejects.toThrow()
    })

    it('returns shop with isFollowing false when no userId', async () => {
      mockShopFindById.mockResolvedValue({
        _id: VALID_ID,
        name: 'Test Shop',
        status: 'active',
        followers: [],
        followerCount: 0,
        rating: 4.5,
      })
      const result = await service.getShop(VALID_ID)
      expect(result.isFollowing).toBe(false)
    })

    it('returns isFollowing true when userId is in followers', async () => {
      const userId = '507f1f77bcf86cd799439012'
      mockShopFindById.mockResolvedValue({
        _id: VALID_ID,
        name: 'Test Shop',
        status: 'active',
        followers: [{ toString: () => userId }],
        followerCount: 1,
        rating: 4.5,
      })
      const result = await service.getShop(VALID_ID, userId)
      expect(result.isFollowing).toBe(true)
    })
  })

  describe('getShopProducts', () => {
    it('throws ValidationError for invalid shopId', async () => {
      await expect(service.getShopProducts(INVALID_ID)).rejects.toThrow('Invalid shop id')
    })

    it('returns paginated products', async () => {
      mockProductFind.mockResolvedValue([{ _id: 'p1', name: 'Product 1' }])
      mockProductCountDocuments.mockResolvedValue(1)

      const result = await service.getShopProducts(VALID_ID, 1, 10, 'createdAt')
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('page', 1)
      expect(result).toHaveProperty('limit', 10)
    })

    it('uses default pagination values', async () => {
      mockProductFind.mockResolvedValue([])
      mockProductCountDocuments.mockResolvedValue(0)

      const result = await service.getShopProducts(VALID_ID)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })
  })

  describe('followShop', () => {
    it('throws ValidationError for invalid shopId', async () => {
      await expect(service.followShop(INVALID_ID, 'user1')).rejects.toThrow('Invalid shop id')
    })

    it('throws NotFoundError when shop not found', async () => {
      mockShopFindById.mockResolvedValue(null)
      await expect(service.followShop(VALID_ID, 'user1')).rejects.toThrow()
    })

    it('calls ShopModel.findByIdAndUpdate with $addToSet when not already following', async () => {
      const userId = '507f1f77bcf86cd799439012'
      ;(ShopModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      })
      // findById for the shop check (not lean)
      ;(ShopModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn(),
      })
      // Override to return a shop object directly (not lean)
      ;(ShopModel.findById as jest.Mock).mockResolvedValue({
        _id: VALID_ID,
        followers: [],
      })
      mockShopFindByIdAndUpdate.mockResolvedValue({})

      await service.followShop(VALID_ID, userId)
      expect(ShopModel.findByIdAndUpdate).toHaveBeenCalledWith(
        VALID_ID,
        expect.objectContaining({ $addToSet: expect.any(Object) }),
      )
    })

    it('does not call findByIdAndUpdate when already following', async () => {
      const userId = '507f1f77bcf86cd799439012'
      ;(ShopModel.findById as jest.Mock).mockResolvedValue({
        _id: VALID_ID,
        followers: [{ toString: () => userId }],
      })

      await service.followShop(VALID_ID, userId)
      expect(ShopModel.findByIdAndUpdate).not.toHaveBeenCalled()
    })
  })

  describe('unfollowShop', () => {
    it('throws ValidationError for invalid shopId', async () => {
      await expect(service.unfollowShop(INVALID_ID, 'user1')).rejects.toThrow('Invalid shop id')
    })

    it('throws NotFoundError when shop not found', async () => {
      ;(ShopModel.findById as jest.Mock).mockResolvedValue(null)
      await expect(service.unfollowShop(VALID_ID, 'user1')).rejects.toThrow()
    })

    it('calls ShopModel.findByIdAndUpdate with $pull when following', async () => {
      const userId = '507f1f77bcf86cd799439012'
      ;(ShopModel.findById as jest.Mock).mockResolvedValue({
        _id: VALID_ID,
        followers: [{ toString: () => userId }],
      })
      mockShopFindByIdAndUpdate.mockResolvedValue({})

      await service.unfollowShop(VALID_ID, userId)
      expect(ShopModel.findByIdAndUpdate).toHaveBeenCalledWith(
        VALID_ID,
        expect.objectContaining({ $pull: expect.any(Object) }),
      )
    })

    it('does not call findByIdAndUpdate when not following', async () => {
      const userId = '507f1f77bcf86cd799439012'
      ;(ShopModel.findById as jest.Mock).mockResolvedValue({
        _id: VALID_ID,
        followers: [],
      })

      await service.unfollowShop(VALID_ID, userId)
      expect(ShopModel.findByIdAndUpdate).not.toHaveBeenCalled()
    })
  })
})
