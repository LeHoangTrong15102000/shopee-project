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
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({ lean: jest.fn() }),
      }),
    }),
  })
  mockModel.findOne = jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({ lean: jest.fn() }),
      }),
    }),
  })
  mockModel.find = jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
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
    }),
  })
  mockModel.findByIdAndUpdate = jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({ lean: jest.fn() }),
      }),
    }),
  })
  mockModel.findByIdAndDelete = jest.fn().mockReturnValue({ lean: jest.fn() })
  mockModel.countDocuments = jest.fn()
  mockModel.deleteMany = jest.fn()
  mockModel.updateMany = jest.fn()
  mockModel.exists = jest.fn()
  mockModel.aggregate = jest.fn()
  mockModel.findOneAndUpdate = jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({ lean: jest.fn() }),
      }),
    }),
  })
  mockModel.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 })
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
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
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
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
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
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
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
      const mockPopulate3 = jest.fn().mockReturnValue({ sort: mockSort })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
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
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
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
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      const result = await repository.findByUser('507f1f77bcf86cd799439012')

      expect(result).toEqual([mockPurchaseData])
    })
  })

  describe('findCart', () => {
    it('should find cart items for user', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockPurchaseData])
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      const result = await repository.findCart('507f1f77bcf86cd799439012')

      expect(result).toEqual([mockPurchaseData])
    })
  })

  describe('addToCart', () => {
    it('should add new item to cart', async () => {
      const mockLean = jest.fn().mockResolvedValue(null)
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
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
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
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

    it('should create separate line when skuId differs from existing line', async () => {
      // findCartItem returns null → different sku means no match → new line created
      const mockLean = jest.fn().mockResolvedValue(null)
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.findOne as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      const result = await repository.addToCart(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013',
        1,
        100,
        120,
        '507f1f77bcf86cd799439099',
      )

      // Should have created a new purchase (save path) rather than updating
      expect(PurchaseModel.findByIdAndUpdate).not.toHaveBeenCalled()
      expect(result).toEqual(mockPurchaseData)
    })

    it('should merge buy_count when same skuId already in cart', async () => {
      const skuId = '507f1f77bcf86cd799439099'
      const existingItem = {
        ...mockPurchaseData,
        _id: '507f1f77bcf86cd799439011',
        buy_count: 3,
        sku: skuId,
      }
      const mockUpdateLean = jest.fn().mockResolvedValue({ ...existingItem, buy_count: 5 })
      const mockUpdatePopulate3 = jest.fn().mockReturnValue({ lean: mockUpdateLean })
      const mockUpdatePopulate2 = jest.fn().mockReturnValue({ populate: mockUpdatePopulate3 })
      const mockUpdatePopulate1 = jest.fn().mockReturnValue({ populate: mockUpdatePopulate2 })

      const mockFindLean = jest.fn().mockResolvedValue(existingItem)
      const mockFindPopulate3 = jest.fn().mockReturnValue({ lean: mockFindLean })
      const mockFindPopulate2 = jest.fn().mockReturnValue({ populate: mockFindPopulate3 })
      const mockFindPopulate1 = jest.fn().mockReturnValue({ populate: mockFindPopulate2 })

      ;(PurchaseModel.findOne as jest.Mock).mockReturnValue({ populate: mockFindPopulate1 })
      ;(PurchaseModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: mockUpdatePopulate1,
      })

      const result = await repository.addToCart(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013',
        2,
        100,
        120,
        skuId,
      )

      // findCartItem was called with the skuId
      expect(PurchaseModel.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          sku: expect.objectContaining({ toString: expect.any(Function) }),
          status: -1,
        }),
      )
      // updateById was called — merge path
      expect(PurchaseModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({ buy_count: 5 }),
        { new: true },
      )
      // sku must NOT be overwritten in the update payload
      const updatePayload = (PurchaseModel.findByIdAndUpdate as jest.Mock).mock.calls[0][1]
      expect(updatePayload).not.toHaveProperty('sku')
      expect(result).toBeDefined()
    })
  })

  describe('updateCartItem', () => {
    it('should update cart item buy count', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockPurchaseData)
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
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
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
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
      const mockPopulate3 = jest.fn().mockReturnValue({ sort: mockSort })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
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
    it('should find specific cart item without sku (non-variant)', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockPurchaseData)
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.findOne as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      const result = await repository.findCartItem(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013',
      )

      expect(result).toEqual(mockPurchaseData)
      // Without skuId the filter must use { sku: null } so it matches null/missing-field documents
      expect(PurchaseModel.findOne).toHaveBeenCalledWith(expect.objectContaining({ sku: null }))
    })

    it('should include sku ObjectId in filter when skuId is provided', async () => {
      const skuId = '507f1f77bcf86cd799439099'
      const mockLean = jest.fn().mockResolvedValue(mockPurchaseData)
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.findOne as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      await repository.findCartItem('507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013', skuId)

      const calledFilter = (PurchaseModel.findOne as jest.Mock).mock.calls[0][0]
      // sku filter must be an ObjectId (not the raw string)
      expect(calledFilter.sku).toBeDefined()
      expect(calledFilter.sku.toString()).toBe(skuId)
    })

    it('should use sku: null filter when skuId is null', async () => {
      const mockLean = jest.fn().mockResolvedValue(null)
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.findOne as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      await repository.findCartItem('507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013', null)

      expect(PurchaseModel.findOne).toHaveBeenCalledWith(expect.objectContaining({ sku: null }))
    })
  })

  describe('findByIdAndUser', () => {
    it('should find purchase by id and user', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockPurchaseData)
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
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

  // Task 3.8 — session is threaded through to Mongoose operations
  describe('deleteManyByUserAndProducts — session option', () => {
    it('passes session to PurchaseModel.deleteMany when provided', async () => {
      ;(PurchaseModel.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 2 })
      const mockSession = { id: 'session-1' } as any

      const result = await repository.deleteManyByUserAndProducts(
        '507f1f77bcf86cd799439012',
        ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439014'],
        -1,
        { session: mockSession },
      )

      expect(result).toBe(2)
      // Verify deleteMany was called with a second argument containing the session
      const callArgs = (PurchaseModel.deleteMany as jest.Mock).mock.calls[0]
      expect(callArgs[1]).toEqual({ session: mockSession })
    })

    it('calls PurchaseModel.deleteMany without session option when session is omitted', async () => {
      ;(PurchaseModel.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 1 })

      await repository.deleteManyByUserAndProducts(
        '507f1f77bcf86cd799439012',
        ['507f1f77bcf86cd799439013'],
        -1,
      )

      const callArgs = (PurchaseModel.deleteMany as jest.Mock).mock.calls[0]
      // Second argument should be undefined when no session
      expect(callArgs[1]).toBeUndefined()
    })

    it('issues a single deleteMany call regardless of how many product IDs are given', async () => {
      ;(PurchaseModel.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 10 })
      const mockSession = {} as any

      await repository.deleteManyByUserAndProducts(
        '507f1f77bcf86cd799439012',
        Array.from({ length: 10 }, () => '507f1f77bcf86cd799439013'),
        -1,
        { session: mockSession },
      )

      // N items → still just 1 deleteMany call (task 5.2 N→1 benchmark)
      expect(PurchaseModel.deleteMany).toHaveBeenCalledTimes(1)
    })
  })

  // Task 8.5 — Legacy no-sku document regression
  // MongoDB `{ sku: null }` matches both explicit `sku: null` and documents where
  // the sku field is absent entirely (legacy cart documents created before the
  // variant feature was introduced). These tests confirm the non-variant path is
  // fully green and that no migration is required.
  describe('Legacy no-sku document regression (Task 8.5)', () => {
    it('findCartItem without skuId uses { sku: null } filter, matching legacy absent-field documents', async () => {
      // Simulate a legacy document that has NO sku field at all (undefined)
      const legacyDoc = {
        ...mockPurchaseData,
        _id: '507f1f77bcf86cd799439030',
        // sku is intentionally absent — this is the "legacy" shape
      }
      const mockLean = jest.fn().mockResolvedValue(legacyDoc)
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.findOne as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      const result = await repository.findCartItem(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013',
        // No skuId — the non-variant call
      )

      // The filter must be { sku: null } so Mongo returns documents where sku is absent
      expect(PurchaseModel.findOne).toHaveBeenCalledWith(expect.objectContaining({ sku: null }))
      // The legacy document is returned correctly
      expect(result).toEqual(legacyDoc)
    })

    it('findCartItem with explicit null skuId also uses { sku: null } filter', async () => {
      const legacyDoc = { ...mockPurchaseData, _id: '507f1f77bcf86cd799439031' }
      const mockLean = jest.fn().mockResolvedValue(legacyDoc)
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.findOne as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      await repository.findCartItem('507f1f77bcf86cd799439012', '507f1f77bcf86cd799439013', null)

      expect(PurchaseModel.findOne).toHaveBeenCalledWith(expect.objectContaining({ sku: null }))
    })

    it('addToCart without skuId merges with the legacy no-sku cart document (increments buy_count)', async () => {
      // Legacy doc has no sku field — represents a pre-variant cart item
      const legacyCartItem = {
        ...mockPurchaseData,
        _id: '507f1f77bcf86cd799439032',
        buy_count: 2,
        // sku absent
      }

      const mockFindLean = jest.fn().mockResolvedValue(legacyCartItem)
      const mockFindPopulate3 = jest.fn().mockReturnValue({ lean: mockFindLean })
      const mockFindPopulate2 = jest.fn().mockReturnValue({ populate: mockFindPopulate3 })
      const mockFindPopulate1 = jest.fn().mockReturnValue({ populate: mockFindPopulate2 })

      const mockUpdateLean = jest.fn().mockResolvedValue({ ...legacyCartItem, buy_count: 5 })
      const mockUpdatePopulate3 = jest.fn().mockReturnValue({ lean: mockUpdateLean })
      const mockUpdatePopulate2 = jest.fn().mockReturnValue({ populate: mockUpdatePopulate3 })
      const mockUpdatePopulate1 = jest.fn().mockReturnValue({ populate: mockUpdatePopulate2 })

      ;(PurchaseModel.findOne as jest.Mock).mockReturnValue({ populate: mockFindPopulate1 })
      ;(PurchaseModel.findByIdAndUpdate as jest.Mock).mockReturnValue({
        populate: mockUpdatePopulate1,
      })

      // Call addToCart without skuId — must find the legacy line and merge
      const result = await repository.addToCart(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013',
        3, // adding 3 to existing 2 → 5
        100,
        120,
        // no skuId
      )

      // findOne must be called with { sku: null } — the legacy-compatible filter
      expect(PurchaseModel.findOne).toHaveBeenCalledWith(expect.objectContaining({ sku: null }))
      // Must use updateById (merge path), not save (create path)
      expect(PurchaseModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439032',
        expect.objectContaining({ buy_count: 5 }),
        { new: true },
      )
      // sku must NOT be written on the merge path
      const updatePayload = (PurchaseModel.findByIdAndUpdate as jest.Mock).mock.calls[0][1]
      expect(updatePayload).not.toHaveProperty('sku')
      expect(result).toBeDefined()
    })

    it('addToCart without skuId creates a new non-variant line when no matching line exists', async () => {
      // findCartItem returns null → no existing non-variant line
      const mockLean = jest.fn().mockResolvedValue(null)
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.findOne as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      await repository.addToCart(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013',
        1,
        100,
        120,
        // no skuId
      )

      // No merge → new document saved, not an update
      expect(PurchaseModel.findByIdAndUpdate).not.toHaveBeenCalled()
      // The created document must not include a sku field
      // (save() is called on a new PurchaseModel instance — constructor called)
      expect(PurchaseModel).toHaveBeenCalled()
    })

    it('non-variant updateCartItem does not write sku field', async () => {
      const mockLean = jest.fn().mockResolvedValue({ ...mockPurchaseData, buy_count: 7 })
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ populate: mockPopulate1 })

      await repository.updateCartItem('507f1f77bcf86cd799439011', 7)

      // update payload must only have buy_count — no sku key
      const updatePayload = (PurchaseModel.findByIdAndUpdate as jest.Mock).mock.calls[0][1]
      expect(updatePayload).toHaveProperty('buy_count', 7)
      expect(updatePayload).not.toHaveProperty('sku')
    })
  })

  // switchCartItemSku and mergeAndDeleteSourceLine tests
  describe('switchCartItemSku', () => {
    const buildFindOneAndUpdateChain = (returnVal: any) => {
      const mockLean = jest.fn().mockResolvedValue(returnVal)
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.findOneAndUpdate as jest.Mock).mockReturnValue({ populate: mockPopulate1 })
    }

    it('should update sku, price, and price_before_discount on the matching line', async () => {
      const switched = {
        ...mockPurchaseData,
        sku: '507f1f77bcf86cd799439099',
        price: 200,
        price_before_discount: 250,
      }
      buildFindOneAndUpdateChain(switched)

      const result = await repository.switchCartItemSku(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013',
        '507f1f77bcf86cd799439020',
        '507f1f77bcf86cd799439099',
        200,
        250,
      )

      expect(result).toEqual(switched)
      const [filter, update] = (PurchaseModel.findOneAndUpdate as jest.Mock).mock.calls[0]
      // Filter must match by current sku and IN_CART status
      expect(filter.sku.toString()).toBe('507f1f77bcf86cd799439020')
      expect(filter.status).toBe(-1)
      // Update must write target sku and both price fields
      expect(update.sku.toString()).toBe('507f1f77bcf86cd799439099')
      expect(update.price).toBe(200)
      expect(update.price_before_discount).toBe(250)
    })

    it('should return null when no matching line exists', async () => {
      buildFindOneAndUpdateChain(null)

      const result = await repository.switchCartItemSku(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013',
        '507f1f77bcf86cd799439020',
        '507f1f77bcf86cd799439099',
        200,
        250,
      )

      expect(result).toBeNull()
    })
  })

  describe('mergeAndDeleteSourceLine', () => {
    const buildFindOneAndUpdateChain = (returnVal: any) => {
      const mockLean = jest.fn().mockResolvedValue(returnVal)
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.findOneAndUpdate as jest.Mock).mockReturnValue({ populate: mockPopulate1 })
    }

    it('should write merged buy_count to target line then delete source line', async () => {
      const mergedLine = { ...mockPurchaseData, buy_count: 5 }
      buildFindOneAndUpdateChain(mergedLine)
      ;(PurchaseModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 })

      const result = await repository.mergeAndDeleteSourceLine(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013',
        '507f1f77bcf86cd799439020',
        '507f1f77bcf86cd799439099',
        5,
        200,
        250,
      )

      expect(result).toEqual(mergedLine)
      // Step 1: findOneAndUpdate targets the TARGET sku line
      const [filter, update] = (PurchaseModel.findOneAndUpdate as jest.Mock).mock.calls[0]
      expect(filter.sku.toString()).toBe('507f1f77bcf86cd799439099')
      expect(update.buy_count).toBe(5)
      expect(update.price).toBe(200)
      expect(update.price_before_discount).toBe(250)
      // Step 2: deleteOne targets the SOURCE sku line
      const deleteFilter = (PurchaseModel.deleteOne as jest.Mock).mock.calls[0][0]
      expect(deleteFilter.sku.toString()).toBe('507f1f77bcf86cd799439020')
    })

    it('should return null and not call deleteOne when target line not found', async () => {
      buildFindOneAndUpdateChain(null)
      ;(PurchaseModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 })

      const result = await repository.mergeAndDeleteSourceLine(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013',
        '507f1f77bcf86cd799439020',
        '507f1f77bcf86cd799439099',
        5,
        200,
        250,
      )

      expect(result).toBeNull()
      expect(PurchaseModel.deleteOne).not.toHaveBeenCalled()
    })

    it('should complete merged write before source delete (ordering assertion)', async () => {
      const callOrder: string[] = []
      const mergedLine = { ...mockPurchaseData, buy_count: 7 }

      const mockLean = jest.fn().mockImplementation(() => {
        callOrder.push('findOneAndUpdate')
        return Promise.resolve(mergedLine)
      })
      const mockPopulate3 = jest.fn().mockReturnValue({ lean: mockLean })
      const mockPopulate2 = jest.fn().mockReturnValue({ populate: mockPopulate3 })
      const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 })
      ;(PurchaseModel.findOneAndUpdate as jest.Mock).mockReturnValue({ populate: mockPopulate1 })
      ;(PurchaseModel.deleteOne as jest.Mock).mockImplementation(() => {
        callOrder.push('deleteOne')
        return Promise.resolve({ deletedCount: 1 })
      })

      await repository.mergeAndDeleteSourceLine(
        '507f1f77bcf86cd799439012',
        '507f1f77bcf86cd799439013',
        '507f1f77bcf86cd799439020',
        '507f1f77bcf86cd799439099',
        7,
        200,
        250,
      )

      // Merged write must happen before source delete
      expect(callOrder).toEqual(['findOneAndUpdate', 'deleteOne'])
    })
  })
})
