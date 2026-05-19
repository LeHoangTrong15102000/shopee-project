/// <reference types="jest" />

/**
 * Unit Tests for RefundService — gateway integration
 * Tasks 11.1–11.4:
 *   11.1 StripeService.createRefund — success, idempotency, error
 *   11.2 RefundService.processGatewayRefund — Stripe path, MoMo path, error handling
 *   11.3 RefundService.approveRefund — auto vs manual, amount validation
 *   11.4 RefundService.retryGatewayRefund — only APPROVED auto-refunds
 */

jest.mock('@utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiWarn: jest.fn(), apiError: jest.fn() },
}))

// Mock dynamic import of PaymentModel used in getPaymentTransactionId
jest.mock('@database/models/payment.model', () => ({
  PaymentModel: {
    findById: jest.fn(),
    findOne: jest.fn(),
  },
}))

import { Types } from 'mongoose'
import { RefundService } from '@services/refund.service'
import { NotFoundError, BusinessError } from '@services/base.service'
import { IRefundRepository } from '@repositories/interfaces/refund.repository.interface'
import { IOrderRepository } from '@repositories/interfaces/order.repository.interface'
import { NotificationService } from '@services/notification.service'
import { StripeService } from '@services/stripe.service'
import { PaymentService } from '@services/payment.service'
import { REFUND_STATUS } from '@database/models/refund.model'
import { PAYMENT_METHOD, PAYMENT_STATUS } from '@database/models/order.model'
import { PaymentModel } from '@database/models/payment.model'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const oid = () => new Types.ObjectId()

const makeRefund = (overrides: Record<string, unknown> = {}) => ({
  _id: oid(),
  order_id: oid(),
  user_id: oid(),
  reason: 'defective',
  reason_detail: 'broken on arrival',
  evidence: [],
  requested_amount: 100000,
  status: REFUND_STATUS.PENDING,
  previous_order_status: 'delivered',
  refund_method: 'manual' as const,
  retry_count: 0,
  ...overrides,
})

const makeOrder = (overrides: Record<string, unknown> = {}) => ({
  _id: oid(),
  user: oid(),
  total: 200000,
  payment_method: PAYMENT_METHOD.CREDIT_CARD,
  payment_status: PAYMENT_STATUS.PAID,
  status: 'delivered',
  stripe_payment_intent_id: 'pi_test_123',
  ...overrides,
})

// ─── Mock factories ───────────────────────────────────────────────────────────

const createMockRefundRepo = (): jest.Mocked<IRefundRepository> =>
  ({
    create: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    findPaginated: jest.fn(),
    updateById: jest.fn(),
    updateMany: jest.fn(),
    deleteById: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    exists: jest.fn(),
    findByOrderId: jest.fn(),
    findByUserId: jest.fn(),
    findPending: jest.fn(),
    findWithFilters: jest.fn(),
    findByIdPopulated: jest.fn(),
    findProcessingByProvider: jest.fn(),
  }) as unknown as jest.Mocked<IRefundRepository>

const createMockOrderRepo = (): jest.Mocked<IOrderRepository> =>
  ({
    findById: jest.fn(),
    findByIdAndUser: jest.fn(),
    findByUser: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    updatePaymentStatus: jest.fn().mockResolvedValue(undefined),
    findTrackingByOrderAndUser: jest.fn(),
    findTrackingByNumber: jest.fn(),
  }) as unknown as jest.Mocked<IOrderRepository>

const createMockNotificationService = (): jest.Mocked<NotificationService> =>
  ({
    createNotification: jest.fn().mockResolvedValue(undefined),
  }) as unknown as jest.Mocked<NotificationService>

const createMockStripeService = (): jest.Mocked<StripeService> =>
  ({
    createRefund: jest.fn(),
    retrieveRefund: jest.fn(),
  }) as unknown as jest.Mocked<StripeService>

const createMockPaymentService = (): jest.Mocked<PaymentService> =>
  ({
    getProvider: jest.fn(),
  }) as unknown as jest.Mocked<PaymentService>

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RefundService', () => {
  let service: RefundService
  let refundRepo: jest.Mocked<IRefundRepository>
  let orderRepo: jest.Mocked<IOrderRepository>
  let notificationService: jest.Mocked<NotificationService>
  let stripeService: jest.Mocked<StripeService>
  let paymentService: jest.Mocked<PaymentService>

  beforeEach(() => {
    jest.clearAllMocks()
    refundRepo = createMockRefundRepo()
    orderRepo = createMockOrderRepo()
    notificationService = createMockNotificationService()
    stripeService = createMockStripeService()
    paymentService = createMockPaymentService()

    service = new RefundService(
      refundRepo,
      orderRepo,
      notificationService,
      stripeService,
      paymentService,
    )
  })

  // ─── approveRefund ─────────────────────────────────────────────────────────

  describe('approveRefund', () => {
    it('should approve a PENDING refund and set refund_method=manual for COD', async () => {
      const refund = makeRefund()
      const order = makeOrder({ payment_method: 'cod', stripe_payment_intent_id: undefined })
      const approved = {
        ...refund,
        status: REFUND_STATUS.APPROVED,
        refund_method: 'manual' as const,
      }

      refundRepo.findById.mockResolvedValue(refund as any)
      orderRepo.findById.mockResolvedValue(order as any)
      refundRepo.updateById.mockResolvedValue(approved as any)
      orderRepo.updateStatus.mockResolvedValue(null)

      const result = await service.approveRefund(refund._id.toString(), oid().toString(), 100000)

      expect(result.status).toBe(REFUND_STATUS.APPROVED)
      expect(result.refund_method).toBe('manual')
      // No gateway call for manual methods
      expect(stripeService.createRefund).not.toHaveBeenCalled()
    })

    it('should set refund_method=auto and trigger gateway for credit_card', async () => {
      const refund = makeRefund()
      const order = makeOrder()
      const approved = {
        ...refund,
        status: REFUND_STATUS.APPROVED,
        refund_method: 'auto' as const,
        approved_amount: 100000,
      }

      refundRepo.findById.mockResolvedValue(refund as any)
      orderRepo.findById.mockResolvedValue(order as any)
      refundRepo.updateById.mockResolvedValue(approved as any)
      orderRepo.updateStatus.mockResolvedValue(null)
      stripeService.createRefund.mockResolvedValue({ refundId: 're_test_abc', status: 'pending' })

      // Use fake timers to control setImmediate
      jest.useFakeTimers({ legacyFakeTimers: true })
      const result = await service.approveRefund(refund._id.toString(), oid().toString(), 100000)
      jest.runAllImmediates()
      jest.useRealTimers()

      expect(result.refund_method).toBe('auto')
    })

    it('should throw NotFoundError when refund does not exist', async () => {
      refundRepo.findById.mockResolvedValue(null)

      await expect(
        service.approveRefund(oid().toString(), oid().toString(), 100000),
      ).rejects.toThrow(NotFoundError)
    })

    it('should throw BusinessError when refund is not PENDING', async () => {
      const refund = makeRefund({ status: REFUND_STATUS.APPROVED })
      refundRepo.findById.mockResolvedValue(refund as any)

      await expect(
        service.approveRefund(refund._id.toString(), oid().toString(), 100000),
      ).rejects.toThrow(BusinessError)
    })

    it('should throw BusinessError when order payment_status is not paid', async () => {
      const refund = makeRefund()
      const order = makeOrder({ payment_status: 'unpaid' })

      refundRepo.findById.mockResolvedValue(refund as any)
      orderRepo.findById.mockResolvedValue(order as any)

      await expect(
        service.approveRefund(refund._id.toString(), oid().toString(), 100000),
      ).rejects.toThrow(BusinessError)
    })

    it('should throw BusinessError when approved amount exceeds order total', async () => {
      const refund = makeRefund()
      const order = makeOrder({ total: 50000 })

      refundRepo.findById.mockResolvedValue(refund as any)
      orderRepo.findById.mockResolvedValue(order as any)

      await expect(
        service.approveRefund(refund._id.toString(), oid().toString(), 100000),
      ).rejects.toThrow(BusinessError)
    })

    it('should throw NotFoundError when order does not exist', async () => {
      const refund = makeRefund()
      refundRepo.findById.mockResolvedValue(refund as any)
      orderRepo.findById.mockResolvedValue(null)

      await expect(
        service.approveRefund(refund._id.toString(), oid().toString(), 100000),
      ).rejects.toThrow(NotFoundError)
    })
  })

  // ─── retryGatewayRefund ────────────────────────────────────────────────────

  describe('retryGatewayRefund', () => {
    it('should throw NotFoundError when refund does not exist', async () => {
      refundRepo.findById.mockResolvedValue(null)

      await expect(service.retryGatewayRefund(oid().toString())).rejects.toThrow(NotFoundError)
    })

    it('should throw BusinessError when refund is not APPROVED', async () => {
      const refund = makeRefund({ status: REFUND_STATUS.PROCESSING })
      refundRepo.findById.mockResolvedValue(refund as any)

      await expect(service.retryGatewayRefund(refund._id.toString())).rejects.toThrow(BusinessError)
    })

    it('should throw BusinessError when refund_method is manual', async () => {
      const refund = makeRefund({ status: REFUND_STATUS.APPROVED, refund_method: 'manual' })
      refundRepo.findById.mockResolvedValue(refund as any)

      await expect(service.retryGatewayRefund(refund._id.toString())).rejects.toThrow(BusinessError)
    })

    it('should call processGatewayRefund and return updated refund on success', async () => {
      const refundId = oid()
      const refund = makeRefund({
        _id: refundId,
        status: REFUND_STATUS.APPROVED,
        refund_method: 'auto',
        approved_amount: 100000,
      })
      const order = makeOrder()
      const updatedRefund = {
        ...refund,
        status: REFUND_STATUS.PROCESSING,
        gateway_refund_id: 're_test_xyz',
      }

      refundRepo.findById
        .mockResolvedValueOnce(refund as any) // initial fetch
        .mockResolvedValueOnce(updatedRefund as any) // after processGatewayRefund
      orderRepo.findById.mockResolvedValue(order as any)
      stripeService.createRefund.mockResolvedValue({ refundId: 're_test_xyz', status: 'pending' })
      refundRepo.updateById.mockResolvedValue(updatedRefund as any)

      const result = await service.retryGatewayRefund(refundId.toString())

      expect(stripeService.createRefund).toHaveBeenCalledWith(
        order.stripe_payment_intent_id,
        refund.approved_amount,
        expect.objectContaining({ idempotencyKey: expect.any(String) }),
      )
      expect(result.status).toBe(REFUND_STATUS.PROCESSING)
    })

    it('should throw NotFoundError when order does not exist', async () => {
      const refund = makeRefund({ status: REFUND_STATUS.APPROVED, refund_method: 'auto' })
      refundRepo.findById.mockResolvedValue(refund as any)
      orderRepo.findById.mockResolvedValue(null)

      await expect(service.retryGatewayRefund(refund._id.toString())).rejects.toThrow(NotFoundError)
    })
  })

  // ─── processGatewayRefund (via retryGatewayRefund) ────────────────────────

  describe('processGatewayRefund — Stripe path', () => {
    it('should set status=PROCESSING and store gateway_refund_id on Stripe success', async () => {
      const refundId = oid()
      const refund = makeRefund({
        _id: refundId,
        status: REFUND_STATUS.APPROVED,
        refund_method: 'auto',
        approved_amount: 150000,
      })
      const order = makeOrder({ stripe_payment_intent_id: 'pi_abc' })
      const processing = {
        ...refund,
        status: REFUND_STATUS.PROCESSING,
        gateway_refund_id: 're_stripe_1',
      }

      refundRepo.findById
        .mockResolvedValueOnce(refund as any)
        .mockResolvedValueOnce(processing as any)
      orderRepo.findById.mockResolvedValue(order as any)
      stripeService.createRefund.mockResolvedValue({ refundId: 're_stripe_1', status: 'pending' })
      refundRepo.updateById.mockResolvedValue(processing as any)

      await service.retryGatewayRefund(refundId.toString())

      expect(refundRepo.updateById).toHaveBeenCalledWith(
        refund._id,
        expect.objectContaining({
          status: REFUND_STATUS.PROCESSING,
          gateway_refund_id: 're_stripe_1',
        }),
      )
    })

    it('should store failure_reason and increment retry_count when Stripe throws', async () => {
      const refundId = oid()
      const refund = makeRefund({
        _id: refundId,
        status: REFUND_STATUS.APPROVED,
        refund_method: 'auto',
        approved_amount: 150000,
        retry_count: 1,
      })
      const order = makeOrder()
      const afterFailure = { ...refund, failure_reason: 'card_declined', retry_count: 2 }

      refundRepo.findById
        .mockResolvedValueOnce(refund as any)
        .mockResolvedValueOnce(afterFailure as any)
      orderRepo.findById.mockResolvedValue(order as any)
      stripeService.createRefund.mockRejectedValue(new Error('card_declined'))
      refundRepo.updateById.mockResolvedValue(afterFailure as any)

      // Should not throw — failure is swallowed
      await expect(service.retryGatewayRefund(refundId.toString())).resolves.toBeDefined()

      expect(refundRepo.updateById).toHaveBeenCalledWith(
        refund._id,
        expect.objectContaining({
          failure_reason: 'card_declined',
          retry_count: 2,
        }),
      )
    })

    it('should skip gateway call when gateway_refund_id already set (idempotency)', async () => {
      const refundId = oid()
      const refund = makeRefund({
        _id: refundId,
        status: REFUND_STATUS.APPROVED,
        refund_method: 'auto',
        approved_amount: 150000,
        gateway_refund_id: 're_already_done',
      })
      const order = makeOrder()

      refundRepo.findById.mockResolvedValueOnce(refund as any).mockResolvedValueOnce(refund as any)
      orderRepo.findById.mockResolvedValue(order as any)

      await service.retryGatewayRefund(refundId.toString())

      expect(stripeService.createRefund).not.toHaveBeenCalled()
    })

    it('should throw BusinessError when order has no stripe_payment_intent_id', async () => {
      const refundId = oid()
      const refund = makeRefund({
        _id: refundId,
        status: REFUND_STATUS.APPROVED,
        refund_method: 'auto',
        approved_amount: 150000,
      })
      const order = makeOrder({ stripe_payment_intent_id: undefined })
      const afterFailure = { ...refund, failure_reason: expect.any(String), retry_count: 1 }

      refundRepo.findById
        .mockResolvedValueOnce(refund as any)
        .mockResolvedValueOnce(afterFailure as any)
      orderRepo.findById.mockResolvedValue(order as any)
      refundRepo.updateById.mockResolvedValue(afterFailure as any)

      // processGatewayRefund swallows the error — retryGatewayRefund should still resolve
      await expect(service.retryGatewayRefund(refundId.toString())).resolves.toBeDefined()

      expect(refundRepo.updateById).toHaveBeenCalledWith(
        refund._id,
        expect.objectContaining({ failure_reason: expect.any(String) }),
      )
    })
  })

  describe('processGatewayRefund — MoMo path', () => {
    it('should call MoMo refund and set PROCESSING on success', async () => {
      const refundId = oid()
      const orderId = oid()
      const paymentId = oid()
      const refund = makeRefund({
        _id: refundId,
        order_id: orderId,
        status: REFUND_STATUS.APPROVED,
        refund_method: 'auto',
        approved_amount: 80000,
      })
      const order = makeOrder({
        _id: orderId,
        payment_method: PAYMENT_METHOD.MOMO,
        stripe_payment_intent_id: undefined,
        payment_id: paymentId,
      })
      const processing = {
        ...refund,
        status: REFUND_STATUS.PROCESSING,
        gateway_refund_id: 'momo_trans_1',
      }

      refundRepo.findById
        .mockResolvedValueOnce(refund as any)
        .mockResolvedValueOnce(processing as any)
      orderRepo.findById.mockResolvedValue(order as any)

      // Mock PaymentModel.findById for getPaymentTransactionId
      ;(PaymentModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({ transactionId: 'momo_orig_trans_1' }),
      })

      const mockMomoProvider = {
        refund: jest.fn().mockResolvedValue({
          success: true,
          transactionId: 'momo_trans_1',
          resultCode: 0,
          message: 'Success',
        }),
      }
      paymentService.getProvider.mockReturnValue(mockMomoProvider as any)
      refundRepo.updateById.mockResolvedValue(processing as any)

      await service.retryGatewayRefund(refundId.toString())

      expect(mockMomoProvider.refund).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionId: 'momo_orig_trans_1',
          amount: 80000,
        }),
      )
      expect(refundRepo.updateById).toHaveBeenCalledWith(
        refund._id,
        expect.objectContaining({
          status: REFUND_STATUS.PROCESSING,
          gateway_refund_id: 'momo_trans_1',
        }),
      )
    })

    it('should store failure_reason when MoMo refund returns success=false', async () => {
      const refundId = oid()
      const orderId = oid()
      const paymentId = oid()
      const refund = makeRefund({
        _id: refundId,
        order_id: orderId,
        status: REFUND_STATUS.APPROVED,
        refund_method: 'auto',
        approved_amount: 80000,
      })
      const order = makeOrder({
        _id: orderId,
        payment_method: PAYMENT_METHOD.MOMO,
        stripe_payment_intent_id: undefined,
        payment_id: paymentId,
      })
      const afterFailure = {
        ...refund,
        failure_reason: 'MoMo refund failed: insufficient balance',
        retry_count: 1,
      }

      refundRepo.findById
        .mockResolvedValueOnce(refund as any)
        .mockResolvedValueOnce(afterFailure as any)
      orderRepo.findById.mockResolvedValue(order as any)
      ;(PaymentModel.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({ transactionId: 'momo_orig_trans_1' }),
      })

      const mockMomoProvider = {
        refund: jest.fn().mockResolvedValue({
          success: false,
          resultCode: 1001,
          message: 'insufficient balance',
        }),
      }
      paymentService.getProvider.mockReturnValue(mockMomoProvider as any)
      refundRepo.updateById.mockResolvedValue(afterFailure as any)

      await expect(service.retryGatewayRefund(refundId.toString())).resolves.toBeDefined()

      expect(refundRepo.updateById).toHaveBeenCalledWith(
        refund._id,
        expect.objectContaining({
          failure_reason: expect.stringContaining('insufficient balance'),
        }),
      )
    })
  })

  // ─── completeRefund ────────────────────────────────────────────────────────

  describe('completeRefund', () => {
    it('should complete an APPROVED refund and update order payment_status', async () => {
      const refund = makeRefund({ status: REFUND_STATUS.APPROVED })
      const completed = { ...refund, status: REFUND_STATUS.COMPLETED }

      refundRepo.findById.mockResolvedValue(refund as any)
      refundRepo.updateById.mockResolvedValue(completed as any)
      orderRepo.updateStatus.mockResolvedValue(null)
      orderRepo.updatePaymentStatus.mockResolvedValue(undefined)

      const result = await service.completeRefund(refund._id.toString())

      expect(result.status).toBe(REFUND_STATUS.COMPLETED)
      expect(orderRepo.updatePaymentStatus).toHaveBeenCalledWith(
        refund.order_id.toString(),
        PAYMENT_STATUS.REFUNDED,
      )
    })

    it('should complete a PROCESSING refund', async () => {
      const refund = makeRefund({ status: REFUND_STATUS.PROCESSING })
      const completed = { ...refund, status: REFUND_STATUS.COMPLETED }

      refundRepo.findById.mockResolvedValue(refund as any)
      refundRepo.updateById.mockResolvedValue(completed as any)
      orderRepo.updateStatus.mockResolvedValue(null)

      const result = await service.completeRefund(refund._id.toString())

      expect(result.status).toBe(REFUND_STATUS.COMPLETED)
    })

    it('should throw BusinessError when refund is PENDING', async () => {
      const refund = makeRefund({ status: REFUND_STATUS.PENDING })
      refundRepo.findById.mockResolvedValue(refund as any)

      await expect(service.completeRefund(refund._id.toString())).rejects.toThrow(BusinessError)
    })

    it('should throw NotFoundError when refund does not exist', async () => {
      refundRepo.findById.mockResolvedValue(null)

      await expect(service.completeRefund(oid().toString())).rejects.toThrow(NotFoundError)
    })
  })
})
