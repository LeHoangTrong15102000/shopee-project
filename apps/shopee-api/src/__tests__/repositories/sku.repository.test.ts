/// <reference types="jest" />
import { Types } from 'mongoose'
import { SKURepository } from '@repositories/sku.repository'
import { IProductRepository } from '@repositories/interfaces/product.repository.interface'
import { BusinessError } from '@services/base.service'

const mockSKUData = {
  _id: new Types.ObjectId(),
  value: 'Red-M',
  price: 100000,
  stock: 10,
  product: new Types.ObjectId(),
  variant_values: { color: 'Red', size: 'M' },
}

// Mock SKUModel
jest.mock('@database/models/sku.model', () => {
  const mockModel: any = jest.fn()
  mockModel.findOneAndUpdate = jest.fn()
  mockModel.findByIdAndUpdate = jest.fn()
  mockModel.findById = jest.fn()
  mockModel.find = jest.fn()
  mockModel.findOne = jest.fn()
  mockModel.countDocuments = jest.fn()
  mockModel.deleteMany = jest.fn()
  mockModel.updateMany = jest.fn()
  mockModel.exists = jest.fn()
  mockModel.findByIdAndDelete = jest.fn()
  return { SKUModel: mockModel }
})

const { SKUModel } = require('@database/models/sku.model')

describe('SKURepository - Stock Sync', () => {
  let repository: SKURepository
  let mockProductRepo: jest.Mocked<IProductRepository>

  beforeEach(() => {
    jest.clearAllMocks()
    mockProductRepo = {
      decrementQuantity: jest.fn().mockResolvedValue(undefined),
      incrementQuantity: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
    } as unknown as jest.Mocked<IProductRepository>
    repository = new SKURepository(mockProductRepo)
  })

  describe('atomicDecrementStock', () => {
    it('decrements SKU stock and syncs Product.quantity', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockSKUData)
      SKUModel.findOneAndUpdate.mockReturnValue({ lean: mockLean })

      const result = await repository.atomicDecrementStock(mockSKUData._id, 2)

      expect(result).toEqual(mockSKUData)
      expect(SKUModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockSKUData._id, stock: { $gte: 2 } },
        { $inc: { stock: -2 } },
        { new: true }
      )
      expect(mockProductRepo.decrementQuantity).toHaveBeenCalledWith(mockSKUData.product, 2)
    })

    it('returns null when insufficient stock (no Product update)', async () => {
      const mockLean = jest.fn().mockResolvedValue(null)
      SKUModel.findOneAndUpdate.mockReturnValue({ lean: mockLean })

      const result = await repository.atomicDecrementStock(mockSKUData._id, 20)

      expect(result).toBeNull()
      expect(mockProductRepo.decrementQuantity).not.toHaveBeenCalled()
    })

    it('rolls back SKU stock and throws when Product sync fails', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockSKUData)
      SKUModel.findOneAndUpdate.mockReturnValue({ lean: mockLean })
      mockProductRepo.decrementQuantity.mockRejectedValue(new Error('DB error'))
      SKUModel.findByIdAndUpdate.mockResolvedValue(mockSKUData)

      await expect(repository.atomicDecrementStock(mockSKUData._id, 2)).rejects.toThrow(BusinessError)
      expect(SKUModel.findByIdAndUpdate).toHaveBeenCalledWith(mockSKUData._id, { $inc: { stock: 2 } })
    })
  })

  describe('atomicIncrementStock', () => {
    it('increments SKU stock and syncs Product.quantity', async () => {
      const mockLean = jest.fn().mockResolvedValue({ ...mockSKUData, stock: 12 })
      SKUModel.findByIdAndUpdate.mockReturnValue({ lean: mockLean })

      const result = await repository.atomicIncrementStock(mockSKUData._id, 2)

      expect(result).toBeDefined()
      expect(result!.stock).toBe(12)
      expect(SKUModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockSKUData._id,
        { $inc: { stock: 2 } },
        { new: true }
      )
      expect(mockProductRepo.incrementQuantity).toHaveBeenCalledWith(mockSKUData.product, 2)
    })

    it('rolls back SKU stock and throws when Product sync fails', async () => {
      const mockLean = jest.fn().mockResolvedValue({ ...mockSKUData, stock: 12 })
      SKUModel.findByIdAndUpdate
        .mockReturnValueOnce({ lean: mockLean }) // increment
        .mockResolvedValueOnce(mockSKUData) // rollback
      mockProductRepo.incrementQuantity.mockRejectedValue(new Error('DB error'))

      await expect(repository.atomicIncrementStock(mockSKUData._id, 2)).rejects.toThrow(BusinessError)
      // Second call is the rollback
      expect(SKUModel.findByIdAndUpdate).toHaveBeenCalledTimes(2)
    })
  })

  describe('bulkAtomicDecrementStock', () => {
    it('decrements single SKU and syncs Product.quantity', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockSKUData)
      SKUModel.findOneAndUpdate.mockReturnValue({ lean: mockLean })

      const items = [{ skuId: mockSKUData._id, quantity: 3 }]
      const results = await repository.bulkAtomicDecrementStock(items)

      expect(results).toHaveLength(1)
      expect(results[0].success).toBe(true)
      expect(mockProductRepo.decrementQuantity).toHaveBeenCalledWith(mockSKUData.product, 3)
    })

    it('decrements multiple SKUs and syncs Product.quantity for each', async () => {
      const sku1 = { ...mockSKUData, _id: new Types.ObjectId() }
      const sku2 = { ...mockSKUData, _id: new Types.ObjectId(), product: new Types.ObjectId() }

      const mockLean1 = jest.fn().mockResolvedValue(sku1)
      const mockLean2 = jest.fn().mockResolvedValue(sku2)
      SKUModel.findOneAndUpdate
        .mockReturnValueOnce({ lean: mockLean1 })
        .mockReturnValueOnce({ lean: mockLean2 })

      const items = [
        { skuId: sku1._id, quantity: 1 },
        { skuId: sku2._id, quantity: 2 },
      ]
      const results = await repository.bulkAtomicDecrementStock(items)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
      expect(mockProductRepo.decrementQuantity).toHaveBeenCalledTimes(2)
    })

    it('rolls back all successful decrements when one fails (including Product.quantity)', async () => {
      const sku1 = { ...mockSKUData, _id: new Types.ObjectId() }
      const mockLean1 = jest.fn().mockResolvedValue(sku1)
      const mockLeanNull = jest.fn().mockResolvedValue(null)
      const mockLeanInc = jest.fn().mockResolvedValue({ ...sku1, stock: 11 })

      SKUModel.findOneAndUpdate
        .mockReturnValueOnce({ lean: mockLean1 }) // sku1 decrement succeeds
        .mockReturnValueOnce({ lean: mockLeanNull }) // sku2 decrement fails
      SKUModel.findByIdAndUpdate.mockReturnValue({ lean: mockLeanInc }) // rollback increment

      const sku2Id = new Types.ObjectId()
      const items = [
        { skuId: sku1._id, quantity: 1 },
        { skuId: sku2Id, quantity: 5 },
      ]

      await expect(repository.bulkAtomicDecrementStock(items)).rejects.toThrow(BusinessError)
      // Rollback should increment sku1 back (which also syncs Product.quantity)
      expect(mockProductRepo.incrementQuantity).toHaveBeenCalledWith(sku1.product, 1)
    })
  })
})

