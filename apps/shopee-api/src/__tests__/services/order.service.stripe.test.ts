/// <reference types="jest" />
import { Types } from 'mongoose'
import { OrderService, CreateOrderInput } from '@services/order.service'
import { IOrderRepository } from '@repositories/interfaces/order.repository.interface'
import { IProductRepository } from '@repositories/interfaces/product.repository.interface'
import { IAddressRepository } from '@repositories/interfaces/address.repository.interface'
import { IPurchaseRepository } from '@repositories/interfaces/purchase.repository.interface'
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '@database/models/order.model'
import { BusinessError } from '@services/base.service'

// Mock the container so that order.service.ts picks up our mock stripeService
// when it does `import { stripeService } from '../container'`
jest.mock('../../container', () => ({
  stripeService: {
    createPaymentIntent: jest.fn(),
    cancelPaymentIntent: jest.fn(),
  },
}))

// Mock the transaction helper — runs the callback synchronously with a fake session
jest.mock('../../utils/transaction.helper', () => ({
  withTransaction: jest.fn().mockImplementation(async (fn) => {
    const mockSession = {}
    return fn(mockSession)
  }),
}))

// Mock OrderModel used inside createOrder for the Stripe update
jest.mock('@database/models/order.model', () => ({
  OrderModel: {
    findByIdAndUpdate: jest.fn(),
  },
  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPING: 'shipping',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    RETURNED: 'returned',
  },
  PAYMENT_METHOD: {
    COD: 'cod',
    BANK_TRANSFER: 'bank_transfer',
    E_WALLET: 'e_wallet',
    CREDIT_CARD: 'credit_card',
  },
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded',
  },
}))

import { stripeService } from '../../container'
import { OrderModel } from '@database/models/order.model'

const mockStripeService = stripeService as jest.Mocked<typeof stripeService>
const mockOrderModelFindByIdAndUpdate = OrderModel.findByIdAndUpdate as jest.Mock

// ─── Repository mocks (constructor-injected, matching order.service.test.ts pattern) ─

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
  incrementSold: jest.fn(),
} as unknown as jest.Mocked<IProductRepository>

const mockAddressRepository = {
  findByIdAndUser: jest.fn(),
} as unknown as jest.Mocked<IAddressRepository>

const mockPurchaseRepository = {
  deleteManyByUserAndProducts: jest.fn(),
} as unknown as jest.Mocked<IPurchaseRepository>

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const userId = new Types.ObjectId()
const orderId = new Types.ObjectId()
const addressId = new Types.ObjectId()
const productId = new Types.ObjectId()

const mockAddress = {
  full_name: 'Test User',
  phone: '0123456789',
  province: 'HN',
  district: 'D1',
  ward: 'W1',
  street: '123 St',
}

const mockProduct = {
  _id: productId,
  name: 'Test Product',
  price: 150000,
  price_before_discount: 180000,
  quantity: 10,
  sold: 0,
}

const creditCardInput: CreateOrderInput = {
  items: [{ product_id: productId.toString(), buy_count: 1 }],
  shipping_address_id: addressId.toString(),
  shipping_method_id: 'standard',
  payment_method: PAYMENT_METHOD.CREDIT_CARD,
}

const codInput: CreateOrderInput = {
  items: [{ product_id: productId.toString(), buy_count: 1 }],
  shipping_address_id: addressId.toString(),
  shipping_method_id: 'standard',
  payment_method: PAYMENT_METHOD.COD,
}

describe('OrderService — Stripe branches', () => {
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

  // ─── 3.2 createOrder with credit_card calls stripeService.createPaymentIntent ─

  describe('createOrder with payment_method=credit_card', () => {
    it('calls stripeService.createPaymentIntent with (order.total, "vnd", { orderId, userId })', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress as any)
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      mockProductRepository.bulkUpdateStock.mockResolvedValue(1)
      mockPurchaseRepository.deleteManyByUserAndProducts.mockResolvedValue(1)

      // order.total = price(150000) + shipping(30000) = 180000
      const createdOrder = {
        _id: orderId,
        user: userId,
        total: 180000,
        payment_method: PAYMENT_METHOD.CREDIT_CARD,
        status: ORDER_STATUS.PENDING,
        toObject: jest.fn().mockReturnValue({
          _id: orderId,
          user: userId,
          total: 180000,
          payment_method: PAYMENT_METHOD.CREDIT_CARD,
          status: ORDER_STATUS.PENDING,
        }),
      }
      mockOrderRepository.create.mockResolvedValue(createdOrder as any)

      mockStripeService.createPaymentIntent.mockResolvedValue({
        clientSecret: 'pi_test_secret',
        paymentIntentId: 'pi_test_id',
      })
      mockOrderModelFindByIdAndUpdate.mockResolvedValue({})

      await service.createOrder(userId.toString(), creditCardInput)

      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(180000, 'vnd', {
        orderId: orderId.toString(),
        userId: userId.toString(),
      })
    })

    // ─── 3.3 createOrder returns order with client_secret ──────────────────

    it('updates order with stripe_payment_intent_id and stripe_client_secret, returns order with client_secret', async () => {
      mockAddressRepository.findByIdAndUser.mockResolvedValue(mockAddress as any)
      mockProductRepository.findById.mockResolvedValue(mockProduct as any)
      mockProductRepository.bulkUpdateStock.mockResolvedValue(1)
      mockPurchaseRepository.deleteManyByUserAndProducts.mockResolvedValue(1)

      const createdOrder = {
        _id: orderId,
        user: userId,
        total: 180000,
        payment_method: PAYMENT_METHOD.CREDIT_CARD,
        status: ORDER_STATUS.PENDING,
        toObject: jest.fn().mockReturnValue({
          _id: orderId,
          user: userId,
          total: 180000,
          payment_method: PAYMENT_METHOD.CREDIT_CARD,
          status: ORDER_STATUS.PENDING,
        }),
      }
      mockOrderRepository.create.mockResolvedValue(createdOrder as any)

      mockStripeService.createPaymentIntent.mockResolvedValue({
        clientSecret: 'pi_test_secret_abc',
        paymentIntentId: 'pi_test_id_abc',
      })
      mockOrderModelFindByIdAndUpdate.mockResolvedValue({})

      const result = await service.createOrder(userId.toString(), creditCardInput)

      // OrderModel.findByIdAndUpdate called with stripe fields
      expect(mockOrderModelFindByIdAndUpdate).toHaveBeenCalledWith(orderId, {
        stripe_payment_intent_id: 'pi_test_id_abc',
        stripe_client_secret: 'pi_test_secret_abc',
      })

      // Returned order includes client_secret
      expect(result).toMatchObject({
        client_secret: 'pi_test_secret_abc',
      })
    })
  })

  // ─── 3.4 cancelOrder for credit_card with PENDING calls cancelPaymentIntent ─

  describe('cancelOrder — credit_card with PENDING payment', () => {
    it('calls stripeService.cancelPaymentIntent with the order stripe_payment_intent_id', async () => {
      const mockOrder = {
        _id: orderId,
        status: ORDER_STATUS.PENDING,
        payment_method: PAYMENT_METHOD.CREDIT_CARD,
        payment_status: PAYMENT_STATUS.PENDING,
        stripe_payment_intent_id: 'pi_to_cancel',
        items: [{ product: productId, buy_count: 1 }],
      }

      mockOrderRepository.findByIdAndUser.mockResolvedValue(mockOrder as any)
      mockProductRepository.bulkUpdateStock.mockResolvedValue(1)
      mockOrderRepository.updateStatus.mockResolvedValue({
        ...mockOrder,
        status: ORDER_STATUS.CANCELLED,
      } as any)
      mockStripeService.cancelPaymentIntent.mockResolvedValue({
        id: 'pi_to_cancel',
        status: 'canceled',
      } as any)

      await service.cancelOrder(userId.toString(), orderId.toString(), 'Changed mind')

      expect(mockStripeService.cancelPaymentIntent).toHaveBeenCalledWith('pi_to_cancel')
    })

    // ─── 3.5 cancelOrder proceeds even when cancelPaymentIntent throws ──────

    it('proceeds to CANCELLED even when stripeService.cancelPaymentIntent throws (graceful degradation)', async () => {
      const mockOrder = {
        _id: orderId,
        status: ORDER_STATUS.PENDING,
        payment_method: PAYMENT_METHOD.CREDIT_CARD,
        payment_status: PAYMENT_STATUS.PENDING,
        stripe_payment_intent_id: 'pi_already_expired',
        items: [{ product: productId, buy_count: 1 }],
      }

      mockOrderRepository.findByIdAndUser.mockResolvedValue(mockOrder as any)
      mockProductRepository.bulkUpdateStock.mockResolvedValue(1)
      mockOrderRepository.updateStatus.mockResolvedValue({
        ...mockOrder,
        status: ORDER_STATUS.CANCELLED,
        payment_status: PAYMENT_STATUS.FAILED,
      } as any)
      // Simulate Stripe error (e.g., PaymentIntent already cancelled or expired)
      mockStripeService.cancelPaymentIntent.mockRejectedValue(
        new Error('PaymentIntent has already been canceled'),
      )

      // Should NOT throw — graceful degradation
      const result = await service.cancelOrder(userId.toString(), orderId.toString(), 'reason')

      expect(result.status).toBe(ORDER_STATUS.CANCELLED)
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith(
        orderId.toString(),
        ORDER_STATUS.CANCELLED,
        expect.objectContaining({ payment_status: PAYMENT_STATUS.FAILED }),
      )
    })
  })

  // ─── 3.6 cancelOrder for COD does NOT call cancelPaymentIntent ───────────

  describe('cancelOrder — COD order', () => {
    it('does NOT call stripeService.cancelPaymentIntent for a COD order', async () => {
      const mockOrder = {
        _id: orderId,
        status: ORDER_STATUS.PENDING,
        payment_method: PAYMENT_METHOD.COD,
        payment_status: PAYMENT_STATUS.PENDING,
        stripe_payment_intent_id: null,
        items: [{ product: productId, buy_count: 1 }],
      }

      mockOrderRepository.findByIdAndUser.mockResolvedValue(mockOrder as any)
      mockProductRepository.bulkUpdateStock.mockResolvedValue(1)
      mockOrderRepository.updateStatus.mockResolvedValue({
        ...mockOrder,
        status: ORDER_STATUS.CANCELLED,
        payment_status: PAYMENT_STATUS.FAILED,
      } as any)

      const result = await service.cancelOrder(userId.toString(), orderId.toString())

      expect(mockStripeService.cancelPaymentIntent).not.toHaveBeenCalled()
      expect(result.status).toBe(ORDER_STATUS.CANCELLED)
    })
  })
})
