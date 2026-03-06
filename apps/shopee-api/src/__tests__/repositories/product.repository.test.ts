/// <reference types="jest" />

const mockProductData = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test Product',
  price: 100,
  category: '507f1f77bcf86cd799439012',
  quantity: 50,
  sold: 10,
  rating: 4.5,
  view: 100,
  toObject: () => mockProductData,
}

jest.mock('@utils/view-counter.service', () => ({
  viewCounterService: { incrementView: jest.fn() },
}))

jest.mock('@database/models/product.model', () => {
  const mockModel: any = jest.fn()
  mockModel.findById = jest.fn()
  mockModel.findOne = jest.fn()
  mockModel.find = jest.fn()
  mockModel.findByIdAndUpdate = jest.fn()
  mockModel.findByIdAndDelete = jest.fn()
  mockModel.countDocuments = jest.fn()
  mockModel.deleteMany = jest.fn()
  mockModel.updateMany = jest.fn()
  mockModel.exists = jest.fn()
  mockModel.bulkWrite = jest.fn()
  return { ProductModel: mockModel }
})

import { ProductModel } from '@database/models/product.model'
import { ProductRepository } from '../../repositories/product.repository'
import { viewCounterService } from '@utils/view-counter.service'

describe('ProductRepository', () => {
  let repository: ProductRepository

  beforeEach(() => {
    jest.clearAllMocks()
    // Setup constructor mock for create operations
    ;(ProductModel as unknown as jest.Mock).mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({ toObject: () => mockProductData }),
    }))
    repository = new ProductRepository()
  })

  describe('findById', () => {
    it('should find product by id with category populated', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockProductData)
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(ProductModel.findById as jest.Mock).mockReturnValue({ populate: mockPopulate })

      const result = await repository.findById('507f1f77bcf86cd799439011')

      expect(ProductModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
      expect(mockPopulate).toHaveBeenCalledWith('category')
      expect(result).toEqual(mockProductData)
    })
  })

  describe('findOne', () => {
    it('should find one product with filter', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockProductData)
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(ProductModel.findOne as jest.Mock).mockReturnValue({ populate: mockPopulate })

      const filter = { name: 'Test Product' }
      const result = await repository.findOne(filter)

      expect(ProductModel.findOne).toHaveBeenCalledWith(filter)
      expect(result).toEqual(mockProductData)
    })
  })

  describe('find', () => {
    it('should find products with filter and options', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockProductData])
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(ProductModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate })

      const filter = { category: '507f1f77bcf86cd799439012' }
      const result = await repository.find(filter)

      expect(ProductModel.find).toHaveBeenCalledWith(filter, null, undefined)
      expect(result).toEqual([mockProductData])
    })
  })

  describe('findPaginated', () => {
    it('should return paginated results', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockProductData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort })
      ;(ProductModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate })
      ;(ProductModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.findPaginated({}, { page: 1, limit: 10 })

      expect(result).toEqual({
        data: [mockProductData],
        pagination: { page: 1, limit: 10, page_size: 1, total: 1 },
      })
    })
  })

  describe('create', () => {
    it('should create a new product', async () => {
      const result = await repository.create({ name: 'New Product', price: 100 } as any)
      expect(result).toEqual(mockProductData)
    })
  })

  describe('updateById', () => {
    it('should update product by id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockProductData)
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(ProductModel.findByIdAndUpdate as jest.Mock).mockReturnValue({ populate: mockPopulate })

      const result = await repository.updateById('507f1f77bcf86cd799439011', { price: 150 })

      expect(ProductModel.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', { price: 150 }, { new: true })
      expect(result).toEqual(mockProductData)
    })
  })

  describe('deleteById', () => {
    it('should delete product by id', async () => {
      const mockLean = jest.fn().mockResolvedValue(mockProductData)
      ;(ProductModel.findByIdAndDelete as jest.Mock).mockReturnValue({ lean: mockLean })

      const result = await repository.deleteById('507f1f77bcf86cd799439011')

      expect(ProductModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
      expect(result).toEqual(mockProductData)
    })
  })

  describe('count', () => {
    it('should count documents', async () => {
      ;(ProductModel.countDocuments as jest.Mock).mockResolvedValue(5)
      const result = await repository.count({ category: '507f1f77bcf86cd799439012' })
      expect(result).toBe(5)
    })
  })

  describe('exists', () => {
    it('should return true if document exists', async () => {
      ;(ProductModel.exists as jest.Mock).mockResolvedValue({ _id: '507f1f77bcf86cd799439011' })
      const result = await repository.exists({ name: 'Test Product' })
      expect(result).toBe(true)
    })

    it('should return false if document does not exist', async () => {
      ;(ProductModel.exists as jest.Mock).mockResolvedValue(null)
      const result = await repository.exists({ name: 'Nonexistent' })
      expect(result).toBe(false)
    })
  })

  describe('findProducts', () => {
    it('should find products with filters and sorting', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockProductData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort })
      ;(ProductModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate })
      ;(ProductModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.findProducts(
        { category: '507f1f77bcf86cd799439012', price_min: 50, price_max: 200 },
        { sort_by: 'price', order: 'asc' },
        { page: 1, limit: 10 }
      )

      expect(result.data).toEqual([mockProductData])
    })
  })

  describe('findByCategory', () => {
    it('should find products by category', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockProductData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort })
      ;(ProductModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate })
      ;(ProductModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.findByCategory('507f1f77bcf86cd799439012', { page: 1, limit: 10 })

      expect(result.data).toEqual([mockProductData])
    })
  })

  describe('searchByName', () => {
    it('should search products by name', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockProductData])
      const mockLimit = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit })
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip })
      const mockPopulate = jest.fn().mockReturnValue({ sort: mockSort })
      ;(ProductModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate })
      ;(ProductModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await repository.searchByName('Test', { page: 1, limit: 10 })

      expect(result.data).toEqual([mockProductData])
    })
  })

  describe('incrementView', () => {
    it('should call viewCounterService.incrementView', async () => {
      await repository.incrementView('507f1f77bcf86cd799439011')
      expect(viewCounterService.incrementView).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
    })
  })

  describe('incrementSold', () => {
    it('should increment sold count', async () => {
      ;(ProductModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockProductData)
      await repository.incrementSold('507f1f77bcf86cd799439011', 5)
      expect(ProductModel.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', { $inc: { sold: 5 } })
    })
  })

  describe('decrementQuantity', () => {
    it('should decrement quantity', async () => {
      ;(ProductModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockProductData)
      await repository.decrementQuantity('507f1f77bcf86cd799439011', 3)
      expect(ProductModel.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', { $inc: { quantity: -3 } })
    })
  })

  describe('findLowStock', () => {
    it('should find products with low stock', async () => {
      const mockLean = jest.fn().mockResolvedValue([mockProductData])
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(ProductModel.find as jest.Mock).mockReturnValue({ populate: mockPopulate })

      const result = await repository.findLowStock(10)

      expect(ProductModel.find).toHaveBeenCalledWith({ quantity: { $lte: 10 } })
      expect(result).toEqual([mockProductData])
    })
  })

  describe('bulkUpdate', () => {
    it('should bulk update products', async () => {
      ;(ProductModel.bulkWrite as jest.Mock).mockResolvedValue({ modifiedCount: 2 })

      const updates = [
        { id: '507f1f77bcf86cd799439011', data: { price: 100 } },
        { id: '507f1f77bcf86cd799439012', data: { price: 200 } },
      ]
      const result = await repository.bulkUpdate(updates)

      expect(ProductModel.bulkWrite).toHaveBeenCalled()
      expect(result).toBe(2)
    })
  })

  describe('bulkUpdateStock', () => {
    it('should bulk update stock', async () => {
      ;(ProductModel.bulkWrite as jest.Mock).mockResolvedValue({ modifiedCount: 2 })

      const updates = [
        { product_id: '507f1f77bcf86cd799439011', quantity_change: -5, sold_change: 5 },
      ]
      const result = await repository.bulkUpdateStock(updates)

      expect(ProductModel.bulkWrite).toHaveBeenCalled()
      expect(result).toBe(2)
    })
  })

  describe('updateRating', () => {
    it('should update product rating', async () => {
      ;(ProductModel.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockProductData)
      await repository.updateRating('507f1f77bcf86cd799439011', 4.8)
      expect(ProductModel.findByIdAndUpdate).toHaveBeenCalledWith('507f1f77bcf86cd799439011', { rating: 4.8 })
    })
  })
})

