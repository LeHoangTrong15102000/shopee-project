/// <reference types="jest" />
import { Request, Response } from 'express'

// Mock the container to provide a controlled stripeService
jest.mock('../../container', () => ({
  stripeService: {
    constructWebhookEvent: jest.fn(),
  },
}))

// Mock the Mongoose models — we control their static methods
jest.mock('@database/models/order.model', () => ({
  OrderModel: {
    findByIdAndUpdate: jest.fn(),
    findById: jest.fn(),
  },
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded',
  },
}))

jest.mock('@database/models/payment-log.model', () => ({
  PaymentLogModel: {
    exists: jest.fn(),
    create: jest.fn(),
  },
}))

// Mock socket emit — no real socket in unit tests
jest.mock('../../socket/utils/emit', () => ({
  emitToUser: jest.fn(),
}))

import { stripeService } from '../../container'
import { OrderModel } from '@database/models/order.model'
import { PaymentLogModel } from '@database/models/payment-log.model'
import { emitToUser } from '../../socket/utils/emit'
import { stripeWebhook } from '@controllers/payment.controller'

const mockStripeService = stripeService as jest.Mocked<typeof stripeService>
const mockOrderModel = OrderModel as jest.Mocked<typeof OrderModel>
const mockPaymentLogModel = PaymentLogModel as jest.Mocked<typeof PaymentLogModel>
const mockEmitToUser = emitToUser as jest.Mock

// ─── Request / Response helpers (matching checkout.controller.test.ts pattern) ─

const createMockRequest = (
  options: { headers?: Record<string, string>; body?: any } = {},
): Partial<Request> => ({
  headers: options.headers || {},
  body: options.body !== undefined ? options.body : Buffer.from('{}'),
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

// ─── Shared test fixtures ─────────────────────────────────────────────────────

const makeEvent = (type: string, overrides: Record<string, any> = {}) => ({
  id: 'evt_test_001',
  type,
  data: {
    object: {
      id: 'pi_test_001',
      metadata: { orderId: 'order_abc', userId: 'user_xyz' },
      ...overrides,
    },
  },
})

describe('payment.controller — stripeWebhook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ─── 2.2 Missing stripe-signature header ─────────────────────────────────

  it('responds 400 when stripe-signature header is missing', async () => {
    const req = createMockRequest({ headers: {} })
    const res = createMockResponse()

    await stripeWebhook(req as Request, res as Response)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) }),
    )
    expect(mockStripeService.constructWebhookEvent).not.toHaveBeenCalled()
  })

  // ─── 2.3 Invalid signature ────────────────────────────────────────────────

  it('responds 400 when constructWebhookEvent throws (invalid signature)', async () => {
    const req = createMockRequest({
      headers: { 'stripe-signature': 'bad_sig' },
      body: Buffer.from('tampered'),
    })
    const res = createMockResponse()

    mockStripeService.constructWebhookEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload')
    })

    await stripeWebhook(req as Request, res as Response)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Webhook signature') }),
    )
  })

  // ─── 2.4 Duplicate event (idempotency) ───────────────────────────────────

  it('responds 200 with { received: true } and makes no DB writes when event already processed', async () => {
    const req = createMockRequest({
      headers: { 'stripe-signature': 'valid_sig' },
    })
    const res = createMockResponse()

    mockStripeService.constructWebhookEvent.mockReturnValue(
      makeEvent('payment_intent.succeeded') as any,
    )
    ;(mockPaymentLogModel.exists as jest.Mock).mockResolvedValue({ _id: 'existing_log' })

    await stripeWebhook(req as Request, res as Response)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ received: true })
    expect(mockOrderModel.findByIdAndUpdate).not.toHaveBeenCalled()
    expect(mockPaymentLogModel.create).not.toHaveBeenCalled()
  })

  // ─── 2.5 payment_intent.succeeded ────────────────────────────────────────

  it('payment_intent.succeeded: updates order to PAID/confirmed, emits to user, creates PaymentLog, responds 200', async () => {
    const req = createMockRequest({
      headers: { 'stripe-signature': 'valid_sig' },
    })
    const res = createMockResponse()

    const event = makeEvent('payment_intent.succeeded')
    mockStripeService.constructWebhookEvent.mockReturnValue(event as any)
    ;(mockPaymentLogModel.exists as jest.Mock).mockResolvedValue(null)
    ;(mockOrderModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

    // findById chain: .select().lean()
    const mockLean = jest.fn().mockResolvedValue({
      _id: 'order_abc',
      user: 'user_xyz',
      status: 'confirmed',
    })
    const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({ select: mockSelect })

    ;(mockPaymentLogModel.create as jest.Mock).mockResolvedValue({})

    await stripeWebhook(req as Request, res as Response)

    // Order updated with PAID status, confirmed status, confirmed_at, and stripe_client_secret=null
    expect(mockOrderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'order_abc',
      expect.objectContaining({
        payment_status: 'paid',
        status: 'confirmed',
        stripe_client_secret: null,
        confirmed_at: expect.any(Date),
      }),
    )

    // emitToUser called because orderId is present in metadata
    expect(mockEmitToUser).toHaveBeenCalledWith(
      'user_xyz',
      expect.any(String),
      expect.objectContaining({ payment_status: 'paid' }),
    )

    // PaymentLog created
    expect(mockPaymentLogModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_event_id: 'evt_test_001',
        stripe_event_type: 'payment_intent.succeeded',
        status: 'paid',
      }),
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ received: true })
  })

  // ─── 2.6 payment_intent.payment_failed ───────────────────────────────────

  it('payment_intent.payment_failed: updates order to FAILED, creates PaymentLog, responds 200', async () => {
    const req = createMockRequest({
      headers: { 'stripe-signature': 'valid_sig' },
    })
    const res = createMockResponse()

    const event = makeEvent('payment_intent.payment_failed')
    mockStripeService.constructWebhookEvent.mockReturnValue(event as any)
    ;(mockPaymentLogModel.exists as jest.Mock).mockResolvedValue(null)
    ;(mockOrderModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

    const mockLean = jest.fn().mockResolvedValue({
      _id: 'order_abc',
      user: 'user_xyz',
      status: 'pending',
    })
    const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({ select: mockSelect })

    ;(mockPaymentLogModel.create as jest.Mock).mockResolvedValue({})

    await stripeWebhook(req as Request, res as Response)

    expect(mockOrderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'order_abc',
      expect.objectContaining({ payment_status: 'failed' }),
    )
    expect(mockPaymentLogModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' }),
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  // ─── 2.7 payment_intent.canceled ─────────────────────────────────────────

  it('payment_intent.canceled: updates order to FAILED, creates PaymentLog, responds 200', async () => {
    const req = createMockRequest({
      headers: { 'stripe-signature': 'valid_sig' },
    })
    const res = createMockResponse()

    const event = makeEvent('payment_intent.canceled')
    mockStripeService.constructWebhookEvent.mockReturnValue(event as any)
    ;(mockPaymentLogModel.exists as jest.Mock).mockResolvedValue(null)
    ;(mockOrderModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({})

    const mockLean = jest.fn().mockResolvedValue({
      _id: 'order_abc',
      user: 'user_xyz',
      status: 'pending',
    })
    const mockSelect = jest.fn().mockReturnValue({ lean: mockLean })
    ;(mockOrderModel.findById as jest.Mock).mockReturnValue({ select: mockSelect })

    ;(mockPaymentLogModel.create as jest.Mock).mockResolvedValue({})

    await stripeWebhook(req as Request, res as Response)

    expect(mockOrderModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'order_abc',
      expect.objectContaining({ payment_status: 'failed' }),
    )
    expect(mockPaymentLogModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' }),
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })

  // ─── 2.8 Missing orderId in metadata ─────────────────────────────────────

  it('missing orderId in metadata: creates PaymentLog but does NOT call findByIdAndUpdate or emitToUser', async () => {
    const req = createMockRequest({
      headers: { 'stripe-signature': 'valid_sig' },
    })
    const res = createMockResponse()

    // Event with no orderId in metadata
    const event = {
      id: 'evt_no_order',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_no_order',
          metadata: {}, // no orderId
        },
      },
    }
    mockStripeService.constructWebhookEvent.mockReturnValue(event as any)
    ;(mockPaymentLogModel.exists as jest.Mock).mockResolvedValue(null)
    ;(mockPaymentLogModel.create as jest.Mock).mockResolvedValue({})

    await stripeWebhook(req as Request, res as Response)

    expect(mockOrderModel.findByIdAndUpdate).not.toHaveBeenCalled()
    expect(mockEmitToUser).not.toHaveBeenCalled()
    expect(mockPaymentLogModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: null,
        stripe_event_id: 'evt_no_order',
      }),
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ received: true })
  })

  // ─── 2.9 Unknown event type ───────────────────────────────────────────────

  it('unknown event type: makes no DB writes and responds 200 with { received: true }', async () => {
    const req = createMockRequest({
      headers: { 'stripe-signature': 'valid_sig' },
    })
    const res = createMockResponse()

    const event = makeEvent('customer.created')
    mockStripeService.constructWebhookEvent.mockReturnValue(event as any)
    ;(mockPaymentLogModel.exists as jest.Mock).mockResolvedValue(null)

    await stripeWebhook(req as Request, res as Response)

    expect(mockOrderModel.findByIdAndUpdate).not.toHaveBeenCalled()
    expect(mockPaymentLogModel.create).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ received: true })
  })

  // ─── 2.10 Internal processing error — always-200 contract ────────────────

  it('responds 200 with error message when OrderModel.findByIdAndUpdate throws (always-200 contract)', async () => {
    const req = createMockRequest({
      headers: { 'stripe-signature': 'valid_sig' },
    })
    const res = createMockResponse()

    const event = makeEvent('payment_intent.succeeded')
    mockStripeService.constructWebhookEvent.mockReturnValue(event as any)
    ;(mockPaymentLogModel.exists as jest.Mock).mockResolvedValue(null)
    ;(mockOrderModel.findByIdAndUpdate as jest.Mock).mockRejectedValue(
      new Error('DB connection lost'),
    )

    await stripeWebhook(req as Request, res as Response)

    // Must NOT return 500 — always 200 to prevent Stripe retries
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({
      received: true,
      error: 'Internal error processing webhook',
    })
  })
})
