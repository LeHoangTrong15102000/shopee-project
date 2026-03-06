/// <reference types="jest" />
import { Types } from 'mongoose'
import { OrderService, CreateOrderInput } from '@services/order.service'
import { IOrderRepository } from '@repositories/interfaces/order.repository.interface'
import { IProductRepository } from '@repositories/interfaces/product.repository.interface'
import { IAddressRepository } from '@repositories/interfaces/address.repository.interface'
import { IPurchaseRepository } from '@repositories/interfaces/purchase.repository.interface'
import { NotFoundError, BusinessError } from '@services/base.service'
import { ORDER_STATUS, PAYMENT_METHOD } from '@database/models/order.model'
import { STATUS_PURCHASE } from '@constants/purchase'

const validObjectId = new Types.ObjectId()

const mockOrderRepository: jest.Mocked<IOrderRepository> = {
  findByUser: jest.fn(),
  findById: jest.fn(),
  findByIdAndUser: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
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
} as unknown as jest.Mocked<IProductRepository>

const mockAddressRepository = {
  findByIdAndUser: jest.fn(),
} as unknown as jest.Mocked<IAddressRepository>

const mockPurchaseRepository = {
  deleteByUserAndProduct: jest.fn(),
} as unknown as jest.Mocked<IPurchaseRepository>

describe('OrderService', () => {
  let service: OrderService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new OrderService(mockOrderRepository, mockProductRepository, mockAddressRepository, mockPurchaseRepository)
  })

  describe('getShippingMethods', () => {
    it('returns array of 3 shipping methods', () => {
      const methods = service.getShippingMethods()
      expect(methods).toHaveLength(3)
      expect(methods.map(m => m.id)).toEqual(['standard', 'express', 'same_day'])
      expect(methods.map(m => m.price)).toEqual([30000, 50000, 80000])
    })
  })

  describe('getPaymentMethods', () => {
    it('returns array of 4 payment methods', () => {
      const methods = service.getPaymentMethods()
      expect(methods).toHaveLength(4)
      expect(methods.map(m => m.id)).toEqual([PAYMENT_METHOD.COD, PAYMENT_METHOD.BANK_TRANSFER, PAYMENT_METHOD.E_WALLET, PAYMENT_METHOD.CREDIT_CARD])
    })
  })

  describe('createOrder', () => {
    const mockAddress = { full_name: 'Test', phone: '0123456789', province: 'HN', district: 'D1', ward: 'W1', street: '123 St' }
    const mockProduct = { _id: validObjectId, name: 'Product', price: 100000, price_before_discount: 120000, quantity: 10, sold: 5 }
    const input: CreateOrderInput = {
      items: [{ product_id: validObjectId.toString(), buy_count: 2 }],
      shipping_address_id: validObjectId.toString(),
      shipping_method_id: 'standard',
      payment_method: PAYMENT_METHOD.COD,
    }

    it('creates order successfully', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress as any)
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      mockOrderRepository.create.mockResolvedValue({ _id: validObjectId, status: ORDER_STATUS.PENDING } as any)
      mockProductRepository.bulkUpdateStock.mockResolvedValue(1)
      mockPurchaseRepository.deleteByUserAndProduct.mockResolvedValue(1)

      const result = await service.createOrder(validObjectId.toString(), input)

      expect(result).toBeDefined()
      expect(mockProductRepository.bulkUpdateStock).toHaveBeenCalledWith([{ product_id: validObjectId.toString(), quantity_change: -2, sold_change: 2 }])
      expect(mockPurchaseRepository.deleteByUserAndProduct).toHaveBeenCalledWith(validObjectId.toString(), validObjectId.toString(), STATUS_PURCHASE.IN_CART)
    })

    it('throws NotFoundError when address not found', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(null)
      await expect(service.createOrder(validObjectId.toString(), input)).rejects.toThrow(NotFoundError)
    })

    it('throws BusinessError for invalid shipping method', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress as any)
      await expect(service.createOrder(validObjectId.toString(), { ...input, shipping_method_id: 'invalid' })).rejects.toThrow(BusinessError)
    })

    it('throws NotFoundError when product not found', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress as any)
      mockProductRepository.findById.mockResolvedValue(null)
      await expect(service.createOrder(validObjectId.toString(), input)).rejects.toThrow(NotFoundError)
    })

    it('throws BusinessError for insufficient stock', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress as any)
      mockProductRepository.findById.mockResolvedValue({ ...mockProduct, quantity: 1 } as any)
      await expect(service.createOrder(validObjectId.toString(), input)).rejects.toThrow(BusinessError)
    })
  })

  describe('getOrders', () => {
    it('returns paginated results', async () => {
      const mockResult = { data: [], pagination: { page: 1, limit: 10, page_size: 1, total: 0 } }
      mockOrderRepository.findByUser.mockResolvedValue(mockResult)
      const result = await service.getOrders(validObjectId.toString(), 'all', { page: 1, limit: 10 })
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
      await expect(service.getOrderById(validObjectId.toString(), validObjectId.toString())).rejects.toThrow(NotFoundError)
    })
  })

  describe('cancelOrder', () => {
    const mockOrder = { _id: validObjectId, status: ORDER_STATUS.PENDING, items: [{ product: validObjectId, buy_count: 2 }] }

    it('cancels order with PENDING status', async () => {
      mockOrderRepository.findByIdAndUser.mockResolvedValue(mockOrder as any)
      mockProductRepository.findById.mockResolvedValue({ quantity: 10, sold: 5 } as any)
      mockProductRepository.updateById.mockResolvedValue({} as any)
      mockOrderRepository.updateStatus.mockResolvedValue({ ...mockOrder, status: ORDER_STATUS.CANCELLED } as any)

      const result = await service.cancelOrder(validObjectId.toString(), validObjectId.toString(), 'reason')
      expect(result.status).toBe(ORDER_STATUS.CANCELLED)
    })

    it('throws BusinessError for non-cancellable status', async () => {
      mockOrderRepository.findByIdAndUser.mockResolvedValue({ ...mockOrder, status: ORDER_STATUS.SHIPPING } as any)
      await expect(service.cancelOrder(validObjectId.toString(), validObjectId.toString())).rejects.toThrow(BusinessError)
    })
  })

  describe('confirmReceived', () => {
    it('confirms received when status is SHIPPING', async () => {
      mockOrderRepository.findByIdAndUser.mockResolvedValue({ _id: validObjectId, status: ORDER_STATUS.SHIPPING } as any)
      mockOrderRepository.updateStatus.mockResolvedValue({ _id: validObjectId, status: ORDER_STATUS.DELIVERED } as any)
      const result = await service.confirmReceived(validObjectId.toString(), validObjectId.toString())
      expect(result.status).toBe(ORDER_STATUS.DELIVERED)
    })

    it('throws BusinessError when status is not SHIPPING', async () => {
      mockOrderRepository.findByIdAndUser.mockResolvedValue({ _id: validObjectId, status: ORDER_STATUS.PENDING } as any)
      await expect(service.confirmReceived(validObjectId.toString(), validObjectId.toString())).rejects.toThrow(BusinessError)
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
      await expect(service.getTracking(validObjectId.toString(), validObjectId.toString())).rejects.toThrow(NotFoundError)
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

