/// <reference types="jest" />
import { Request, Response } from 'express'

jest.mock('../../container', () => ({
  container: {
    services: {
      wishlist: {
        getWishlist: jest.fn(),
        addToWishlist: jest.fn(),
        removeFromWishlist: jest.fn(),
        isInWishlist: jest.fn(),
        clearWishlist: jest.fn(),
        getWishlistCount: jest.fn(),
      },
    },
  },
}))

import { container } from '../../container'
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkInWishlist,
  clearWishlist,
  getWishlistCount,
} from '../../controllers/wishlist.controller'

const mockWishlistService = container.services.wishlist as jest.Mocked<typeof container.services.wishlist>

const createMockRequest = (options: any = {}): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
  headers: options.headers || {},
  jwtDecoded: options.jwtDecoded || { id: 'user123', email: 'test@test.com', roles: ['User'], created_at: '2024-01-01' },
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

describe('Wishlist Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getWishlist', () => {
    const mockWishlistResult = {
      data: [{ _id: 'item1', product: 'prod1', user: 'user123', addedAt: new Date() }],
      pagination: { page: 1, limit: 10, total: 1, page_size: 1 },
    }

    it('should return wishlist with default pagination', async () => {
      mockWishlistService.getWishlist.mockResolvedValue(mockWishlistResult as any)
      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await getWishlist(req as any, res as Response)

      expect(mockWishlistService.getWishlist).toHaveBeenCalledWith('user123', { page: 1, limit: 10 })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy danh sách yêu thích thành công',
        data: {
          wishlist: mockWishlistResult.data,
          pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
        },
      })
    })

    it('should handle custom pagination', async () => {
      mockWishlistService.getWishlist.mockResolvedValue(mockWishlistResult as any)
      const req = createMockRequest({ query: { page: '2', limit: '20' } })
      const res = createMockResponse()

      await getWishlist(req as any, res as Response)

      expect(mockWishlistService.getWishlist).toHaveBeenCalledWith('user123', { page: 2, limit: 20 })
    })

    it('should propagate service errors', async () => {
      mockWishlistService.getWishlist.mockRejectedValue(new Error('Service error'))
      const req = createMockRequest()
      const res = createMockResponse()

      await expect(getWishlist(req as any, res as Response)).rejects.toThrow('Service error')
    })
  })

  describe('addToWishlist', () => {
    it('should add product to wishlist successfully', async () => {
      const mockItem = { _id: 'item1', product: 'prod1', user: 'user123', addedAt: new Date() }
      mockWishlistService.addToWishlist.mockResolvedValue(mockItem as any)
      const req = createMockRequest({ body: { product_id: 'prod1' } })
      const res = createMockResponse()

      await addToWishlist(req as any, res as Response)

      expect(mockWishlistService.addToWishlist).toHaveBeenCalledWith('user123', 'prod1')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Thêm sản phẩm vào danh sách yêu thích thành công',
        data: mockItem,
      })
    })

    it('should propagate service errors', async () => {
      mockWishlistService.addToWishlist.mockRejectedValue(new Error('Add error'))
      const req = createMockRequest({ body: { product_id: 'prod1' } })
      const res = createMockResponse()

      await expect(addToWishlist(req as any, res as Response)).rejects.toThrow('Add error')
    })
  })

  describe('removeFromWishlist', () => {
    it('should remove product from wishlist successfully', async () => {
      mockWishlistService.removeFromWishlist.mockResolvedValue(undefined)
      const req = createMockRequest({ params: { product_id: 'prod1' } })
      const res = createMockResponse()

      await removeFromWishlist(req as any, res as Response)

      expect(mockWishlistService.removeFromWishlist).toHaveBeenCalledWith('user123', 'prod1')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Xóa sản phẩm khỏi danh sách yêu thích thành công',
      })
    })

    it('should propagate service errors', async () => {
      mockWishlistService.removeFromWishlist.mockRejectedValue(new Error('Remove error'))
      const req = createMockRequest({ params: { product_id: 'prod1' } })
      const res = createMockResponse()

      await expect(removeFromWishlist(req as any, res as Response)).rejects.toThrow('Remove error')
    })
  })

  describe('checkInWishlist', () => {
    it('should return true when product is in wishlist', async () => {
      mockWishlistService.isInWishlist.mockResolvedValue(true)
      const req = createMockRequest({ params: { product_id: 'prod1' } })
      const res = createMockResponse()

      await checkInWishlist(req as any, res as Response)

      expect(mockWishlistService.isInWishlist).toHaveBeenCalledWith('user123', 'prod1')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Kiểm tra sản phẩm trong danh sách yêu thích thành công',
        data: { in_wishlist: true },
      })
    })

    it('should return false when product is not in wishlist', async () => {
      mockWishlistService.isInWishlist.mockResolvedValue(false)
      const req = createMockRequest({ params: { product_id: 'prod2' } })
      const res = createMockResponse()

      await checkInWishlist(req as any, res as Response)

      expect(mockWishlistService.isInWishlist).toHaveBeenCalledWith('user123', 'prod2')
      expect(res.json).toHaveBeenCalledWith({
        message: 'Kiểm tra sản phẩm trong danh sách yêu thích thành công',
        data: { in_wishlist: false },
      })
    })

    it('should propagate service errors', async () => {
      mockWishlistService.isInWishlist.mockRejectedValue(new Error('Check error'))
      const req = createMockRequest({ params: { product_id: 'prod1' } })
      const res = createMockResponse()

      await expect(checkInWishlist(req as any, res as Response)).rejects.toThrow('Check error')
    })
  })

  describe('clearWishlist', () => {
    it('should clear wishlist successfully', async () => {
      mockWishlistService.clearWishlist.mockResolvedValue(5)
      const req = createMockRequest()
      const res = createMockResponse()

      await clearWishlist(req as any, res as Response)

      expect(mockWishlistService.clearWishlist).toHaveBeenCalledWith('user123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Xóa toàn bộ danh sách yêu thích thành công',
        data: { deleted_count: 5 },
      })
    })

    it('should propagate service errors', async () => {
      mockWishlistService.clearWishlist.mockRejectedValue(new Error('Clear error'))
      const req = createMockRequest()
      const res = createMockResponse()

      await expect(clearWishlist(req as any, res as Response)).rejects.toThrow('Clear error')
    })
  })

  describe('getWishlistCount', () => {
    it('should return wishlist count successfully', async () => {
      mockWishlistService.getWishlistCount.mockResolvedValue(10)
      const req = createMockRequest()
      const res = createMockResponse()

      await getWishlistCount(req as any, res as Response)

      expect(mockWishlistService.getWishlistCount).toHaveBeenCalledWith('user123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy số lượng sản phẩm yêu thích thành công',
        data: { count: 10 },
      })
    })

    it('should propagate service errors', async () => {
      mockWishlistService.getWishlistCount.mockRejectedValue(new Error('Count error'))
      const req = createMockRequest()
      const res = createMockResponse()

      await expect(getWishlistCount(req as any, res as Response)).rejects.toThrow('Count error')
    })
  })
})

