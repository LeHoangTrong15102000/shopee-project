/// <reference types="jest" />
import { Types } from 'mongoose'
import { WishlistService } from '@services/wishlist.service'
import { IWishlistRepository } from '@repositories/interfaces/wishlist.repository.interface'
import { NotFoundError, ValidationError } from '@services/base.service'

jest.mock('@utils/helper', () => ({ HOST: 'http://localhost:4000' }))

const mockWishlistRepository = {
  findByUser: jest.fn(),
  findById: jest.fn(),
  addToWishlist: jest.fn(),
  removeFromWishlist: jest.fn(),
  isInWishlist: jest.fn(),
  clearUserWishlist: jest.fn(),
  getUserWishlistCount: jest.fn(),
  checkProducts: jest.fn(),
} as unknown as jest.Mocked<IWishlistRepository>

describe('WishlistService', () => {
  let service: WishlistService
  const userId = new Types.ObjectId().toString()
  const productId = new Types.ObjectId().toString()

  beforeEach(() => {
    jest.clearAllMocks()
    service = new WishlistService(mockWishlistRepository)
  })

  describe('getWishlist', () => {
    it('should return items with transformed image URLs', async () => {
      const mockData = {
        data: [{ _id: new Types.ObjectId(), user: new Types.ObjectId(), product: { image: 'test.jpg' }, addedAt: new Date() }],
        pagination: { page: 1, limit: 10, page_size: 1, total: 1 },
      }
      ;(mockWishlistRepository.findByUser as jest.Mock).mockResolvedValue(mockData)

      const result = await service.getWishlist(userId, { page: 1, limit: 10 })

      expect(result.data[0].product.image).toBe('http://localhost:4000/images/test.jpg')
      expect(mockWishlistRepository.findByUser).toHaveBeenCalledWith(userId, expect.any(Object))
    })
  })

  describe('addToWishlist', () => {
    it('should add product with valid IDs', async () => {
      const mockItem = { _id: new Types.ObjectId(), user: new Types.ObjectId(userId), product: new Types.ObjectId(productId), addedAt: new Date() }
      ;(mockWishlistRepository.addToWishlist as jest.Mock).mockResolvedValue(mockItem)
      ;(mockWishlistRepository.findById as jest.Mock).mockResolvedValue({ ...mockItem, product: { image: 'img.jpg' } })

      const result = await service.addToWishlist(userId, productId)

      expect(result.product.image).toBe('http://localhost:4000/images/img.jpg')
    })

    it('should throw ValidationError for invalid productId', async () => {
      await expect(service.addToWishlist(userId, 'invalid')).rejects.toThrow(ValidationError)
    })
  })

  describe('removeFromWishlist', () => {
    it('should remove item when found', async () => {
      ;(mockWishlistRepository.removeFromWishlist as jest.Mock).mockResolvedValue({ _id: new Types.ObjectId() })

      await expect(service.removeFromWishlist(userId, productId)).resolves.toBeUndefined()
      expect(mockWishlistRepository.removeFromWishlist).toHaveBeenCalledWith(userId, productId)
    })

    it('should throw NotFoundError when item not found', async () => {
      ;(mockWishlistRepository.removeFromWishlist as jest.Mock).mockResolvedValue(null)

      await expect(service.removeFromWishlist(userId, productId)).rejects.toThrow(NotFoundError)
    })
  })

  describe('isInWishlist', () => {
    it('should return boolean', async () => {
      ;(mockWishlistRepository.isInWishlist as jest.Mock).mockResolvedValue(true)

      const result = await service.isInWishlist(userId, productId)

      expect(result).toBe(true)
    })
  })

  describe('clearWishlist', () => {
    it('should return deleted count', async () => {
      ;(mockWishlistRepository.clearUserWishlist as jest.Mock).mockResolvedValue(5)

      const result = await service.clearWishlist(userId)

      expect(result).toBe(5)
    })
  })

  describe('getWishlistCount', () => {
    it('should return count', async () => {
      ;(mockWishlistRepository.getUserWishlistCount as jest.Mock).mockResolvedValue(3)

      const result = await service.getWishlistCount(userId)

      expect(result).toBe(3)
    })
  })

  describe('checkProducts', () => {
    it('should return map for valid product IDs', async () => {
      const productIds = [new Types.ObjectId().toString(), new Types.ObjectId().toString()]
      const mockMap = new Map([[productIds[0], true], [productIds[1], false]])
      ;(mockWishlistRepository.checkProducts as jest.Mock).mockResolvedValue(mockMap)

      const result = await service.checkProducts(userId, productIds)

      expect(result.get(productIds[0])).toBe(true)
      expect(result.get(productIds[1])).toBe(false)
    })

    it('should throw ValidationError for invalid product IDs', async () => {
      await expect(service.checkProducts(userId, ['invalid-id'])).rejects.toThrow(ValidationError)
    })
  })
})

