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
jest.mock('../../socket/utils/order-emit', () => ({
  emitAdminNewOrderNotification: jest.fn(),
}))

jest.mock('../../container', () => ({
  purchaseService: {
    addToCart: jest.fn(),
    updateCartItem: jest.fn(),
    switchCartItemVariant: jest.fn(),
    getPurchases: jest.fn(),
    removeFromCart: jest.fn(),
  },
  flashSaleService: {
    getActive: jest.fn().mockResolvedValue([]),
    purchaseFlashSaleItem: jest.fn(),
  },
}))

// Mock handleImageProduct from product controller
jest.mock('@controllers/product.controller', () => ({
  handleImageProduct: jest.fn((product: any) => product),
  __esModule: true,
  default: {},
}))

// Mock flash-sale dynamic imports used in buyProducts
jest.mock('../../socket/managers/flash-sale.manager', () => ({
  getActiveFlashSales: jest.fn().mockReturnValue([]),
  decrementStock: jest.fn(),
}))
jest.mock('../../socket/utils/flash-sale-emit', () => ({
  emitFlashSaleStockUpdate: jest.fn(),
}))

// Mock database models and session
jest.mock('@database/models/product.model', () => ({
  ProductModel: {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}))
jest.mock('@database/models/purchase.model', () => {
  const mockModel: any = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockResolvedValue({ _id: 'purchase_new' }),
  }))
  mockModel.findOneAndUpdate = jest.fn()
  mockModel.findById = jest.fn()
  return { PurchaseModel: mockModel }
})
jest.mock('@database/models/sku.model', () => ({
  SKUModel: {
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}))
jest.mock('@database/database', () => ({
  connectMongoDB: jest.fn(),
  startSession: jest.fn().mockResolvedValue({
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  }),
}))

import { purchaseService } from '../../container'
import { emitCartUpdate } from '../../socket/utils/cart-emit'
import {
  addToCart,
  updatePurchase,
  buyProducts,
  getPurchases,
  deletePurchases,
} from '@controllers/purchase.controller'
import { ProductModel } from '@database/models/product.model'
import { PurchaseModel } from '@database/models/purchase.model'
import { SKUModel } from '@database/models/sku.model'

const mockPurchaseService = purchaseService as jest.Mocked<typeof purchaseService>

const createMockRequest = (
  options: { body?: any; params?: any; query?: any; jwtDecoded?: any } = {},
): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
  jwtDecoded: options.jwtDecoded || {
    id: 'user_1',
    email: 'test@example.com',
    roles: ['User'],
    created_at: new Date().toISOString(),
    name: 'Test User',
  },
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

      expect(mockPurchaseService.addToCart).toHaveBeenCalledWith('user_1', {
        product_id: 'product_1',
        buy_count: 2,
        sku_id: undefined,
      })
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw error when product not found', async () => {
      mockPurchaseService.addToCart.mockRejectedValue(new NotFoundError('Product', 'product_999'))
      const req = createMockRequest({
        body: { product_id: 'product_999', buy_count: 1 },
      })
      const res = createMockResponse()

      await expect(addToCart(req as Request, res as Response)).rejects.toMatchObject({
        status: STATUS.NOT_FOUND,
      })
    })

    it('should throw error when quantity exceeded', async () => {
      mockPurchaseService.addToCart.mockRejectedValue(new ValidationError('Số lượng mua vượt quá'))
      const req = createMockRequest({
        body: { product_id: 'product_1', buy_count: 9999 },
      })
      const res = createMockResponse()

      await expect(addToCart(req as Request, res as Response)).rejects.toMatchObject({
        status: STATUS.NOT_ACCEPTABLE,
      })
    })

    it('should rethrow generic errors', async () => {
      mockPurchaseService.addToCart.mockRejectedValue(new Error('Database error'))
      const req = createMockRequest({ body: { product_id: 'p1', buy_count: 1 } })
      const res = createMockResponse()

      await expect(addToCart(req as Request, res as Response)).rejects.toThrow('Database error')
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

      expect(mockPurchaseService.updateCartItem).toHaveBeenCalledWith(
        'user_1',
        'product_1',
        3,
        undefined,
      )
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw error when cart item not found', async () => {
      mockPurchaseService.updateCartItem.mockRejectedValue(new NotFoundError('Cart item'))
      const req = createMockRequest({
        body: { product_id: 'product_999', buy_count: 1 },
      })
      const res = createMockResponse()

      await expect(updatePurchase(req as Request, res as Response)).rejects.toMatchObject({
        status: STATUS.NOT_FOUND,
      })
    })

    it('should throw error when quantity exceeded on update', async () => {
      mockPurchaseService.updateCartItem.mockRejectedValue(new ValidationError('Quantity exceeded'))
      const req = createMockRequest({ body: { product_id: 'p1', buy_count: 9999 } })
      const res = createMockResponse()

      await expect(updatePurchase(req as Request, res as Response)).rejects.toMatchObject({
        status: STATUS.NOT_ACCEPTABLE,
      })
    })

    it('should rethrow generic errors on update', async () => {
      mockPurchaseService.updateCartItem.mockRejectedValue(new Error('DB error'))
      const req = createMockRequest({ body: { product_id: 'p1', buy_count: 1 } })
      const res = createMockResponse()

      await expect(updatePurchase(req as Request, res as Response)).rejects.toThrow('DB error')
    })
  })

  describe('buyProducts', () => {
    const mockProduct = {
      _id: 'product_1',
      name: 'Test Product',
      price: 100000,
      price_before_discount: 120000,
      quantity: 50,
    }
    const mockSKU = {
      _id: 'sku_1',
      value: 'Size S',
      price: 90000,
      stock: 20,
    }
    const mockPopulatedPurchase = {
      _id: 'purchase_1',
      user: 'user_1',
      product: mockProduct,
      buy_count: 2,
      price: 100000,
      status: 1,
    }

    const buildProductFindByIdChain = (returnVal: any) => {
      const mockLean = jest.fn().mockResolvedValue(returnVal)
      const mockSession = jest.fn().mockReturnValue({ lean: mockLean })
      ;(ProductModel.findById as jest.Mock).mockReturnValue({ session: mockSession })
    }

    const buildPurchaseFindOneAndUpdateChain = (returnVal: any) => {
      const mockLean = jest.fn().mockResolvedValue(returnVal)
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      ;(PurchaseModel.findOneAndUpdate as jest.Mock).mockReturnValue({ populate: mockPopulate })
    }

    const buildPurchaseFindByIdChain = (returnVal: any) => {
      const mockLean = jest.fn().mockResolvedValue(returnVal)
      const mockPopulate = jest.fn().mockReturnValue({ lean: mockLean })
      const mockSession = jest.fn().mockReturnValue({ populate: mockPopulate })
      ;(PurchaseModel.findById as jest.Mock).mockReturnValue({ session: mockSession })
    }

    it('should buy products without SKU (legacy flow)', async () => {
      buildProductFindByIdChain(mockProduct)
      buildPurchaseFindOneAndUpdateChain(mockPopulatedPurchase)
      ;(ProductModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

      const req = createMockRequest({
        body: [{ product_id: 'product_1', buy_count: 2 }],
      })
      const res = createMockResponse()

      await buyProducts(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should buy products with SKU flow', async () => {
      buildProductFindByIdChain(mockProduct)

      const mockSKULean = jest.fn().mockResolvedValue(mockSKU)
      const mockSKUSession = jest.fn().mockReturnValue({ lean: mockSKULean })
      ;(SKUModel.findById as jest.Mock).mockReturnValue({ session: mockSKUSession })

      buildPurchaseFindOneAndUpdateChain(mockPopulatedPurchase)

      const mockSKUDecLean = jest.fn().mockResolvedValue({ ...mockSKU, stock: 18 })
      ;(SKUModel.findOneAndUpdate as jest.Mock).mockReturnValue({ lean: mockSKUDecLean })
      ;(ProductModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

      const req = createMockRequest({
        body: [{ product_id: 'product_1', buy_count: 2, sku_id: 'sku_1' }],
      })
      const res = createMockResponse()

      await buyProducts(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should create new purchase when findOneAndUpdate returns null', async () => {
      buildProductFindByIdChain(mockProduct)
      buildPurchaseFindOneAndUpdateChain(null)

      const mockSaveResult = { _id: 'purchase_new_2' }
      ;(PurchaseModel as any).mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockSaveResult),
      }))
      buildPurchaseFindByIdChain(mockPopulatedPurchase)
      ;(ProductModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

      const req = createMockRequest({
        body: [{ product_id: 'product_1', buy_count: 1 }],
      })
      const res = createMockResponse()

      await buyProducts(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should throw NotFoundError when product is not found', async () => {
      buildProductFindByIdChain(null)

      const req = createMockRequest({
        body: [{ product_id: 'nonexistent', buy_count: 1 }],
      })
      const res = createMockResponse()

      await expect(buyProducts(req as Request, res as Response)).rejects.toThrow()
    })

    it('should throw NotFoundError when SKU is not found', async () => {
      buildProductFindByIdChain(mockProduct)

      const mockSKULean = jest.fn().mockResolvedValue(null)
      const mockSKUSession = jest.fn().mockReturnValue({ lean: mockSKULean })
      ;(SKUModel.findById as jest.Mock).mockReturnValue({ session: mockSKUSession })

      const req = createMockRequest({
        body: [{ product_id: 'product_1', buy_count: 1, sku_id: 'sku_bad' }],
      })
      const res = createMockResponse()

      await expect(buyProducts(req as Request, res as Response)).rejects.toThrow()
    })

    it('should throw error when SKU stock exceeded', async () => {
      buildProductFindByIdChain(mockProduct)

      const lowStockSKU = { ...mockSKU, stock: 1 }
      const mockSKULean = jest.fn().mockResolvedValue(lowStockSKU)
      const mockSKUSession = jest.fn().mockReturnValue({ lean: mockSKULean })
      ;(SKUModel.findById as jest.Mock).mockReturnValue({ session: mockSKUSession })

      const req = createMockRequest({
        body: [{ product_id: 'product_1', buy_count: 10, sku_id: 'sku_1' }],
      })
      const res = createMockResponse()

      await expect(buyProducts(req as Request, res as Response)).rejects.toMatchObject({
        status: STATUS.NOT_ACCEPTABLE,
      })
    })

    it('should throw error when product quantity exceeded (legacy)', async () => {
      const lowQtyProduct = { ...mockProduct, quantity: 1 }
      buildProductFindByIdChain(lowQtyProduct)

      const req = createMockRequest({
        body: [{ product_id: 'product_1', buy_count: 10 }],
      })
      const res = createMockResponse()

      await expect(buyProducts(req as Request, res as Response)).rejects.toMatchObject({
        status: STATUS.NOT_ACCEPTABLE,
      })
    })

    it('should throw error when SKU decrement finds insufficient stock', async () => {
      buildProductFindByIdChain(mockProduct)

      const mockSKULean = jest.fn().mockResolvedValue(mockSKU)
      const mockSKUSession = jest.fn().mockReturnValue({ lean: mockSKULean })
      ;(SKUModel.findById as jest.Mock).mockReturnValue({ session: mockSKUSession })

      buildPurchaseFindOneAndUpdateChain(mockPopulatedPurchase)

      // findOneAndUpdate for decrement returns null (concurrent race)
      ;(SKUModel.findOneAndUpdate as jest.Mock).mockResolvedValue(null)

      const req = createMockRequest({
        body: [{ product_id: 'product_1', buy_count: 2, sku_id: 'sku_1' }],
      })
      const res = createMockResponse()

      await expect(buyProducts(req as Request, res as Response)).rejects.toMatchObject({
        status: STATUS.NOT_ACCEPTABLE,
      })
    })

    it('should handle multiple items in the cart', async () => {
      buildProductFindByIdChain(mockProduct)
      buildPurchaseFindOneAndUpdateChain(mockPopulatedPurchase)
      ;(ProductModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

      const req = createMockRequest({
        body: [
          { product_id: 'product_1', buy_count: 1 },
          { product_id: 'product_1', buy_count: 2 },
        ],
      })
      const res = createMockResponse()

      await buyProducts(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
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

    it('should handle purchase with product as object (image processing)', async () => {
      const purchaseWithProduct = {
        ...mockPurchase,
        product: { _id: 'p1', name: 'Test', image: 'img.jpg', images: ['img.jpg'] },
      }
      mockPurchaseService.getPurchases.mockResolvedValue([purchaseWithProduct] as any)

      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await getPurchases(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should handle purchase with product as string (skip image processing)', async () => {
      const purchaseWithStringProduct = {
        ...mockPurchase,
        product: 'product_id_string',
      }
      mockPurchaseService.getPurchases.mockResolvedValue([purchaseWithStringProduct] as any)

      const req = createMockRequest({ query: {} })
      const res = createMockResponse()

      await getPurchases(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should handle STATUS_PURCHASE.ALL (status 0 means all)', async () => {
      mockPurchaseService.getPurchases.mockResolvedValue([mockPurchase] as any)
      const req = createMockRequest({ query: { status: '0' } })
      const res = createMockResponse()

      await getPurchases(req as Request, res as Response)

      // Status 0 is STATUS_PURCHASE.ALL, so purchaseStatus should be undefined
      expect(mockPurchaseService.getPurchases).toHaveBeenCalledWith('user_1', undefined)
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

      expect(mockPurchaseService.removeFromCart).toHaveBeenCalledWith('user_1', [
        'purchase_1',
        'purchase_2',
      ])
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should handle zero deleted count', async () => {
      mockPurchaseService.removeFromCart.mockResolvedValue(0 as any)
      const req = createMockRequest({ body: [] })
      const res = createMockResponse()

      await deletePurchases(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })
  })

  // Task 8.3 — controller routing tests for variant switch
  describe('updatePurchase — variant switch routing', () => {
    it('should route to switchCartItemVariant when target_sku_id is present and differs from sku_id', async () => {
      ;(mockPurchaseService as any).switchCartItemVariant.mockResolvedValue(mockPurchase as any)
      const req = createMockRequest({
        body: {
          product_id: 'product_1',
          buy_count: 2,
          sku_id: 'sku_A',
          target_sku_id: 'sku_B',
        },
      })
      const res = createMockResponse()

      await updatePurchase(req as Request, res as Response)

      expect((mockPurchaseService as any).switchCartItemVariant).toHaveBeenCalledWith(
        'user_1',
        'product_1',
        'sku_A',
        'sku_B',
      )
      expect(mockPurchaseService.updateCartItem).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should emit emitCartUpdate(userId, update, product_id) after variant switch', async () => {
      ;(mockPurchaseService as any).switchCartItemVariant.mockResolvedValue(mockPurchase as any)
      const req = createMockRequest({
        body: {
          product_id: 'product_1',
          buy_count: 2,
          sku_id: 'sku_A',
          target_sku_id: 'sku_B',
        },
      })
      const res = createMockResponse()

      await updatePurchase(req as Request, res as Response)

      expect(emitCartUpdate).toHaveBeenCalledWith('user_1', 'update', 'product_1')
    })

    it('should route to updateCartItem (not switchCartItemVariant) when no target_sku_id', async () => {
      mockPurchaseService.updateCartItem.mockResolvedValue(mockPurchase as any)
      const req = createMockRequest({
        body: { product_id: 'product_1', buy_count: 3, sku_id: 'sku_A' },
      })
      const res = createMockResponse()

      await updatePurchase(req as Request, res as Response)

      expect(mockPurchaseService.updateCartItem).toHaveBeenCalledWith(
        'user_1',
        'product_1',
        3,
        'sku_A',
      )
      expect((mockPurchaseService as any).switchCartItemVariant).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    })

    it('should route to updateCartItem when target_sku_id equals sku_id (no-op guard at controller level)', async () => {
      mockPurchaseService.updateCartItem.mockResolvedValue(mockPurchase as any)
      const req = createMockRequest({
        body: { product_id: 'product_1', buy_count: 2, sku_id: 'sku_A', target_sku_id: 'sku_A' },
      })
      const res = createMockResponse()

      await updatePurchase(req as Request, res as Response)

      // target_sku_id === sku_id → controller condition is false → falls through to updateCartItem
      expect(mockPurchaseService.updateCartItem).toHaveBeenCalled()
      expect((mockPurchaseService as any).switchCartItemVariant).not.toHaveBeenCalled()
    })

    it('should throw NotFoundError (mapped) when switchCartItemVariant throws NotFoundError', async () => {
      ;(mockPurchaseService as any).switchCartItemVariant.mockRejectedValue(
        new NotFoundError('Cart item'),
      )
      const req = createMockRequest({
        body: {
          product_id: 'product_1',
          buy_count: 1,
          sku_id: 'sku_A',
          target_sku_id: 'sku_B',
        },
      })
      const res = createMockResponse()

      await expect(updatePurchase(req as Request, res as Response)).rejects.toMatchObject({
        status: STATUS.NOT_FOUND,
      })
    })

    it('should throw ValidationError (mapped) when switchCartItemVariant throws ValidationError', async () => {
      ;(mockPurchaseService as any).switchCartItemVariant.mockRejectedValue(
        new ValidationError('Stock exceeded'),
      )
      const req = createMockRequest({
        body: {
          product_id: 'product_1',
          buy_count: 10,
          sku_id: 'sku_A',
          target_sku_id: 'sku_B',
        },
      })
      const res = createMockResponse()

      await expect(updatePurchase(req as Request, res as Response)).rejects.toMatchObject({
        status: STATUS.NOT_ACCEPTABLE,
      })
    })
  })
})
