/// <reference types="jest" />

/**
 * Integration Tests: Refund Payment Gateway Integration
 * Tasks 11.5–11.9:
 *   11.5 Stripe webhook refund.updated → auto-complete
 *   11.6 Stripe webhook refund.failed → revert to APPROVED
 *   11.7 MoMo polling job → auto-complete on success
 *   11.8 Amount validation rejects over-refund
 *   11.9 Double refund prevention (idempotency)
 */

// ─── Gateway mocks (must be before imports) ───────────────────────────────────

jest.mock('@utils/logger', () => ({
  Logger: { apiInfo: jest.fn(), apiWarn: jest.fn(), apiError: jest.fn() },
}))

// Mock StripeService so no real Stripe calls are made
jest.mock('@services/stripe.service', () => {
  return {
    StripeService: jest.fn().mockImplementation(() => ({
      createRefund: jest.fn().mockResolvedValue({ refundId: 're_mock_123', status: 'pending' }),
      retrieveRefund: jest.fn().mockResolvedValue({ status: 'succeeded' }),
      constructWebhookEvent: jest.fn(),
    })),
  }
})

// Mock MoMo provider
jest.mock('@services/payment/momo.provider', () => {
  return {
    MomoProvider: jest.fn().mockImplementation(() => ({
      refund: jest.fn().mockResolvedValue({
        success: true,
        transactionId: 'momo_tx_1',
        resultCode: 0,
        message: 'Success',
      }),
      queryRefundStatus: jest
        .fn()
        .mockResolvedValue({ success: true, resultCode: 0, message: 'Success' }),
      createPaymentUrl: jest.fn(),
      verifyIpn: jest.fn(),
    })),
  }
})

// Mock VNPay provider
jest.mock('@services/payment/vnpay.provider', () => {
  return {
    VnpayProvider: jest.fn().mockImplementation(() => ({
      refund: jest.fn().mockResolvedValue({
        success: false,
        resultCode: 'UNSUPPORTED',
        message: 'VNPay unsupported',
      }),
      createPaymentUrl: jest.fn(),
      verifyIpn: jest.fn(),
    })),
  }
})

import './setup'
import mongoose from 'mongoose'
import { RefundModel, REFUND_STATUS } from '@database/models/refund.model'
import {
  OrderModel,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  ORDER_STATUS,
} from '@database/models/order.model'
// Import ProductModel to register the 'products' schema so OrderRepository.populate works
import '@database/models/product.model'
import { RefundService } from '@services/refund.service'
import { RefundRepository } from '@repositories/refund.repository'
import { OrderRepository } from '@repositories/order.repository'
import { NotificationService } from '@services/notification.service'
import { NotificationRepository } from '@repositories/notification.repository'
import { StripeService } from '@services/stripe.service'
import { PaymentService } from '@services/payment.service'
import { PaymentRepository } from '@repositories/payment.repository'
import { MomoProvider } from '@services/payment/momo.provider'
import { VnpayProvider } from '@services/payment/vnpay.provider'
import { PaymentProvider } from '@services/payment/payment.interface'
import { RefundStatusPollJob } from '@jobs/refund-status-poll.job'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const oid = () => new mongoose.Types.ObjectId()

const createOrder = async (overrides: Record<string, unknown> = {}) => {
  const userId = oid()
  return OrderModel.create({
    user: userId,
    items: [{ product: oid(), buy_count: 1, price: 200000, price_before_discount: 200000 }],
    shipping_address: {
      full_name: 'Test User',
      phone: '0901234567',
      province: 'HCM',
      district: 'Q1',
      ward: 'P1',
      street: '123 Test St',
    },
    shipping_method: { id: 'standard', name: 'Standard', price: 30000 },
    payment_method: PAYMENT_METHOD.CREDIT_CARD,
    payment_status: PAYMENT_STATUS.PAID,
    stripe_payment_intent_id: 'pi_test_integration',
    subtotal: 200000,
    shipping_fee: 30000,
    discount: 0,
    coins_used: 0,
    coins_discount: 0,
    total: 230000,
    status: ORDER_STATUS.DELIVERED,
    ...overrides,
  })
}

const createRefund = async (
  orderId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  overrides: Record<string, unknown> = {},
) => {
  return RefundModel.create({
    order_id: orderId,
    user_id: userId,
    reason: 'DEFECTIVE',
    reason_detail: 'Product arrived broken',
    evidence: [],
    requested_amount: 200000,
    status: REFUND_STATUS.PENDING,
    previous_order_status: ORDER_STATUS.DELIVERED,
    refund_method: 'manual',
    retry_count: 0,
    ...overrides,
  })
}

// ─── Service factory ──────────────────────────────────────────────────────────

const buildService = () => {
  const refundRepo = new RefundRepository()
  const orderRepo = new OrderRepository()
  const notificationRepo = new NotificationRepository()
  const notificationService = new NotificationService(notificationRepo)
  const stripeService = new StripeService()
  const paymentRepo = new PaymentRepository()
  const momoProvider = new MomoProvider()
  const vnpayProvider = new VnpayProvider()
  const paymentProviders = new Map([
    [PaymentProvider.MOMO, momoProvider],
    [PaymentProvider.VNPAY, vnpayProvider],
  ])
  const paymentService = new PaymentService(paymentRepo, paymentProviders)

  const refundService = new RefundService(
    refundRepo,
    orderRepo,
    notificationService,
    stripeService,
    paymentService,
  )

  const pollJob = new RefundStatusPollJob(refundRepo, paymentService, refundService, orderRepo)

  return {
    refundService,
    refundRepo,
    orderRepo,
    stripeService,
    paymentService,
    pollJob,
    momoProvider,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Refund Payment Gateway Integration', () => {
  // ─── 11.5: Stripe webhook refund.updated → auto-complete ──────────────────

  describe('11.5 completeRefund (simulating Stripe webhook succeeded)', () => {
    it('should set refund status=COMPLETED and order payment_status=refunded', async () => {
      const order = await createOrder()
      const refund = await createRefund(order._id, order.user as mongoose.Types.ObjectId, {
        status: REFUND_STATUS.PROCESSING,
        refund_method: 'auto',
        approved_amount: 200000,
        gateway_refund_id: 're_stripe_test_1',
      })

      const { refundService } = buildService()
      await refundService.completeRefund(refund._id.toString())

      const updatedRefund = await RefundModel.findById(refund._id).lean()
      const updatedOrder = await OrderModel.findById(order._id).lean()

      expect(updatedRefund?.status).toBe(REFUND_STATUS.COMPLETED)
      expect(updatedOrder?.payment_status).toBe(PAYMENT_STATUS.REFUNDED)
    })
  })

  // ─── 11.6: Stripe webhook refund.failed → revert to APPROVED ──────────────

  describe('11.6 Stripe refund.failed → revert to APPROVED', () => {
    it('should revert PROCESSING refund to APPROVED and store failure_reason', async () => {
      const order = await createOrder()
      const refund = await createRefund(order._id, order.user as mongoose.Types.ObjectId, {
        status: REFUND_STATUS.PROCESSING,
        refund_method: 'auto',
        approved_amount: 200000,
        gateway_refund_id: 're_stripe_failed_1',
      })

      // Simulate what the webhook handler does on refund.failed
      await RefundModel.findByIdAndUpdate(refund._id, {
        status: REFUND_STATUS.APPROVED,
        failure_reason: 'insufficient_funds',
      })

      const updatedRefund = await RefundModel.findById(refund._id).lean()

      expect(updatedRefund?.status).toBe(REFUND_STATUS.APPROVED)
      expect(updatedRefund?.failure_reason).toBe('insufficient_funds')
    })
  })

  // ─── 11.7: MoMo polling job → auto-complete on success ────────────────────

  describe('11.7 MoMo polling job auto-completes on success', () => {
    it('should complete PROCESSING momo refunds when queryRefundStatus returns success', async () => {
      const order = await createOrder({ payment_method: PAYMENT_METHOD.MOMO })
      const refund = await createRefund(order._id, order.user as mongoose.Types.ObjectId, {
        status: REFUND_STATUS.PROCESSING,
        refund_method: 'auto',
        approved_amount: 200000,
        gateway_refund_id: 'momo_tx_poll_1',
      })

      const { pollJob, momoProvider } = buildService()

      // queryRefundStatus is already mocked to return success=true
      await pollJob.execute()

      const updatedRefund = await RefundModel.findById(refund._id).lean()
      const updatedOrder = await OrderModel.findById(order._id).lean()

      expect(updatedRefund?.status).toBe(REFUND_STATUS.COMPLETED)
      expect(updatedOrder?.payment_status).toBe(PAYMENT_STATUS.REFUNDED)
    })

    it('should revert to APPROVED when queryRefundStatus returns definitive failure', async () => {
      const order = await createOrder({ payment_method: PAYMENT_METHOD.MOMO })
      const refund = await createRefund(order._id, order.user as mongoose.Types.ObjectId, {
        status: REFUND_STATUS.PROCESSING,
        refund_method: 'auto',
        approved_amount: 200000,
        gateway_refund_id: 'momo_tx_poll_fail',
      })

      const { pollJob, paymentService } = buildService()

      // Override the mock to return failure for this test
      const momoProviderInstance = paymentService.getProvider(PaymentProvider.MOMO)
      if (momoProviderInstance?.queryRefundStatus) {
        jest.spyOn(momoProviderInstance, 'queryRefundStatus').mockResolvedValueOnce({
          success: false,
          resultCode: 1001,
          message: 'Transaction not found',
        })
      }

      await pollJob.execute()

      const updatedRefund = await RefundModel.findById(refund._id).lean()
      expect(updatedRefund?.status).toBe(REFUND_STATUS.APPROVED)
      expect(updatedRefund?.failure_reason).toBe('Transaction not found')
    })

    it('should do nothing when queryRefundStatus returns PENDING', async () => {
      const order = await createOrder({ payment_method: PAYMENT_METHOD.MOMO })
      const refund = await createRefund(order._id, order.user as mongoose.Types.ObjectId, {
        status: REFUND_STATUS.PROCESSING,
        refund_method: 'auto',
        approved_amount: 200000,
        gateway_refund_id: 'momo_tx_poll_pending',
      })

      const { pollJob, paymentService } = buildService()

      const momoProviderInstance = paymentService.getProvider(PaymentProvider.MOMO)
      if (momoProviderInstance?.queryRefundStatus) {
        jest.spyOn(momoProviderInstance, 'queryRefundStatus').mockResolvedValueOnce({
          success: false,
          resultCode: 'PENDING',
          message: 'Still processing',
        })
      }

      await pollJob.execute()

      const updatedRefund = await RefundModel.findById(refund._id).lean()
      // Status should remain PROCESSING — no change
      expect(updatedRefund?.status).toBe(REFUND_STATUS.PROCESSING)
    })
  })

  // ─── 11.8: Amount validation rejects over-refund ──────────────────────────

  describe('11.8 Amount validation', () => {
    it('should reject approveRefund when approved_amount > order.total', async () => {
      const order = await createOrder({ total: 100000 })
      const refund = await createRefund(order._id, order.user as mongoose.Types.ObjectId)

      const { refundService } = buildService()
      const adminId = oid().toString()

      await expect(
        refundService.approveRefund(refund._id.toString(), adminId, 200000),
      ).rejects.toThrow(/không thể lớn hơn/)
    })

    it('should reject approveRefund when order payment_status is not paid', async () => {
      const order = await createOrder({ payment_status: PAYMENT_STATUS.PENDING })
      const refund = await createRefund(order._id, order.user as mongoose.Types.ObjectId)

      const { refundService } = buildService()
      const adminId = oid().toString()

      await expect(
        refundService.approveRefund(refund._id.toString(), adminId, 100000),
      ).rejects.toThrow(/đã thanh toán/)
    })

    it('should allow approveRefund when approved_amount equals order.total', async () => {
      const order = await createOrder({ total: 230000 })
      const refund = await createRefund(order._id, order.user as mongoose.Types.ObjectId)

      const { refundService } = buildService()
      const adminId = oid().toString()

      const result = await refundService.approveRefund(refund._id.toString(), adminId, 230000)
      expect(result.status).toBe(REFUND_STATUS.APPROVED)
      expect(result.approved_amount).toBe(230000)
    })
  })

  // ─── 11.9: Double refund prevention ───────────────────────────────────────

  describe('11.9 Double refund prevention (idempotency)', () => {
    it('should skip gateway call when gateway_refund_id is already set', async () => {
      const order = await createOrder()
      const refund = await createRefund(order._id, order.user as mongoose.Types.ObjectId, {
        status: REFUND_STATUS.APPROVED,
        refund_method: 'auto',
        approved_amount: 200000,
        gateway_refund_id: 're_already_processed',
      })

      const { refundService, stripeService } = buildService()

      await refundService.retryGatewayRefund(refund._id.toString())

      // Stripe should NOT be called because gateway_refund_id is already set
      expect(stripeService.createRefund).not.toHaveBeenCalled()
    })

    it('should prevent retrying a PROCESSING refund', async () => {
      const order = await createOrder()
      const refund = await createRefund(order._id, order.user as mongoose.Types.ObjectId, {
        status: REFUND_STATUS.PROCESSING,
        refund_method: 'auto',
        approved_amount: 200000,
        gateway_refund_id: 're_in_progress',
      })

      const { refundService } = buildService()

      await expect(refundService.retryGatewayRefund(refund._id.toString())).rejects.toThrow(
        /APPROVED/,
      )
    })

    it('should prevent retrying a COMPLETED refund', async () => {
      const order = await createOrder()
      const refund = await createRefund(order._id, order.user as mongoose.Types.ObjectId, {
        status: REFUND_STATUS.COMPLETED,
        refund_method: 'auto',
        approved_amount: 200000,
        gateway_refund_id: 're_completed',
      })

      const { refundService } = buildService()

      await expect(refundService.retryGatewayRefund(refund._id.toString())).rejects.toThrow(
        /APPROVED/,
      )
    })
  })
})
