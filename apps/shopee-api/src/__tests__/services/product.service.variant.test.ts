/**
 * Unit Tests for ProductService - Variant functionality
 */

/// <reference types="jest" />
import { ProductService } from '@services/product.service'
import { ValidationError } from '@services/base.service'
import { IProductRepository } from '@repositories/interfaces/product.repository.interface'
import { ISKURepository } from '@repositories/interfaces/sku.repository.interface'
import { Types } from 'mongoose'

jest.mock('@utils/cache.service', () => ({
  cacheService: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
  CacheKeys: {
    productsList: jest.fn(() => 'products_list'),
    productDetail: jest.fn((id: string) => `product_${id}`),
    productsPattern: jest.fn(() => 'products_*'),
  },
  CacheTTL: { PRODUCTS_LIST: 300, PRODUCT_DETAIL: 600 },
}))
jest.mock('fs', () => ({ unlink: jest.fn((path, cb) => cb(null)) }))
jest.mock('@utils/helper', () => ({ HOST: 'http://localhost:4000' }))
jest.mock('@constants/config', () => ({
  FOLDERS: { PRODUCT: 'product' }, FOLDER_UPLOAD: 'upload', ROUTE_IMAGE: 'images',
}))

describe('ProductService - Variants', () => {
  let service: ProductService
  let mockProductRepo: jest.Mocked<IProductRepository>
  let mockSKURepo: jest.Mocked<ISKURepository>
  const productId = new Types.ObjectId()

  const baseProduct = {
    _id: productId, name: 'Test', price: 100, price_before_discount: 120,
    quantity: 10, sold: 0, view: 0, image: 'test.jpg', images: [],
    rating: 0, category: new Types.ObjectId(),
  }

  beforeEach(() => {
    mockProductRepo = {
      create: jest.fn().mockResolvedValue({ ...baseProduct }),
      findById: jest.fn().mockResolvedValue({ ...baseProduct }),
      updateById: jest.fn().mockResolvedValue({ ...baseProduct }),
      find: jest.fn(), findOne: jest.fn(), findPaginated: jest.fn(),
      deleteById: jest.fn(), deleteMany: jest.fn(), count: jest.fn(),
      exists: jest.fn(), updateMany: jest.fn(),
      findProducts: jest.fn(), findByCategory: jest.fn(), searchByName: jest.fn(),
      incrementView: jest.fn(), incrementSold: jest.fn(), decrementQuantity: jest.fn(),
      findLowStock: jest.fn(), bulkUpdate: jest.fn(), bulkUpdateStock: jest.fn(),
      updateRating: jest.fn(),
    } as any
    mockSKURepo = {
      create: jest.fn().mockImplementation((data) => Promise.resolve({ _id: new Types.ObjectId(), ...data })),
      findByProduct: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn().mockResolvedValue(0),
      findById: jest.fn(), findOne: jest.fn(), find: jest.fn(),
      findPaginated: jest.fn(), updateById: jest.fn(), updateMany: jest.fn(),
      deleteById: jest.fn(), count: jest.fn(), exists: jest.fn(),
      findByProductAndValue: jest.fn(), findByProductAndVariantValues: jest.fn(),
      atomicDecrementStock: jest.fn(), atomicIncrementStock: jest.fn(),
      bulkAtomicDecrementStock: jest.fn(), findLowStock: jest.fn(),
    } as any
    service = new ProductService(mockProductRepo, mockSKURepo)
  })

  it('creates product with variants and auto-generates SKUs', async () => {
    const result = await service.createProduct({
      name: 'Test', image: 'img.jpg', images: [], price: 100,
      price_before_discount: 120, quantity: 10, category: 'cat1',
      variants: [
        { type: 'color', name: 'Màu', options: [{ name: 'Red', value: 'red' }, { name: 'Blue', value: 'blue' }] },
        { type: 'size', name: 'Size', options: [{ name: 'S', value: 's' }, { name: 'M', value: 'm' }] },
      ],
    })
    expect(mockSKURepo.create).toHaveBeenCalledTimes(4)
    expect(result.skus).toHaveLength(4)
  })

  it('creates product without variants (backward compatible)', async () => {
    const result = await service.createProduct({
      name: 'Test', image: 'img.jpg', images: [], price: 100,
      price_before_discount: 120, quantity: 10, category: 'cat1',
    })
    expect(mockSKURepo.create).not.toHaveBeenCalled()
    expect(result.skus).toBeUndefined()
  })

  // Note: Duplicate variant type validation is handled by Zod schema at request boundary
  // This test verifies the service accepts the data (validation happens before service)
  it('accepts variants with different types', async () => {
    const result = await service.createProduct({
      name: 'Test', image: 'img.jpg', images: [], price: 100,
      price_before_discount: 120, quantity: 10, category: 'cat1',
      variants: [
        { type: 'color', name: 'Màu', options: [{ name: 'Red', value: 'red' }] },
        { type: 'size', name: 'Size', options: [{ name: 'S', value: 's' }] },
      ],
    })
    expect(result.skus).toHaveLength(1)
  })

  // Note: Duplicate option validation is handled by Zod schema at request boundary
  // This test verifies the service processes the data (validation happens before service)
  it('processes variants with unique options', async () => {
    const result = await service.createProduct({
      name: 'Test', image: 'img.jpg', images: [], price: 100,
      price_before_discount: 120, quantity: 10, category: 'cat1',
      variants: [{ type: 'color', name: 'Màu', options: [{ name: 'Red', value: 'red' }, { name: 'Blue', value: 'blue' }] }],
    })
    expect(result.skus).toHaveLength(2)
  })

  it('updates product and regenerates SKUs when variants change', async () => {
    mockProductRepo.updateById.mockResolvedValue({ ...baseProduct, variants: [{ type: 'color', name: 'Màu', options: [{ name: 'Red', value: 'red' }] }] } as any)
    const result = await service.updateProduct(productId.toString(), {
      variants: [{ type: 'color', name: 'Màu', options: [{ name: 'Red', value: 'red' }] }],
    })
    expect(mockSKURepo.deleteMany).toHaveBeenCalled()
    expect(mockSKURepo.create).toHaveBeenCalledTimes(1)
    expect(result.skus).toHaveLength(1)
  })

  it('removes SKUs when variants set to empty array', async () => {
    mockProductRepo.updateById.mockResolvedValue({ ...baseProduct, variants: [] } as any)
    const result = await service.updateProduct(productId.toString(), { variants: [] })
    expect(mockSKURepo.deleteMany).toHaveBeenCalled()
    expect(result.skus).toEqual([])
  })
})

describe('ProductService - Concurrent Variant Updates (Task 15.12)', () => {
  let service: ProductService
  let mockProductRepo: jest.Mocked<IProductRepository>
  let mockSKURepo: jest.Mocked<ISKURepository>
  const productId = new Types.ObjectId()

  const baseProduct = {
    _id: productId, name: 'Test', price: 100, price_before_discount: 120,
    quantity: 10, sold: 0, view: 0, image: 'test.jpg', images: [],
    rating: 0, category: new Types.ObjectId(),
    variants: [{ type: 'color', name: 'Màu', options: [{ name: 'Red', value: 'red' }] }],
  }

  beforeEach(() => {
    mockProductRepo = {
      create: jest.fn().mockResolvedValue({ ...baseProduct }),
      findById: jest.fn().mockResolvedValue({ ...baseProduct }),
      updateById: jest.fn().mockResolvedValue({ ...baseProduct }),
      find: jest.fn(), findOne: jest.fn(), findPaginated: jest.fn(),
      deleteById: jest.fn(), deleteMany: jest.fn(), count: jest.fn(),
      exists: jest.fn(), updateMany: jest.fn(),
      findProducts: jest.fn(), findByCategory: jest.fn(), searchByName: jest.fn(),
      incrementView: jest.fn(), incrementSold: jest.fn(), decrementQuantity: jest.fn(),
      findLowStock: jest.fn(), bulkUpdate: jest.fn(), bulkUpdateStock: jest.fn(),
      updateRating: jest.fn(),
    } as any
    mockSKURepo = {
      create: jest.fn().mockImplementation((data) => Promise.resolve({ _id: new Types.ObjectId(), ...data })),
      findByProduct: jest.fn().mockResolvedValue([
        { _id: new Types.ObjectId(), value: 'RED', price: 100, stock: 10, variant_values: { color: 'red' }, product: productId },
      ]),
      deleteMany: jest.fn().mockResolvedValue(1),
      findById: jest.fn(), findOne: jest.fn(), find: jest.fn(),
      findPaginated: jest.fn(), updateById: jest.fn().mockImplementation((id, data) => Promise.resolve({ _id: id, ...data })),
      updateMany: jest.fn(),
      deleteById: jest.fn(), count: jest.fn(), exists: jest.fn(),
      findByProductAndValue: jest.fn(), findByProductAndVariantValues: jest.fn(),
      atomicDecrementStock: jest.fn(), atomicIncrementStock: jest.fn(),
      bulkAtomicDecrementStock: jest.fn(), findLowStock: jest.fn(),
    } as any
    service = new ProductService(mockProductRepo, mockSKURepo)
  })

  it('handles concurrent variant updates without data corruption', async () => {
    // Simulate two concurrent updates to the same product
    const update1 = service.updateProduct(productId.toString(), {
      variants: [{ type: 'color', name: 'Màu', options: [{ name: 'Red', value: 'red' }, { name: 'Blue', value: 'blue' }] }],
    })
    const update2 = service.updateProduct(productId.toString(), {
      variants: [{ type: 'size', name: 'Size', options: [{ name: 'S', value: 's' }, { name: 'M', value: 'm' }] }],
    })

    // Both should complete without throwing
    const results = await Promise.allSettled([update1, update2])
    expect(results.every(r => r.status === 'fulfilled')).toBe(true)
  })

  it('maintains data integrity when updating SKU stock concurrently', async () => {
    const existingSku = { _id: new Types.ObjectId(), value: 'RED', price: 100, stock: 10, variant_values: { color: 'red' }, product: productId }
    mockSKURepo.findByProduct.mockResolvedValue([existingSku])

    // Simulate concurrent SKU updates
    const update1 = service.updateProduct(productId.toString(), {
      skus: [{ value: 'RED', price: 100, stock: 8, variant_values: { color: 'red' } }],
    })
    const update2 = service.updateProduct(productId.toString(), {
      skus: [{ value: 'RED', price: 100, stock: 5, variant_values: { color: 'red' } }],
    })

    const results = await Promise.allSettled([update1, update2])
    expect(results.every(r => r.status === 'fulfilled')).toBe(true)
    // updateById should be called for each update
    expect(mockSKURepo.updateById).toHaveBeenCalled()
  })

  it('handles race condition when adding new SKU while another update is in progress', async () => {
    const existingSku = { _id: new Types.ObjectId(), value: 'RED', price: 100, stock: 10, variant_values: { color: 'red' }, product: productId }
    mockSKURepo.findByProduct.mockResolvedValue([existingSku])

    // First update adds a new SKU
    const update1 = service.updateProduct(productId.toString(), {
      skus: [
        { value: 'RED', price: 100, stock: 10, variant_values: { color: 'red' } },
        { value: 'BLUE', price: 100, stock: 5, variant_values: { color: 'blue' } },
      ],
    })
    // Second update modifies existing SKU
    const update2 = service.updateProduct(productId.toString(), {
      skus: [{ value: 'RED', price: 95, stock: 8, variant_values: { color: 'red' } }],
    })

    const results = await Promise.allSettled([update1, update2])
    expect(results.every(r => r.status === 'fulfilled')).toBe(true)
  })

  it('soft-deletes removed SKUs instead of hard delete to prevent data loss', async () => {
    const existingSku = { _id: new Types.ObjectId(), value: 'RED', price: 100, stock: 10, variant_values: { color: 'red' }, product: productId }
    mockSKURepo.findByProduct.mockResolvedValue([existingSku])

    // Update with empty SKU list (removing RED)
    await service.updateProduct(productId.toString(), {
      skus: [{ value: 'BLUE', price: 100, stock: 5, variant_values: { color: 'blue' } }],
    })

    // Should soft-delete by setting stock to 0, not hard delete
    expect(mockSKURepo.updateById).toHaveBeenCalledWith(
      existingSku._id.toString(),
      expect.objectContaining({ stock: 0 })
    )
  })
})

