/**
 * Unit Tests cho Purchase Controller
 * Test các chức năng giỏ hàng
 */

/// <reference types="jest" />
import { Request, Response } from 'express'
import { STATUS } from '@constants/status'
import { NotFoundError, ValidationError } from '@services/base.service'

// Mock socket emitters
jest.mock('../../socket/utils/cart-emit', () => ({
  emitCartUpdate: jest.fn(),
}))
jest.mock('../../socket/utils/activity-emit', () => ({
  emitActivityEvent: jest.fn(),
}))
jest.mock('../../socket/utils/seller-emit', () => ({
  emitSellerOrderNotification: jest.fn(),
  emitSellerMetricsUpdate: jest.fn(),
}))
jest.mock('../../socket/utils/seller-metrics.service', () => ({
  emitCurrentSellerMetrics: jest.fn(),
}))

jest.mock('../../container', () => ({
  purchaseService: {
    addToCart: jest.fn(),
    updateCartItem: jest.fn(),
    getPurchases: jest.fn(),
    removeFromCart: jest.fn(),
  },
}))

// Mock handleImageProduct from product controller
jest.mock('@controllers/product.controller', () => ({
  handleImageProduct: jest.fn((product: any) => product),
  __esModule: true,
  default: {},
}))

import { purchaseService } from '../../container'
import { addToCart, updatePurchase, getPurchases, deletePurchases } from '@controllers/purchase.controller'

const mockPurchaseService = purchaseService as jest.Mocked<typeof purchaseService>

const createMockRequest = (options: { body?: any; params?: any; query?: any; jwtDecoded?: any } = {}): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
  jwtDecoded: options.jwtDecoded || { id: 'user_1', email: 'test@example.com', roles: ['User'], created_at: new Date().toISOString() },
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const mockPurchase = {
  _id: 'purchase_1',
  user: 'user_1',
  product: { _id: 'product_1', name: 'Test Product', price: 100000 },
  buy_count: 2,
  price: 100000,
  status: -1,
}

describe('Purchase Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('addToCart', () => {
    it('should add product to cart successfully', async () => {
      mockPurchaseService.addToCart.mockResolvedValue(mockPurchase as any)
      const req = createMockRequest({
        body: { product_id: 'product_1', buy_count: 2 },
      })
      const res = createMockResponse()

      await addToCart(req as Request, res as Response)

      expect(mockPurchaseService.addToCart).toHaveBeenCalledWith('user_1', { product_id: 'product_1', buy_count: 2 })
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw error when product not found', async () => {
      mockPurchaseService.addToCart.mockRejectedValue(new NotFoundError('Product', 'product_999'))
      const req = createMockRequest({
        body: { product_id: 'product_999', buy_count: 1 },
      })
      const res = createMockResponse()

      await expect(
        addToCart(req as Request, res as Response)
      ).rejects.toMatchObject({ status: STATUS.NOT_FOUND })
    })

    it('should throw error when quantity exceeded', async () => {
      mockPurchaseService.addToCart.mockRejectedValue(new ValidationError('Số lượng mua vượt quá'))
      const req = createMockRequest({
        body: { product_id: 'product_1', buy_count: 9999 },
      })
      const res = createMockResponse()

      await expect(
        addToCart(req as Request, res as Response)
      ).rejects.toMatchObject({ status: STATUS.NOT_ACCEPTABLE })
    })
  })

  describe('updatePurchase', () => {
    it('should update purchase successfully', async () => {
      mockPurchaseService.updateCartItem.mockResolvedValue(mockPurchase as any)
      const req = createMockRequest({
        body: { product_id: 'product_1', buy_count: 3 },
      })
      const res = createMockResponse()

      await updatePurchase(req as Request, res as Response)

      expect(mockPurchaseService.updateCartItem).toHaveBeenCalledWith('user_1', 'product_1', 3)
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw error when cart item not found', async () => {
      mockPurchaseService.updateCartItem.mockRejectedValue(new NotFoundError('Cart item'))
      const req = createMockRequest({
        body: { product_id: 'product_999', buy_count: 1 },
      })
      const res = createMockResponse()

      await expect(
        updatePurchase(req as Request, res as Response)
      ).rejects.toMatchObject({ status: STATUS.NOT_FOUND })
    })
  })

  describe('getPurchases', () => {
    it('should return all purchases', async () => {
      mockPurchaseService.getPurchases.mockResolvedValue([mockPurchase] as any)
      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await getPurchases(req as Request, res as Response)

      expect(mockPurchaseService.getPurchases).toHaveBeenCalledWith('user_1', undefined)
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should filter by status', async () => {
      mockPurchaseService.getPurchases.mockResolvedValue([mockPurchase] as any)
      const req = createMockRequest({ query: { status: '2' } })
      const res = createMockResponse()

      await getPurchases(req as Request, res as Response)

      expect(mockPurchaseService.getPurchases).toHaveBeenCalledWith('user_1', 2)
    })
  })

  describe('deletePurchases', () => {
    it('should delete purchases successfully', async () => {
      mockPurchaseService.removeFromCart.mockResolvedValue(2 as any)
      const req = createMockRequest({
        body: ['purchase_1', 'purchase_2'],
      })
      const res = createMockResponse()

      await deletePurchases(req as Request, res as Response)

      expect(mockPurchaseService.removeFromCart).toHaveBeenCalledWith('user_1', ['purchase_1', 'purchase_2'])
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })
  })
})

