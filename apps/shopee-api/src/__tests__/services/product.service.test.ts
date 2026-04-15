/**
 * Unit Tests for ProductService
 * Tests product CRUD operations and business logic
 */

/// <reference types="jest" />
import { ProductService } from '@services/product.service'
import { NotFoundError, ValidationError } from '@services/base.service'
import { IProductRepository } from '@repositories/interfaces/product.repository.interface'
import { Types } from 'mongoose'

// Mock cache service
jest.mock('@utils/cache.service', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  },
  CacheKeys: {
    productsList: jest.fn(() => 'products_list'),
    productDetail: jest.fn((id: string) => `product_${id}`),
    productsPattern: jest.fn(() => 'products_*'),
  },
  CacheTTL: {
    PRODUCTS_LIST: 300,
    PRODUCT_DETAIL: 600,
  },
}))

// Mock fs
jest.mock('fs', () => ({
  unlink: jest.fn((path, cb) => cb(null)),
}))

// Mock helper
jest.mock('@utils/helper', () => ({
  HOST: 'http://localhost:4000',
}))

// Mock config
jest.mock('@constants/config', () => ({
  FOLDERS: { PRODUCT: 'product' },
  FOLDER_UPLOAD: 'upload',
  ROUTE_IMAGE: 'images',
}))

describe('ProductService', () => {
  let productService: ProductService
  let mockProductRepository: jest.Mocked<IProductRepository>

  const validObjectId = new Types.ObjectId().toString()
  const mockProduct = {
    _id: new Types.ObjectId(validObjectId),
    name: 'Test Product',
    price: 100,
    price_before_discount: 120,
    quantity: 10,
    sold: 5,
    view: 100,
    image: 'test.jpg',
    images: ['test1.jpg', 'test2.jpg'],
    category: new Types.ObjectId(),
    description: 'Test description',
    rating: 4.5,
  }

  beforeEach(() => {
    mockProductRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      findPaginated: jest.fn(),
      findProducts: jest.fn(),
      searchByName: jest.fn(),
      incrementView: jest.fn(),
      incrementSold: jest.fn(),
      decrementQuantity: jest.fn(),
      findLowStock: jest.fn(),
      findByCategory: jest.fn(),
      bulkUpdate: jest.fn(),
      updateMany: jest.fn(),
      exists: jest.fn(),
    } as unknown as jest.Mocked<IProductRepository>

    productService = new ProductService(mockProductRepository)
    jest.clearAllMocks()
  })

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      mockProductRepository.create.mockResolvedValue(mockProduct as any)

      const result = await productService.createProduct({
        name: 'Test Product',
        price: 100,
        quantity: 10,
        category: mockProduct.category.toString(),
        image: 'test.jpg',
        images: ['test1.jpg'],
        price_before_discount: 120,
      })

      expect(mockProductRepository.create).toHaveBeenCalled()
      expect(result.image).toContain('http://localhost:4000')
    })
  })

  describe('getProductById', () => {
    it('should return product when found', async () => {
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      mockProductRepository.incrementView.mockResolvedValue(undefined)

      const result = await productService.getProductById(validObjectId)

      expect(mockProductRepository.incrementView).toHaveBeenCalledWith(validObjectId)
      expect(mockProductRepository.findById).toHaveBeenCalledWith(validObjectId)
      expect(result.name).toBe('Test Product')
    })

    it('should throw NotFoundError when product not found', async () => {
      mockProductRepository.findById.mockResolvedValue(null)
      mockProductRepository.incrementView.mockResolvedValue(undefined)

      await expect(productService.getProductById(validObjectId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ValidationError for invalid ObjectId', async () => {
      await expect(productService.getProductById('invalid-id')).rejects.toThrow(ValidationError)
    })
  })

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      mockProductRepository.updateById.mockResolvedValue({ ...mockProduct, name: 'Updated' } as any)

      const result = await productService.updateProduct(validObjectId, { name: 'Updated' })

      expect(mockProductRepository.updateById).toHaveBeenCalledWith(validObjectId, {
        name: 'Updated',
      })
      expect(result.name).toBe('Updated')
    })

    it('should throw NotFoundError when product not found', async () => {
      mockProductRepository.updateById.mockResolvedValue(null)

      await expect(
        productService.updateProduct(validObjectId, { name: 'Updated' }),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      mockProductRepository.deleteById.mockResolvedValue(mockProduct as any)

      await productService.deleteProduct(validObjectId)

      expect(mockProductRepository.deleteById).toHaveBeenCalledWith(validObjectId)
    })

    it('should throw NotFoundError when product not found', async () => {
      mockProductRepository.deleteById.mockResolvedValue(null)

      await expect(productService.deleteProduct(validObjectId)).rejects.toThrow(NotFoundError)
    })
  })

  describe('searchProducts', () => {
    it('should search products by name', async () => {
      const mockResult = {
        data: [mockProduct],
        pagination: { page: 1, limit: 10, page_size: 1, total: 1 },
      }
      mockProductRepository.searchByName.mockResolvedValue(mockResult as any)

      const result = await productService.searchProducts('test', { page: 1, limit: 10 })

      expect(mockProductRepository.searchByName).toHaveBeenCalled()
      expect(result.data.length).toBe(1)
    })
  })

  describe('getProducts', () => {
    it('should return paginated products with image transformation', async () => {
      const mockResult = {
        data: [mockProduct],
        pagination: { page: 1, limit: 10, page_size: 1, total: 1 },
      }
      mockProductRepository.findProducts.mockResolvedValue(mockResult as any)
      const { cacheService } = require('@utils/cache.service')
      cacheService.get.mockReturnValue(null)

      const result = await productService.getProducts({}, {}, { page: 1, limit: 10 })

      expect(mockProductRepository.findProducts).toHaveBeenCalled()
      expect(result.data[0].image).toContain('http://localhost:4000')
    })

    it('should use cache on hit', async () => {
      const cachedResult = {
        data: [mockProduct],
        pagination: { page: 1, limit: 10, page_size: 1, total: 1 },
      }
      const { cacheService } = require('@utils/cache.service')
      cacheService.get.mockReturnValue(cachedResult)

      const result = await productService.getProducts({}, {}, { page: 1, limit: 10 })

      expect(mockProductRepository.findProducts).not.toHaveBeenCalled()
      expect(result).toEqual(cachedResult)
    })

    it('should skip cache when exclude filter is present', async () => {
      const mockResult = {
        data: [mockProduct],
        pagination: { page: 1, limit: 10, page_size: 1, total: 1 },
      }
      mockProductRepository.findProducts.mockResolvedValue(mockResult as any)
      const { cacheService } = require('@utils/cache.service')
      cacheService.get.mockReturnValue(null)

      await productService.getProducts({ exclude: validObjectId }, {}, { page: 1, limit: 10 })

      expect(cacheService.get).not.toHaveBeenCalled()
    })
  })

  describe('getAllProducts', () => {
    it('should return all products', async () => {
      mockProductRepository.find.mockResolvedValue([mockProduct] as any)

      const result = await productService.getAllProducts()

      expect(mockProductRepository.find).toHaveBeenCalledWith({})
      expect(result.length).toBe(1)
    })

    it('should filter by categoryId when provided', async () => {
      const categoryId = new Types.ObjectId().toString()
      mockProductRepository.find.mockResolvedValue([mockProduct] as any)

      await productService.getAllProducts(categoryId)

      expect(mockProductRepository.find).toHaveBeenCalledWith({
        category: expect.any(Types.ObjectId),
      })
    })
  })

  describe('deleteManyProducts', () => {
    it('should delete multiple products and remove images', async () => {
      const productId1 = new Types.ObjectId().toString()
      const productId2 = new Types.ObjectId().toString()
      const products = [
        { ...mockProduct, _id: new Types.ObjectId(productId1) },
        { ...mockProduct, _id: new Types.ObjectId(productId2) },
      ]
      mockProductRepository.find.mockResolvedValue(products as any)
      mockProductRepository.deleteMany.mockResolvedValue(2)

      const result = await productService.deleteManyProducts([productId1, productId2])

      expect(mockProductRepository.deleteMany).toHaveBeenCalled()
      expect(result).toBe(2)
    })

    it('should clear cache after deletion', async () => {
      mockProductRepository.find.mockResolvedValue([mockProduct] as any)
      mockProductRepository.deleteMany.mockResolvedValue(1)
      const { cacheService } = require('@utils/cache.service')

      await productService.deleteManyProducts([validObjectId])

      expect(cacheService.del).toHaveBeenCalled()
    })
  })

  describe('findLowStockProducts', () => {
    it('should return low stock products', async () => {
      mockProductRepository.findLowStock.mockResolvedValue([mockProduct] as any)

      const result = await productService.findLowStockProducts(5)

      expect(mockProductRepository.findLowStock).toHaveBeenCalledWith(5)
      expect(result.length).toBe(1)
    })
  })

  describe('handleImageProduct', () => {
    it('should transform image URLs correctly', () => {
      const product = { image: 'test.jpg', images: ['img1.jpg', 'img2.jpg'] }

      const result = productService.handleImageProduct(product)

      expect(result.image).toBe('http://localhost:4000/images/test.jpg')
      expect(result.images![0]).toBe('http://localhost:4000/images/img1.jpg')
    })

    it('should handle empty image', () => {
      const product = { image: '', images: [] }

      const result = productService.handleImageProduct(product)

      expect(result.image).toBe('')
    })

    it('should handle empty images array', () => {
      const product = { image: 'test.jpg', images: [] }

      const result = productService.handleImageProduct(product)

      expect(result.images).toEqual([])
    })
  })

  describe('updateProduct edge cases', () => {
    it('should throw ValidationError for invalid ObjectId', async () => {
      await expect(productService.updateProduct('invalid-id', { name: 'Updated' })).rejects.toThrow(
        ValidationError,
      )
    })
  })

  describe('deleteProduct edge cases', () => {
    it('should throw ValidationError for invalid ObjectId', async () => {
      await expect(productService.deleteProduct('invalid-id')).rejects.toThrow(ValidationError)
    })

    it('should remove images on delete', async () => {
      mockProductRepository.deleteById.mockResolvedValue(mockProduct as any)
      const fs = require('fs')

      await productService.deleteProduct(validObjectId)

      expect(fs.unlink).toHaveBeenCalled()
    })
  })
})
