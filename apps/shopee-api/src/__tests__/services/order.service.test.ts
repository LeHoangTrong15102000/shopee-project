/// <reference types="jest" />
import { Types } from 'mongoose'
import { OrderService, CreateOrderInput } from '@services/order.service'
import { IOrderRepository } from '@repositories/interfaces/order.repository.interface'
import { IProductRepository } from '@repositories/interfaces/product.repository.interface'
import { IAddressRepository } from '@repositories/interfaces/address.repository.interface'
import { IPurchaseRepository } from '@repositories/interfaces/purchase.repository.interface'
import { ISKURepository } from '@repositories/interfaces/sku.repository.interface'
import { IProductSkuSnapshotRepository } from '@repositories/interfaces/product-sku-snapshot.repository.interface'
import { NotFoundError, BusinessError } from '@services/base.service'
import { ORDER_STATUS, PAYMENT_METHOD } from '@database/models/order.model'
import { STATUS_PURCHASE } from '@constants/purchase'

jest.mock('../../utils/transaction.helper', () => ({
  withTransaction: jest.fn().mockImplementation(async (fn) => {
    const mockSession = {}
    return fn(mockSession)
  }),
}))

// Mock the container to prevent instantiation of real services/repositories
jest.mock('../../container', () => ({
  stripeService: { createRefund: jest.fn(), retrieveRefund: jest.fn() },
  orderService: {},
  auditLogService: { writeLog: jest.fn() },
}))

// Mock socket emit utilities
jest.mock('../../socket/utils/order-emit', () => ({
  emitOrderStatusUpdate: jest.fn(),
  emitAdminNewOrderNotification: jest.fn(),
}))

jest.mock('@utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiWarn: jest.fn(),
    apiError: jest.fn(),
    dbInfo: jest.fn(),
    dbError: jest.fn(),
    performance: jest.fn(),
  },
}))

const validObjectId = new Types.ObjectId()

const mockOrderRepository: jest.Mocked<IOrderRepository> = {
  findByUser: jest.fn(),
  findById: jest.fn(),
  findByIdAndUser: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
  updatePaymentStatus: jest.fn().mockResolvedValue(undefined),
  findTrackingByOrderAndUser: jest.fn(),
  findTrackingByNumber: jest.fn(),
}

const mockProductRepository = {
  findById: jest.fn(),
  bulkUpdateStock: jest.fn(),
  updateById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  deleteById: jest.fn(),
  count: jest.fn(),
  incrementSold: jest.fn(),
} as unknown as jest.Mocked<IProductRepository>

const mockAddressRepository = {
  findByIdAndUser: jest.fn(),
} as unknown as jest.Mocked<IAddressRepository>

const mockPurchaseRepository = {
  deleteManyByUserAndProducts: jest.fn(),
} as unknown as jest.Mocked<IPurchaseRepository>

describe('OrderService', () => {
  let service: OrderService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new OrderService(
      mockOrderRepository,
      mockProductRepository,
      mockAddressRepository,
      mockPurchaseRepository,
    )
  })

  describe('getShippingMethods', () => {
    it('returns array of 3 shipping methods', () => {
      const methods = service.getShippingMethods()
      expect(methods).toHaveLength(3)
      expect(methods.map((m) => m.id)).toEqual(['standard', 'express', 'same_day'])
      expect(methods.map((m) => m.price)).toEqual([30000, 50000, 80000])
    })
  })

  describe('getPaymentMethods', () => {
    it('returns array of 4 payment methods', () => {
      const methods = service.getPaymentMethods()
      expect(methods).toHaveLength(4)
      expect(methods.map((m) => m.id)).toEqual([
        PAYMENT_METHOD.COD,
        PAYMENT_METHOD.BANK_TRANSFER,
        PAYMENT_METHOD.E_WALLET,
        PAYMENT_METHOD.CREDIT_CARD,
      ])
    })
  })

  describe('createOrder', () => {
    const mockAddress = {
      full_name: 'Test',
      phone: '0123456789',
      province: 'HN',
      district: 'D1',
      ward: 'W1',
      street: '123 St',
    }
    const mockProduct = {
      _id: validObjectId,
      name: 'Product',
      price: 100000,
      price_before_discount: 120000,
      quantity: 10,
      sold: 5,
    }
    const input: CreateOrderInput = {
      items: [{ product_id: validObjectId.toString(), buy_count: 2 }],
      shipping_address_id: validObjectId.toString(),
      shipping_method_id: 'standard',
      payment_method: PAYMENT_METHOD.COD,
    }

    it('creates order successfully', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress as any)
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      mockOrderRepository.create.mockResolvedValue({
        _id: validObjectId,
        status: ORDER_STATUS.PENDING,
      } as any)
      mockProductRepository.bulkUpdateStock.mockResolvedValue(1)
      mockPurchaseRepository.deleteManyByUserAndProducts.mockResolvedValue(1)

      const result = await service.createOrder(validObjectId.toString(), input)

      expect(result).toBeDefined()
      expect(mockProductRepository.bulkUpdateStock).toHaveBeenCalledWith(
        [{ product_id: validObjectId.toString(), quantity_change: -2, sold_change: 2 }],
        expect.objectContaining({}),
      )
      expect(mockPurchaseRepository.deleteManyByUserAndProducts).toHaveBeenCalledWith(
        validObjectId.toString(),
        [validObjectId.toString()],
        STATUS_PURCHASE.IN_CART,
        expect.objectContaining({}),
      )
    })

    it('throws NotFoundError when address not found', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(null)
      await expect(service.createOrder(validObjectId.toString(), input)).rejects.toThrow(
        NotFoundError,
      )
    })

    it('throws BusinessError for invalid shipping method', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress as any)
      await expect(
        service.createOrder(validObjectId.toString(), { ...input, shipping_method_id: 'invalid' }),
      ).rejects.toThrow(BusinessError)
    })

    it('throws NotFoundError when product not found', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress as any)
      mockProductRepository.findById.mockResolvedValue(null)
      await expect(service.createOrder(validObjectId.toString(), input)).rejects.toThrow(
        NotFoundError,
      )
    })

    it('throws BusinessError for insufficient stock', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress as any)
      mockProductRepository.findById.mockResolvedValue({ ...mockProduct, quantity: 1 } as any)
      await expect(service.createOrder(validObjectId.toString(), input)).rejects.toThrow(
        BusinessError,
      )
    })
  })

  describe('getOrders', () => {
    it('returns paginated results', async () => {
      const mockResult = { data: [], pagination: { page: 1, limit: 10, page_size: 1, total: 0 } }
      mockOrderRepository.findByUser.mockResolvedValue(mockResult)
      const result = await service.getOrders(validObjectId.toString(), 'all', {
        page: 1,
        limit: 10,
      })
      expect(result).toEqual(mockResult)
    })
  })

  describe('getOrderById', () => {
    it('returns order when found', async () => {
      const mockOrder = { _id: validObjectId, status: ORDER_STATUS.PENDING }
      mockOrderRepository.findByIdAndUser.mockResolvedValue(mockOrder as any)
      const result = await service.getOrderById(validObjectId.toString(), validObjectId.toString())
      expect(result).toEqual(mockOrder)
    })

    it('throws NotFoundError when not found', async () => {
      mockOrderRepository.findByIdAndUser.mockResolvedValue(null)
      await expect(
        service.getOrderById(validObjectId.toString(), validObjectId.toString()),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('cancelOrder', () => {
    const mockOrder = {
      _id: validObjectId,
      status: ORDER_STATUS.PENDING,
      items: [{ product: validObjectId, buy_count: 2 }],
    }

    it('cancels order with PENDING status', async () => {
      mockOrderRepository.findByIdAndUser.mockResolvedValue(mockOrder as any)
      mockProductRepository.findById.mockResolvedValue({ quantity: 10, sold: 5 } as any)
      mockProductRepository.updateById.mockResolvedValue({} as any)
      mockOrderRepository.updateStatus.mockResolvedValue({
        ...mockOrder,
        status: ORDER_STATUS.CANCELLED,
      } as any)

      const result = await service.cancelOrder(
        validObjectId.toString(),
        validObjectId.toString(),
        'reason',
      )
      expect(result.status).toBe(ORDER_STATUS.CANCELLED)
    })

    it('throws BusinessError for non-cancellable status', async () => {
      mockOrderRepository.findByIdAndUser.mockResolvedValue({
        ...mockOrder,
        status: ORDER_STATUS.SHIPPING,
      } as any)
      await expect(
        service.cancelOrder(validObjectId.toString(), validObjectId.toString()),
      ).rejects.toThrow(BusinessError)
    })
  })

  describe('confirmReceived', () => {
    it('confirms received when status is SHIPPING', async () => {
      mockOrderRepository.findByIdAndUser.mockResolvedValue({
        _id: validObjectId,
        status: ORDER_STATUS.SHIPPING,
      } as any)
      mockOrderRepository.updateStatus.mockResolvedValue({
        _id: validObjectId,
        status: ORDER_STATUS.DELIVERED,
      } as any)
      const result = await service.confirmReceived(
        validObjectId.toString(),
        validObjectId.toString(),
      )
      expect(result.status).toBe(ORDER_STATUS.DELIVERED)
    })

    it('throws BusinessError when status is not SHIPPING', async () => {
      mockOrderRepository.findByIdAndUser.mockResolvedValue({
        _id: validObjectId,
        status: ORDER_STATUS.PENDING,
      } as any)
      await expect(
        service.confirmReceived(validObjectId.toString(), validObjectId.toString()),
      ).rejects.toThrow(BusinessError)
    })
  })

  describe('getTracking', () => {
    it('returns tracking when found', async () => {
      const mockTracking = { tracking_number: 'TRK123' }
      mockOrderRepository.findTrackingByOrderAndUser.mockResolvedValue(mockTracking as any)
      const result = await service.getTracking(validObjectId.toString(), validObjectId.toString())
      expect(result).toEqual(mockTracking)
    })

    it('throws NotFoundError when not found', async () => {
      mockOrderRepository.findTrackingByOrderAndUser.mockResolvedValue(null)
      await expect(
        service.getTracking(validObjectId.toString(), validObjectId.toString()),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('getTrackingByNumber', () => {
    it('returns tracking when found', async () => {
      const mockTracking = { tracking_number: 'TRK123' }
      mockOrderRepository.findTrackingByNumber.mockResolvedValue(mockTracking as any)
      const result = await service.getTrackingByNumber('TRK123')
      expect(result).toEqual(mockTracking)
    })

    it('throws NotFoundError when not found', async () => {
      mockOrderRepository.findTrackingByNumber.mockResolvedValue(null)
      await expect(service.getTrackingByNumber('TRK123')).rejects.toThrow(NotFoundError)
    })
  })
})

describe('OrderService - SKU Stock Sync', () => {
  let service: OrderService
  const skuId = new Types.ObjectId()
  const productId = new Types.ObjectId()

  const mockSkuRepository = {
    findById: jest.fn(),
    bulkAtomicDecrementStock: jest.fn(),
    atomicIncrementStock: jest.fn(),
  } as unknown as jest.Mocked<ISKURepository>

  const mockAddress = {
    full_name: 'Test',
    phone: '0123456789',
    province: 'HN',
    district: 'D1',
    ward: 'W1',
    street: '123 St',
  }
  const mockProduct = {
    _id: productId,
    name: 'Áo Thun',
    price: 100000,
    price_before_discount: 120000,
    quantity: 10,
    sold: 5,
  }
  const mockSku = {
    _id: skuId,
    value: 'Đỏ-M',
    price: 100000,
    stock: 5,
    product: productId,
    variant_values: { color: 'Đỏ', size: 'M' },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    service = new OrderService(
      mockOrderRepository,
      mockProductRepository,
      mockAddressRepository,
      mockPurchaseRepository,
      mockSkuRepository,
    )
  })

  describe('createOrder with SKU', () => {
    it('uses bulkAtomicDecrementStock for SKU items and increments sold', async () => {
      const input: CreateOrderInput = {
        items: [{ product_id: productId.toString(), buy_count: 2, sku_id: skuId.toString() }],
        shipping_address_id: validObjectId.toString(),
        shipping_method_id: 'standard',
        payment_method: PAYMENT_METHOD.COD,
      }

      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress as any)
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      mockSkuRepository.findById.mockResolvedValue(mockSku as any)
      mockSkuRepository.bulkAtomicDecrementStock.mockResolvedValue([
        { skuId: skuId.toString(), success: true, sku: mockSku as any },
      ])
      mockOrderRepository.create.mockResolvedValue({
        _id: validObjectId,
        status: ORDER_STATUS.PENDING,
      } as any)
      mockPurchaseRepository.deleteManyByUserAndProducts.mockResolvedValue(1)
      mockProductRepository.incrementSold.mockResolvedValue(undefined as any)

      const result = await service.createOrder(validObjectId.toString(), input)

      expect(result).toBeDefined()
      expect(result.status).toBe(ORDER_STATUS.PENDING)
      expect(mockSkuRepository.bulkAtomicDecrementStock).toHaveBeenCalledWith(
        [{ skuId: skuId.toString(), quantity: 2 }],
        expect.objectContaining({}),
      )
      expect(mockProductRepository.bulkUpdateStock).not.toHaveBeenCalled()
      expect(mockProductRepository.incrementSold).toHaveBeenCalledWith(
        productId.toString(),
        2,
        expect.objectContaining({}),
      )
    })

    it('throws descriptive error with product name and variant on insufficient stock', async () => {
      const input: CreateOrderInput = {
        items: [{ product_id: productId.toString(), buy_count: 10, sku_id: skuId.toString() }],
        shipping_address_id: validObjectId.toString(),
        shipping_method_id: 'standard',
        payment_method: PAYMENT_METHOD.COD,
      }

      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress as any)
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      mockSkuRepository.findById.mockResolvedValue(mockSku as any)
      mockSkuRepository.bulkAtomicDecrementStock.mockRejectedValue(
        new BusinessError(`SKU ${skuId.toString()} không đủ tồn kho`),
      )

      await expect(service.createOrder(validObjectId.toString(), input)).rejects.toThrow(
        /Áo Thun - Đỏ-M không đủ số lượng/,
      )
    })

    it('error message identifies the specific failing SKU in multi-SKU order', async () => {
      const skuId2 = new Types.ObjectId()
      const mockSku2 = {
        _id: skuId2,
        value: 'Xanh-L',
        price: 110000,
        stock: 1,
        product: productId,
        variant_values: { color: 'Xanh', size: 'L' },
      }
      const input: CreateOrderInput = {
        items: [
          { product_id: productId.toString(), buy_count: 2, sku_id: skuId.toString() },
          { product_id: productId.toString(), buy_count: 5, sku_id: skuId2.toString() },
        ],
        shipping_address_id: validObjectId.toString(),
        shipping_method_id: 'standard',
        payment_method: PAYMENT_METHOD.COD,
      }

      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress as any)
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      mockSkuRepository.findById
        .mockResolvedValueOnce(mockSku as any)
        .mockResolvedValueOnce(mockSku2 as any)
      mockSkuRepository.bulkAtomicDecrementStock.mockRejectedValue(
        new BusinessError(`SKU ${skuId2.toString()} không đủ tồn kho`),
      )

      await expect(service.createOrder(validObjectId.toString(), input)).rejects.toThrow(
        /Áo Thun - Xanh-L không đủ số lượng/,
      )
    })

    it('aggregates Product.sold for multiple SKUs of same product', async () => {
      const skuId2 = new Types.ObjectId()
      const mockSku2 = {
        _id: skuId2,
        value: 'Xanh-L',
        price: 110000,
        stock: 10,
        product: productId,
        variant_values: { color: 'Xanh', size: 'L' },
      }
      const input: CreateOrderInput = {
        items: [
          { product_id: productId.toString(), buy_count: 2, sku_id: skuId.toString() },
          { product_id: productId.toString(), buy_count: 3, sku_id: skuId2.toString() },
        ],
        shipping_address_id: validObjectId.toString(),
        shipping_method_id: 'standard',
        payment_method: PAYMENT_METHOD.COD,
      }

      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress as any)
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      mockSkuRepository.findById
        .mockResolvedValueOnce(mockSku as any)
        .mockResolvedValueOnce(mockSku2 as any)
      mockSkuRepository.bulkAtomicDecrementStock.mockResolvedValue([
        { skuId: skuId.toString(), success: true, sku: mockSku as any },
        { skuId: skuId2.toString(), success: true, sku: mockSku2 as any },
      ])
      mockOrderRepository.create.mockResolvedValue({
        _id: validObjectId,
        status: ORDER_STATUS.PENDING,
      } as any)
      mockPurchaseRepository.deleteManyByUserAndProducts.mockResolvedValue(1)
      mockProductRepository.incrementSold.mockResolvedValue(undefined as any)

      await service.createOrder(validObjectId.toString(), input)

      // Should be called once with combined total (2+3=5), not twice
      expect(mockProductRepository.incrementSold).toHaveBeenCalledWith(
        productId.toString(),
        5,
        expect.objectContaining({}),
      )
    })

    it('propagates Product sync failure from bulkAtomicDecrementStock', async () => {
      const input: CreateOrderInput = {
        items: [{ product_id: productId.toString(), buy_count: 2, sku_id: skuId.toString() }],
        shipping_address_id: validObjectId.toString(),
        shipping_method_id: 'standard',
        payment_method: PAYMENT_METHOD.COD,
      }

      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress as any)
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      mockSkuRepository.findById.mockResolvedValue(mockSku as any)
      mockSkuRepository.bulkAtomicDecrementStock.mockRejectedValue(
        new BusinessError('Lỗi đồng bộ tồn kho sản phẩm'),
      )

      await expect(service.createOrder(validObjectId.toString(), input)).rejects.toThrow(
        BusinessError,
      )
    })
  })

  describe('cancelOrder with SKU', () => {
    it('restores SKU stock and decrements Product.sold on cancel', async () => {
      const mockOrder = {
        _id: validObjectId,
        status: ORDER_STATUS.PENDING,
        items: [{ product: productId, buy_count: 2, sku: skuId }],
      }

      mockOrderRepository.findByIdAndUser.mockResolvedValue(mockOrder as any)
      mockSkuRepository.atomicIncrementStock.mockResolvedValue(mockSku as any)
      mockOrderRepository.updateStatus.mockResolvedValue({
        ...mockOrder,
        status: ORDER_STATUS.CANCELLED,
      } as any)
      mockProductRepository.incrementSold.mockResolvedValue(undefined as any)

      const result = await service.cancelOrder(
        validObjectId.toString(),
        validObjectId.toString(),
        'reason',
      )

      expect(result.status).toBe(ORDER_STATUS.CANCELLED)
      expect(mockSkuRepository.atomicIncrementStock).toHaveBeenCalledWith(skuId.toString(), 2)
      expect(mockProductRepository.incrementSold).toHaveBeenCalledWith(productId.toString(), -2)
    })

    it('restores stock for multiple SKUs across different products on cancel', async () => {
      const productId2 = new Types.ObjectId()
      const skuId2 = new Types.ObjectId()
      const mockSku2 = {
        _id: skuId2,
        value: 'Xanh-L',
        price: 110000,
        stock: 10,
        product: productId2,
      }
      const mockOrder = {
        _id: validObjectId,
        status: ORDER_STATUS.PENDING,
        items: [
          { product: productId, buy_count: 2, sku: skuId },
          { product: productId2, buy_count: 1, sku: skuId2 },
        ],
      }

      mockOrderRepository.findByIdAndUser.mockResolvedValue(mockOrder as any)
      mockSkuRepository.atomicIncrementStock
        .mockResolvedValueOnce(mockSku as any)
        .mockResolvedValueOnce(mockSku2 as any)
      mockOrderRepository.updateStatus.mockResolvedValue({
        ...mockOrder,
        status: ORDER_STATUS.CANCELLED,
      } as any)
      mockProductRepository.incrementSold.mockResolvedValue(undefined as any)

      const result = await service.cancelOrder(
        validObjectId.toString(),
        validObjectId.toString(),
        'reason',
      )

      expect(result.status).toBe(ORDER_STATUS.CANCELLED)
      expect(mockSkuRepository.atomicIncrementStock).toHaveBeenCalledWith(skuId.toString(), 2)
      expect(mockSkuRepository.atomicIncrementStock).toHaveBeenCalledWith(skuId2.toString(), 1)
      expect(mockProductRepository.incrementSold).toHaveBeenCalledWith(productId.toString(), -2)
      expect(mockProductRepository.incrementSold).toHaveBeenCalledWith(productId2.toString(), -1)
    })
  })

  describe('returnOrder with SKU', () => {
    it('restores SKU stock and decrements Product.sold on return', async () => {
      const mockOrder = {
        _id: validObjectId,
        status: ORDER_STATUS.DELIVERED,
        delivered_at: new Date(),
        items: [{ product: productId, buy_count: 2, sku: skuId }],
      }

      mockOrderRepository.findByIdAndUser.mockResolvedValue(mockOrder as any)
      mockSkuRepository.atomicIncrementStock.mockResolvedValue(mockSku as any)
      mockOrderRepository.updateStatus.mockResolvedValue({
        ...mockOrder,
        status: ORDER_STATUS.RETURNED,
      } as any)
      mockProductRepository.incrementSold.mockResolvedValue(undefined as any)

      const result = await service.returnOrder(
        validObjectId.toString(),
        validObjectId.toString(),
        'defective',
      )

      expect(result.status).toBe(ORDER_STATUS.RETURNED)
      expect(mockSkuRepository.atomicIncrementStock).toHaveBeenCalledWith(skuId.toString(), 2)
      expect(mockProductRepository.incrementSold).toHaveBeenCalledWith(productId.toString(), -2)
    })
  })
})

// ─── Tasks 5.2, 8.1-8.5, 8.8 — createOrder transaction orchestration ─────────

describe('OrderService - createOrder transaction orchestration', () => {
  let service: OrderService

  const userId = new Types.ObjectId()
  const productId = new Types.ObjectId()
  const skuId = new Types.ObjectId()
  const orderId = new Types.ObjectId()
  const addressId = new Types.ObjectId()

  const mockAddress = {
    full_name: 'Test',
    phone: '0123456789',
    province: 'HN',
    district: 'D1',
    ward: 'W1',
    street: '123 St',
  }
  const mockProduct = {
    _id: productId,
    name: 'Áo Thun',
    price: 100000,
    price_before_discount: 120000,
    image: 'img.jpg',
    quantity: 10,
    sold: 5,
  }
  const mockSku = {
    _id: skuId,
    value: 'Đỏ-M',
    price: 100000,
    stock: 5,
    product: productId,
    image: '',
    variant_values: { color: 'Đỏ', size: 'M' },
  }
  const mockCreatedOrder = {
    _id: orderId,
    status: ORDER_STATUS.PENDING,
  }

  const mockOrderRepo: jest.Mocked<IOrderRepository> = {
    findByUser: jest.fn(),
    findById: jest.fn(),
    findByIdAndUser: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    updatePaymentStatus: jest.fn().mockResolvedValue(undefined),
    findTrackingByOrderAndUser: jest.fn(),
    findTrackingByNumber: jest.fn(),
  }

  const mockProductRepo = {
    findById: jest.fn(),
    bulkUpdateStock: jest.fn(),
    updateById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    deleteById: jest.fn(),
    count: jest.fn(),
    incrementSold: jest.fn(),
  } as unknown as jest.Mocked<IProductRepository>

  const mockAddressRepo = {
    findByIdAndUser: jest.fn(),
  } as unknown as jest.Mocked<IAddressRepository>

  const mockPurchaseRepo = {
    deleteManyByUserAndProducts: jest.fn(),
  } as unknown as jest.Mocked<IPurchaseRepository>

  const mockSkuRepo = {
    findById: jest.fn(),
    bulkAtomicDecrementStock: jest.fn(),
    atomicIncrementStock: jest.fn(),
  } as unknown as jest.Mocked<ISKURepository>

  const mockSnapshotRepo: jest.Mocked<IProductSkuSnapshotRepository> = {
    create: jest.fn(),
    createMany: jest.fn(),
    findByOrder: jest.fn(),
    findByProduct: jest.fn(),
    findBySku: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    service = new OrderService(
      mockOrderRepo,
      mockProductRepo,
      mockAddressRepo,
      mockPurchaseRepo,
      mockSkuRepo,
      mockSnapshotRepo,
    )
  })

  const baseInput: CreateOrderInput = {
    items: [{ product_id: productId.toString(), buy_count: 2, sku_id: skuId.toString() }],
    shipping_address_id: addressId.toString(),
    shipping_method_id: 'standard',
    payment_method: PAYMENT_METHOD.COD,
  }

  // Task 8.1 — Happy path: creates order, snapshots, updates sold, clears cart
  describe('Task 8.1 — happy path (SKU flow)', () => {
    it('creates order, persists snapshots, increments sold, clears cart — all in one transaction', async () => {
      mockAddressRepo.findByIdAndUser.mockResolvedValue(mockAddress as any)
      mockProductRepo.findById.mockResolvedValue(mockProduct as any)
      mockSkuRepo.findById.mockResolvedValue(mockSku as any)
      mockSkuRepo.bulkAtomicDecrementStock.mockResolvedValue([
        { skuId: skuId.toString(), success: true, sku: mockSku as any },
      ])
      mockOrderRepo.create.mockResolvedValue(mockCreatedOrder as any)
      mockSnapshotRepo.createMany.mockResolvedValue([])
      mockProductRepo.incrementSold.mockResolvedValue(undefined as any)
      mockPurchaseRepo.deleteManyByUserAndProducts.mockResolvedValue(1)

      const result = await service.createOrder(userId.toString(), baseInput)

      expect(result).toBeDefined()
      expect(result.status).toBe(ORDER_STATUS.PENDING)

      // Stock decremented
      expect(mockSkuRepo.bulkAtomicDecrementStock).toHaveBeenCalledWith(
        [{ skuId: skuId.toString(), quantity: 2 }],
        expect.objectContaining({}),
      )

      // Order created
      expect(mockOrderRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: ORDER_STATUS.PENDING }),
        expect.objectContaining({}),
      )

      // Snapshots created
      expect(mockSnapshotRepo.createMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            sku: expect.anything(),
            product: expect.anything(),
          }),
        ]),
        expect.objectContaining({}),
      )

      // Product.sold incremented
      expect(mockProductRepo.incrementSold).toHaveBeenCalledWith(
        productId.toString(),
        2,
        expect.objectContaining({}),
      )

      // Cart cleared
      expect(mockPurchaseRepo.deleteManyByUserAndProducts).toHaveBeenCalledWith(
        userId.toString(),
        [productId.toString()],
        STATUS_PURCHASE.IN_CART,
        expect.objectContaining({}),
      )
    })
  })

  // Task 5.2 — 10-item cart: only 1 deleteManyByUserAndProducts call
  describe('Task 5.2 — N cart items → 1 bulk delete call', () => {
    it('calls deleteManyByUserAndProducts exactly once regardless of item count', async () => {
      const productIds = Array.from({ length: 10 }, () => new Types.ObjectId())
      const skuIds = Array.from({ length: 10 }, () => new Types.ObjectId())

      const input: CreateOrderInput = {
        items: productIds.map((pid, i) => ({
          product_id: pid.toString(),
          buy_count: 1,
          sku_id: skuIds[i].toString(),
        })),
        shipping_address_id: addressId.toString(),
        shipping_method_id: 'standard',
        payment_method: PAYMENT_METHOD.COD,
      }

      mockAddressRepo.findByIdAndUser.mockResolvedValue(mockAddress as any)
      // Each product lookup returns a product variant
      productIds.forEach((pid, i) => {
        mockProductRepo.findById.mockResolvedValueOnce({ ...mockProduct, _id: pid } as any)
        mockSkuRepo.findById.mockResolvedValueOnce({
          ...mockSku,
          _id: skuIds[i],
          product: pid,
        } as any)
      })
      mockSkuRepo.bulkAtomicDecrementStock.mockResolvedValue(
        skuIds.map((sid) => ({ skuId: sid.toString(), success: true, sku: mockSku as any })),
      )
      mockOrderRepo.create.mockResolvedValue(mockCreatedOrder as any)
      mockSnapshotRepo.createMany.mockResolvedValue([])
      mockProductRepo.incrementSold.mockResolvedValue(undefined as any)
      mockPurchaseRepo.deleteManyByUserAndProducts.mockResolvedValue(10)

      await service.createOrder(userId.toString(), input)

      // Critical: only ONE delete call for all 10 items
      expect(mockPurchaseRepo.deleteManyByUserAndProducts).toHaveBeenCalledTimes(1)
      expect(mockPurchaseRepo.deleteManyByUserAndProducts).toHaveBeenCalledWith(
        userId.toString(),
        productIds.map((id) => id.toString()),
        STATUS_PURCHASE.IN_CART,
        expect.objectContaining({}),
      )
    })
  })

  // Task 8.2 — SKU decrement fails → error propagates, no order/snapshot/cart-clear
  describe('Task 8.2 — SKU decrement fails → rollback (no order, no snapshot, cart intact)', () => {
    it('propagates error and does not create order or snapshots when stock decrement fails', async () => {
      mockAddressRepo.findByIdAndUser.mockResolvedValue(mockAddress as any)
      mockProductRepo.findById.mockResolvedValue(mockProduct as any)
      mockSkuRepo.findById.mockResolvedValue(mockSku as any)
      mockSkuRepo.bulkAtomicDecrementStock.mockRejectedValue(
        new BusinessError('SKU không đủ tồn kho'),
      )

      await expect(service.createOrder(userId.toString(), baseInput)).rejects.toThrow(BusinessError)

      // Nothing after reserveStock should run
      expect(mockOrderRepo.create).not.toHaveBeenCalled()
      expect(mockSnapshotRepo.createMany).not.toHaveBeenCalled()
      expect(mockProductRepo.incrementSold).not.toHaveBeenCalled()
      expect(mockPurchaseRepo.deleteManyByUserAndProducts).not.toHaveBeenCalled()
    })
  })

  // Task 8.3 — snapshotSkus fails → rollback (order reverted by transaction abort)
  describe('Task 8.3 — snapshotSkus fails → rollback', () => {
    it('propagates error and does not proceed past snapshot creation when it fails', async () => {
      mockAddressRepo.findByIdAndUser.mockResolvedValue(mockAddress as any)
      mockProductRepo.findById.mockResolvedValue(mockProduct as any)
      mockSkuRepo.findById.mockResolvedValue(mockSku as any)
      mockSkuRepo.bulkAtomicDecrementStock.mockResolvedValue([
        { skuId: skuId.toString(), success: true, sku: mockSku as any },
      ])
      mockOrderRepo.create.mockResolvedValue(mockCreatedOrder as any)
      mockSnapshotRepo.createMany.mockRejectedValue(new Error('Snapshot insert failed'))

      await expect(service.createOrder(userId.toString(), baseInput)).rejects.toThrow(
        'Snapshot insert failed',
      )

      // Stock and order were attempted, but sold and cart-clear should not run
      expect(mockSkuRepo.bulkAtomicDecrementStock).toHaveBeenCalled()
      expect(mockOrderRepo.create).toHaveBeenCalled()
      expect(mockProductRepo.incrementSold).not.toHaveBeenCalled()
      expect(mockPurchaseRepo.deleteManyByUserAndProducts).not.toHaveBeenCalled()
    })
  })

  // Task 8.4 — incrementSold fails → rollback
  describe('Task 8.4 — incrementSold fails → rollback', () => {
    it('propagates error and does not clear cart when incrementSold fails', async () => {
      mockAddressRepo.findByIdAndUser.mockResolvedValue(mockAddress as any)
      mockProductRepo.findById.mockResolvedValue(mockProduct as any)
      mockSkuRepo.findById.mockResolvedValue(mockSku as any)
      mockSkuRepo.bulkAtomicDecrementStock.mockResolvedValue([
        { skuId: skuId.toString(), success: true, sku: mockSku as any },
      ])
      mockOrderRepo.create.mockResolvedValue(mockCreatedOrder as any)
      mockSnapshotRepo.createMany.mockResolvedValue([])
      mockProductRepo.incrementSold.mockRejectedValue(new Error('Product sold update failed'))

      await expect(service.createOrder(userId.toString(), baseInput)).rejects.toThrow(
        'Product sold update failed',
      )

      // Everything up to sold ran, but cart-clear did not
      expect(mockSkuRepo.bulkAtomicDecrementStock).toHaveBeenCalled()
      expect(mockOrderRepo.create).toHaveBeenCalled()
      expect(mockSnapshotRepo.createMany).toHaveBeenCalled()
      expect(mockPurchaseRepo.deleteManyByUserAndProducts).not.toHaveBeenCalled()
    })
  })

  // Task 8.5 — cart clear fails → rollback (no data left over due to transaction abort)
  describe('Task 8.5 — cart clear fails → rollback', () => {
    it('propagates error when cart clear fails after all other steps succeeded', async () => {
      mockAddressRepo.findByIdAndUser.mockResolvedValue(mockAddress as any)
      mockProductRepo.findById.mockResolvedValue(mockProduct as any)
      mockSkuRepo.findById.mockResolvedValue(mockSku as any)
      mockSkuRepo.bulkAtomicDecrementStock.mockResolvedValue([
        { skuId: skuId.toString(), success: true, sku: mockSku as any },
      ])
      mockOrderRepo.create.mockResolvedValue(mockCreatedOrder as any)
      mockSnapshotRepo.createMany.mockResolvedValue([])
      mockProductRepo.incrementSold.mockResolvedValue(undefined as any)
      mockPurchaseRepo.deleteManyByUserAndProducts.mockRejectedValue(
        new Error('Cart delete failed'),
      )

      await expect(service.createOrder(userId.toString(), baseInput)).rejects.toThrow(
        'Cart delete failed',
      )

      // All steps up to clearCartItems ran
      expect(mockSkuRepo.bulkAtomicDecrementStock).toHaveBeenCalled()
      expect(mockOrderRepo.create).toHaveBeenCalled()
      expect(mockSnapshotRepo.createMany).toHaveBeenCalled()
      expect(mockProductRepo.incrementSold).toHaveBeenCalled()
      expect(mockPurchaseRepo.deleteManyByUserAndProducts).toHaveBeenCalled()
    })
  })

  // Task 8.8 — bulkAtomicDecrementStock inside transaction skips manual compensation
  describe('Task 8.8 — bulkAtomicDecrementStock inside transaction skips manual rollback', () => {
    it('error from bulkAtomicDecrementStock propagates without triggering internal compensating logic', async () => {
      // The withTransaction mock passes a session object to fn
      // When bulkAtomicDecrementStock receives { session }, it sets insideTransaction=true
      // and skips the manual rollbackSuccessful() call.
      // The service-level test verifies that the error from bulkAtomicDecrementStock propagates
      // directly up (no swallowed error or double-compensation).
      mockAddressRepo.findByIdAndUser.mockResolvedValue(mockAddress as any)
      mockProductRepo.findById.mockResolvedValue(mockProduct as any)
      mockSkuRepo.findById.mockResolvedValue(mockSku as any)

      // Simulate the error that would come from inside a transaction — already aborted by Mongoose
      const txError = new BusinessError('SKU không đủ tồn kho')
      mockSkuRepo.bulkAtomicDecrementStock.mockRejectedValue(txError)

      await expect(service.createOrder(userId.toString(), baseInput)).rejects.toThrow(BusinessError)

      // reserveStock wraps the BusinessError with product/SKU context
      // but still throws — order creation must not proceed
      expect(mockOrderRepo.create).not.toHaveBeenCalled()

      // The mock for bulkAtomicDecrementStock was called exactly once —
      // no retry/compensation call was made by the service
      expect(mockSkuRepo.bulkAtomicDecrementStock).toHaveBeenCalledTimes(1)
    })
  })
})
