/// <reference types="jest" />

// Mock the Stripe SDK so the StripeService constructor doesn't throw when
// STRIPE_SECRET_KEY is not set in the test environment. The actual Stripe
// API calls are intercepted via jest.spyOn on the stripeService instance.
jest.mock('stripe', () => {
  const MockStripe = jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
      cancel: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }))
  return MockStripe
})

// Mock socket emit — no real socket in integration tests
jest.mock('../../socket/utils/emit', () => ({
  emitToUser: jest.fn(),
}))

// Mock order-emit as well (used by cancelOrder)
jest.mock('../../socket/utils/order-emit', () => ({
  emitOrderStatusUpdate: jest.fn(),
}))

import supertest from 'supertest'
import { Request, Response } from 'express'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import { ProductModel } from '@database/models/product.model'
import { CategoryModel } from '@database/models/category.model'
import { OrderModel } from '@database/models/order.model'
import { PaymentLogModel } from '@database/models/payment-log.model'
import { stripeService } from '../../container'
import { stripeWebhook } from '@controllers/payment.controller'
import './setup'

// ─── Request / Response helpers for direct controller calls ──────────────────

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

// ─── Test app ─────────────────────────────────────────────────────────────────

const app = createTestApp()

// ─── Shared fixtures ──────────────────────────────────────────────────────────

describe('Stripe Payment Flow — Integration', () => {
  let authToken: string
  let userId: string
  let productId: string
  let addressId: string

  // Spy on stripeService methods so we can control return values without
  // replacing the entire container (which would break other services)
  let createPaymentIntentSpy: jest.SpyInstance
  let cancelPaymentIntentSpy: jest.SpyInstance
  let constructWebhookEventSpy: jest.SpyInstance

  beforeEach(async () => {
    jest.clearAllMocks()

    createPaymentIntentSpy = jest.spyOn(stripeService, 'createPaymentIntent')
    cancelPaymentIntentSpy = jest.spyOn(stripeService, 'cancelPaymentIntent')
    constructWebhookEventSpy = jest.spyOn(stripeService, 'constructWebhookEvent')

    const category = await CategoryModel.create({ name: 'Test Category' })

    const product = await ProductModel.create({
      name: 'Test Product',
      price: 150000,
      price_before_discount: 180000,
      quantity: 50,
      sold: 0,
      view: 0,
      image: 'test.jpg',
      images: ['test.jpg'],
      category: category._id,
      description: 'Test',
      rating: 4.5,
    })
    productId = product._id.toString()

    const auth = await getAuthToken(app)
    authToken = auth.access_token
    userId = auth.user._id

    const addressRes = await supertest(app)
      .post('/addresses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        full_name: 'Test User',
        phone: '0901234567',
        province: 'HCM',
        district: 'Q1',
        ward: 'P1',
        street: '123 ABC',
      })
    addressId = addressRes.body.data?._id
  })

  afterEach(() => {
    createPaymentIntentSpy.mockRestore()
    cancelPaymentIntentSpy.mockRestore()
    constructWebhookEventSpy.mockRestore()
  })

  // ─── 4.2 createOrder with credit_card → DB has stripe fields ─────────────

  describe('4.2 createOrder with credit_card', () => {
    it('order document in MongoDB has stripe_payment_intent_id and stripe_client_secret populated', async () => {
      createPaymentIntentSpy.mockResolvedValue({
        clientSecret: 'pi_int_test_secret',
        paymentIntentId: 'pi_int_test_id',
      })

      const res = await supertest(app)
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ product_id: productId, buy_count: 1 }],
          shipping_address_id: addressId,
          shipping_method_id: 'standard',
          payment_method: 'credit_card',
        })

      expect(res.status).toBeLessThan(400)
      expect(res.body.data).toBeDefined()

      const orderId = res.body.data._id
      const orderInDb = await OrderModel.findById(orderId).lean()

      expect(orderInDb).not.toBeNull()
      expect(orderInDb!.stripe_payment_intent_id).toBe('pi_int_test_id')
      expect(orderInDb!.stripe_client_secret).toBe('pi_int_test_secret')
    })
  })

  // ─── 4.3 stripeWebhook payment_intent.succeeded → DB updated ─────────────

  describe('4.3 stripeWebhook payment_intent.succeeded', () => {
    it('order updated to payment_status=PAID, status=confirmed, confirmed_at set; PaymentLog created', async () => {
      // First create a credit_card order so we have a real order document
      createPaymentIntentSpy.mockResolvedValue({
        clientSecret: 'pi_4_3_secret',
        paymentIntentId: 'pi_4_3_id',
      })

      const orderRes = await supertest(app)
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ product_id: productId, buy_count: 1 }],
          shipping_address_id: addressId,
          shipping_method_id: 'standard',
          payment_method: 'credit_card',
        })

      expect(orderRes.status).toBeLessThan(400)
      const orderId = orderRes.body.data._id

      // Simulate Stripe sending payment_intent.succeeded webhook
      const stripeEvent = {
        id: 'evt_4_3_succeeded',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_4_3_id',
            metadata: { orderId, userId },
          },
        },
      }

      constructWebhookEventSpy.mockReturnValue(stripeEvent as any)

      const req = createMockRequest({
        headers: { 'stripe-signature': 'valid_sig_4_3' },
        body: Buffer.from(JSON.stringify(stripeEvent)),
      })
      const res = createMockResponse()

      await stripeWebhook(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ received: true })

      // Verify order document updated in DB
      const updatedOrder = await OrderModel.findById(orderId).lean()
      expect(updatedOrder!.payment_status).toBe('paid')
      expect(updatedOrder!.status).toBe('confirmed')
      expect(updatedOrder!.confirmed_at).toBeInstanceOf(Date)
      expect(updatedOrder!.stripe_client_secret).toBeNull()

      // Verify PaymentLog created
      const paymentLog = await PaymentLogModel.findOne({ stripe_event_id: 'evt_4_3_succeeded' }).lean()
      expect(paymentLog).not.toBeNull()
      expect(paymentLog!.stripe_event_id).toBe('evt_4_3_succeeded')
      expect(paymentLog!.stripe_event_type).toBe('payment_intent.succeeded')
      expect(paymentLog!.status).toBe('paid')
    })
  })

  // ─── 4.4 Idempotency: same event ID → only one PaymentLog ────────────────

  describe('4.4 stripeWebhook idempotency', () => {
    it('calling webhook twice with same event ID creates only one PaymentLog; both calls return 200', async () => {
      // Create a real order first
      createPaymentIntentSpy.mockResolvedValue({
        clientSecret: 'pi_4_4_secret',
        paymentIntentId: 'pi_4_4_id',
      })

      const orderRes = await supertest(app)
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ product_id: productId, buy_count: 1 }],
          shipping_address_id: addressId,
          shipping_method_id: 'standard',
          payment_method: 'credit_card',
        })

      expect(orderRes.status).toBeLessThan(400)
      const orderId = orderRes.body.data._id

      const stripeEvent = {
        id: 'evt_4_4_idempotent',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_4_4_id',
            metadata: { orderId, userId },
          },
        },
      }

      constructWebhookEventSpy.mockReturnValue(stripeEvent as any)

      const makeWebhookCall = async () => {
        const req = createMockRequest({
          headers: { 'stripe-signature': 'valid_sig_4_4' },
          body: Buffer.from(JSON.stringify(stripeEvent)),
        })
        const res = createMockResponse()
        await stripeWebhook(req as Request, res as Response)
        return res
      }

      // First call — processes the event
      const res1 = await makeWebhookCall()
      expect(res1.status).toHaveBeenCalledWith(200)
      expect(res1.json).toHaveBeenCalledWith({ received: true })

      // Second call — idempotency check should skip processing
      const res2 = await makeWebhookCall()
      expect(res2.status).toHaveBeenCalledWith(200)
      expect(res2.json).toHaveBeenCalledWith({ received: true })

      // Only one PaymentLog document should exist for this event
      const logCount = await PaymentLogModel.countDocuments({ stripe_event_id: 'evt_4_4_idempotent' })
      expect(logCount).toBe(1)
    })
  })

  // ─── 4.5 cancelOrder for credit_card pending order ────────────────────────

  describe('4.5 cancelOrder for credit_card pending order', () => {
    it('calls stripeService.cancelPaymentIntent; order has status=cancelled and payment_status=failed', async () => {
      // Create a credit_card order
      createPaymentIntentSpy.mockResolvedValue({
        clientSecret: 'pi_4_5_secret',
        paymentIntentId: 'pi_4_5_id',
      })

      const orderRes = await supertest(app)
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ product_id: productId, buy_count: 1 }],
          shipping_address_id: addressId,
          shipping_method_id: 'standard',
          payment_method: 'credit_card',
        })

      expect(orderRes.status).toBeLessThan(400)
      const orderId = orderRes.body.data._id

      cancelPaymentIntentSpy.mockResolvedValue({
        id: 'pi_4_5_id',
        status: 'canceled',
      } as any)

      const cancelRes = await supertest(app)
        .put(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ reason: 'Changed mind' })

      expect(cancelRes.status).toBeLessThan(400)

      // Verify stripeService.cancelPaymentIntent was called
      expect(cancelPaymentIntentSpy).toHaveBeenCalledWith('pi_4_5_id')

      // Verify order document in DB
      const cancelledOrder = await OrderModel.findById(orderId).lean()
      expect(cancelledOrder!.status).toBe('cancelled')
      expect(cancelledOrder!.payment_status).toBe('failed')
    })
  })
})
