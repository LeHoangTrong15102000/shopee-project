/**
 * Unit Tests cho Product Controller
 * Test các chức năng lấy danh sách sản phẩm và chi tiết sản phẩm
 * Updated to work with new service-based architecture
 */

/// <reference types="jest" />
import { Request, Response } from 'express'
import ProductController from '@controllers/product.controller'
import { STATUS } from '@constants/status'
import { NotFoundError } from '@services/base.service'

// Mock the container's productService
jest.mock('../../container', () => ({
  productService: {
    createProduct: jest.fn(),
    getProductById: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
    searchProducts: jest.fn(),
    getProducts: jest.fn(),
  },
}))

import { productService } from '../../container'

const mockProductService = productService as jest.Mocked<typeof productService>

// Interface cho mock request options
interface MockRequestOptions {
  body?: Record<string, unknown>
  params?: Record<string, string>
  query?: Record<string, string>
  headers?: Record<string, string>
  jwtDecoded?: {
    id: string
    email: string
    roles: string[]
    created_at: string
  }
}

// Helper functions để tạo mock request/response
const createMockRequest = (options: MockRequestOptions = {}): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
  headers: options.headers || {},
  jwtDecoded: options.jwtDecoded,
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

// Mock data cho products
const mockProducts = [
  {
    _id: 'product_1',
    name: 'Sản phẩm 1',
    price: 100000,
    category: { _id: 'cat_1', name: 'Điện thoại' },
    image: 'image1.jpg',
    images: ['image1.jpg', 'image2.jpg'],
    view: 100,
    sold: 50,
    rating: 4.5,
  },
  {
    _id: 'product_2',
    name: 'Sản phẩm 2',
    price: 200000,
    category: { _id: 'cat_1', name: 'Điện thoại' },
    image: 'image2.jpg',
    images: ['image3.jpg'],
    view: 200,
    sold: 100,
    rating: 4.8,
  },
]

describe('Product Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getProduct', () => {
    it('should return product by id', async () => {
      const productId = 'product_1'
      const mockProduct = { ...mockProducts[0], view: 101 }

      mockProductService.getProductById.mockResolvedValue(mockProduct as any)

      const req = createMockRequest({
        params: { product_id: productId },
      })
      const res = createMockResponse()

      await ProductController.getProduct(req as any, res as Response)

      expect(mockProductService.getProductById).toHaveBeenCalledWith(productId)
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
      expect(res.send).toHaveBeenCalled()
    })

    it('should return 404 if not found', async () => {
      mockProductService.getProductById.mockRejectedValue(new NotFoundError('Product not found'))

      const req = createMockRequest({
        params: { product_id: 'nonexistent_id' },
      })
      const res = createMockResponse()

      await expect(
        ProductController.getProduct(req as any, res as Response)
      ).rejects.toMatchObject({
        status: STATUS.NOT_FOUND,
      })
    })
  })

  describe('getProducts', () => {
    it('should return products with default pagination', async () => {
      const mockResult = {
        data: mockProducts,
        pagination: { page: 1, limit: 30, page_size: 1, total: 2 },
      }
      mockProductService.getProducts.mockResolvedValue(mockResult as any)

      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await ProductController.getProducts(req as any, res as Response)

      expect(mockProductService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ category: undefined }),
        expect.objectContaining({ sort_by: 'createdAt', order: 'desc' }),
        expect.objectContaining({ page: 1, limit: 30 })
      )
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should pass query params correctly', async () => {
      const mockResult = {
        data: [mockProducts[0]],
        pagination: { page: 2, limit: 10, page_size: 1, total: 1 },
      }
      mockProductService.getProducts.mockResolvedValue(mockResult as any)

      const req = createMockRequest({
        query: {
          page: '2',
          limit: '10',
          category: 'cat_1',
          sort_by: 'price',
          order: 'asc',
        },
      })
      const res = createMockResponse()

      await ProductController.getProducts(req as any, res as Response)

      expect(mockProductService.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'cat_1' }),
        expect.objectContaining({ sort_by: 'price', order: 'asc' }),
        expect.objectContaining({ page: 2, limit: 10 })
      )
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should use default sort when invalid sort_by provided', async () => {
      const mockResult = {
        data: [],
        pagination: { page: 1, limit: 30, page_size: 1, total: 0 },
      }
      mockProductService.getProducts.mockResolvedValue(mockResult as any)

      const req = createMockRequest({
        query: { sort_by: 'invalid_sort', order: 'invalid_order' },
      })
      const res = createMockResponse()

      await ProductController.getProducts(req as any, res as Response)

      expect(mockProductService.getProducts).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ sort_by: 'createdAt', order: 'desc' }),
        expect.any(Object)
      )
    })
  })
})

