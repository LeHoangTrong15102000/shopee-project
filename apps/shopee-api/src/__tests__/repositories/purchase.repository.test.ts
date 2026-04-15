/// <reference types="jest" />

const mockPurchaseData = {
  _id: '507f1f77bcf86cd799439011',
  user: '507f1f77bcf86cd799439012',
  product: '507f1f77bcf86cd799439013',
  buy_count: 2,
  price: 100,
  price_before_discount: 120,
  status: -1,
  toObject: () => mockPurchaseData,
}

jest.mock('@constants/purchase', () => ({
  STATUS_PURCHASE: {
    IN_CART: -1,
    ALL: 0,
    WAIT_FOR_CONFIRMATION: 1,
    WAIT_FOR_GETTING: 2,
    IN_PROGRESS: 3,
    DELIVERED: 4,
    CANCELLED: 5,
  },
}))

jest.mock('@database/models/purchase.model', () => {
  const mockModel: any = jest.fn()
  mockModel.findById = jest.fn().mockReturnValue({
    populate: jest
      .fn()
      .mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn() }) }),
  })
  mockModel.findOne = jest.fn().mockReturnValue({
    populate: jest
      .fn()
      .mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn() }) }),
  })
  mockModel.find = jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({ lean: jest.fn() }),
          }),
        }),
        lean: jest.fn(),
      }),
    }),
  })
  mockModel.findByIdAndUpdate = jest.fn().mockReturnValue({
    populate: jest
      .fn()
      .mockReturnValue({ populate: jest.fn().mockReturnValue({ lean: jest.fn() }) }),
  })
  mockModel.findByIdAndDelete = jest.fn().mockReturnValue({ lean: jest.fn() })
  mockModel.countDocuments = jest.fn()
  mockModel.deleteMany = jest.fn()
  mockModel.updateMany = jest.fn()
  mockModel.exists = jest.fn()
  mockModel.aggregate = jest.fn()
  return { PurchaseModel: mockModel }
})

import { PurchaseModel } from '@database/models/purchase.model'
import { PurchaseRepository } from '../../repositories/purchase.repository'

describe('PurchaseRepository', () => {
  let repository: PurchaseRepository

  beforeEach(() => {
    jest.clearAllMocks()
    // Re-setup constructor mock after clearAllMocks
    ;(PurchaseModel as any).mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({ toObject: () => mockPurchaseData }),
    }))
    repository = new PurchaseRepository()
  })

  describe('findById', () => {
    it('should find purchase by id with populated user and product', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockPurchaseData)
      const mockPopulate2 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.findById as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      const result = await repository.findById('507f1f77bcf86cd799439011')

      expect(PurchaseModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
      expect(result).toEqual(mockPurchaseData)
    })
  })

  describe('findOne', () => {
    it('should find one purchase with filter', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockPurchaseData)
      const mockPopulate2 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.findOne as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      const result = await repository.findOne({ user: '507f1f77bcf86cd799439012' })

      expect(PurchaseModel.findOne).toHaveBeenCalledWith({ user: '507f1f77bcf86cd799439012' })
      expect(result).toEqual(mockPurchaseData)
    })
  })

  describe('find', () => {
    it('should find purchases with filter', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockPurchaseData])
      const mockPopulate2 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      const result = await repository.find({ status: -1 })

      expect(PurchaseModel.find).toHaveBeenCalledWith({ status: -1 }, null, undefined)
      expect(result).toEqual([mockPurchaseData])
    })
  })

  describe('findPaginated', () => {
    it('should return paginated results', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockPurchaseData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockPopulate2 = jest.fn().mockReturnValue({ sort: mockSort })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate1 })
      ;(PurchaseModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.findPaginated({}, { page: 1, limit: 10 })

      expect(result).toEqual({
        data: [mockPurchaseData],
        pagination: { page: 1, limit: 10, page_size: 1, total: 1 },
      })
    })
  })

  describe('create', () => {
    it('should create a new purchase', async () => {
      const result = await repository.create({
        user: '507f1f77bcf86cd799439012',
        product: '507f1f77bcf86cd799439013',
        buy_count: 2,
        price: 100,
        price_before_discount: 120,
        status: -1,
      })
      expect(result).toEqual(mockPurchaseData)
    })
  })

  describe('updateById', () => {
    it('should update purchase by id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockPurchaseData)
      const mockPopulate2 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      const result = await repository.updateById('507f1f77bcf86cd799439011', { buy_count: 3 })

      expect(PurchaseModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { buy_count: 3 },
        { new: true },
      )
      expect(result).toEqual(mockPurchaseData)
    })
  })

  describe('deleteById', () => {
    it('should delete purchase by id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockPurchaseData)
      ;(PurchaseModel.findByIdAndDelete as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.deleteById('507f1f77bcf86cd799439011')

      expect(PurchaseModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
      expect(result).toEqual(mockPurchaseData)
    })
  })

  describe('count', () => {
    it('should count documents', async () => {
      ;(PurchaseModel.countDocuments as jest.Mock).mockResolvedValue(5)
      const result = await repository.count({ status: -1 })
      expect(result).toBe(5)
    })
  })

  describe('exists', () => {
    it('should return true if document exists', async () => {
      ;(PurchaseModel.exists as jest.Mock).mockResolvedValue({ _id: '507f1f77bcf86cd799439011' })
      const result = await repository.exists({ user: '507f1f77bcf86cd799439012' })
      expect(result).toBe(true)
    })

    it('should return false if document does not exist', async () => {
      ;(PurchaseModel.exists as jest.Mock).mockResolvedValue(null)
      const result = await repository.exists({ user: 'nonexistent' })
      expect(result).toBe(false)
    })
  })

  describe('findByUser', () => {
    it('should find purchases by user', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockPurchaseData])
      const mockPopulate2 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      const result = await repository.findByUser('507f1f77bcf86cd799439012')

      expect(result).toEqual([mockPurchaseData])
    })
  })

  describe('findCart', () => {
    it('should find cart items for user', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockPurchaseData])
      const mockPopulate2 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      const result = await repository.findCart('507f1f77bcf86cd799439012')

      expect(result).toEqual([mockPurchaseData])
    })
  })

  describe('addToCart', () => {
    it('should add new item to cart', async () => {
      const mockLean = jest.fn().mockResolvedValue(null)
      const mockPopulate2 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.findOne as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      const result = await repository.addToCart(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013',
        2,
        100,
        120,
      )

      expect(result).toEqual(mockPurchaseData)
    })

    it('should update existing cart item', async () => {
      const existingItem = { ...mockPurchaseData, buy_count: 1 }
      const mockLean = jest.fn().mockResolvedValue(existingItem)
      const mockPopulate2 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.findOne as jest.Mock).mockReturnValue({ populate: mockPopulate1 })
      ;(PurchaseModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      const result = await repository.addToCart(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013',
        2,
        100,
        120,
      )

      expect(result).toBeDefined()
    })
  })

  describe('updateCartItem', () => {
    it('should update cart item buy count', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockPurchaseData)
      const mockPopulate2 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      const result = await repository.updateCartItem('507f1f77bcf86cd799439011', 5)

      expect(result).toEqual(mockPurchaseData)
    })
  })

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockPurchaseData)
      ;(PurchaseModel.findByIdAndDelete as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.removeFromCart('507f1f77bcf86cd799439011')

      expect(result).toBe(true)
    })

    it('should return false if item not found', async () => {
      const mockLean = jest.fn().mockResolvedValue(null)
      ;(PurchaseModel.findByIdAndDelete as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.removeFromCart('nonexistent')

      expect(result).toBe(false)
    })
  })

  describe('clearCart', () => {
    it('should clear all cart items for user', async () => {
      ;(PurchaseModel.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 3 })

      const result = await repository.clearCart('507f1f77bcf86cd799439012')

      expect(result).toBe(3)
    })
  })

  describe('updateStatus', () => {
    it('should update purchase status', async () => {
      const mockLean = jest.fn().mockResolvedValue({ ...mockPurchaseData, status: 1 })
      const mockPopulate2 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      const result = await repository.updateStatus('507f1f77bcf86cd799439011', 1)

      expect(result?.status).toBe(1)
    })
  })

  describe('bulkUpdateStatus', () => {
    it('should bulk update purchase statuses', async () => {
      ;(PurchaseModel.updateMany as jest.Mock).mockResolvedValue({ modifiedCount: 3 })

      const result = await repository.bulkUpdateStatus(
        ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013'],
        1,
      )

      expect(result).toBe(3)
    })
  })

  describe('findByStatus', () => {
    it('should find purchases by status', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockPurchaseData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockPopulate2 = jest.fn().mockReturnValue({ sort: mockSort })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate1 })
      ;(PurchaseModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.findByStatus(1, { page: 1, limit: 10 })

      expect(result.data).toEqual([mockPurchaseData])
    })
  })

  describe('getUserStats', () => {
    it('should get user purchase statistics', async () => {
      ;(PurchaseModel.countDocuments as jest.Mock).mockResolvedValue(10)
      ;(PurchaseModel.aggregate as jest.Mock)
        .mockResolvedValueOnce([{ total: 1000 }])
        .mockResolvedValueOnce([
          { _id: -1, count: 2 },
          { _id: 4, count: 8 },
        ])

      const result = await repository.getUserStats('507f1f77bcf86cd799439012')

      expect(result.total_orders).toBe(10)
      expect(result.total_spent).toBe(1000)
    })
  })

  describe('findCartItem', () => {
    it('should find specific cart item', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockPurchaseData)
      const mockPopulate2 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.findOne as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      const result = await repository.findCartItem(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013',
      )

      expect(result).toEqual(mockPurchaseData)
    })
  })

  describe('findByIdAndUser', () => {
    it('should find purchase by id and user', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockPurchaseData)
      const mockPopulate2 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.findOne as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      const result = await repository.findByIdAndUser(
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439012',
      )

      expect(result).toEqual(mockPurchaseData)
    })
  })

  describe('deleteByUserAndProduct', () => {
    it('should delete purchase by user and product', async () => {
      ;(PurchaseModel.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 1 })

      const result = await repository.deleteByUserAndProduct(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013',
        -1,
      )

      expect(result).toBe(1)
    })
  })
})
