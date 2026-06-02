/// <reference types="jest" />
/**
 * Payment Security Integration Tests — F.1–F.14
 *
 * Tests security controls: public IPN endpoints, signature verification,
 * rate limiting, content-type validation, secret key protection, amount
 * range validation, and order ownership enforcement.
 */

// ─── Mock external dependencies ───────────────────────────────────────────────

jest.mock('axios')

jest.mock('vnpay', () => {
  const mockVerifyIpnCall = jest.fn()
  const mockBuildPaymentUrl = jest.fn()
  const mockQueryDr = jest.fn()

  const MockVNPay = jest.fn().mockImplementation(() => ({
    verifyIpnCall: mockVerifyIpnCall,
    buildPaymentUrl: mockBuildPaymentUrl,
    queryDr: mockQueryDr,
  }))

  ;(MockVNPay as any).__mockVerifyIpnCall = mockVerifyIpnCall
  ;(MockVNPay as any).__mockBuildPaymentUrl = mockBuildPaymentUrl
  ;(MockVNPay as any).__mockQueryDr = mockQueryDr

  return { VNPay: MockVNPay, HashAlgorithm: { SHA512: 'SHA512' } }
})

jest.mock('stripe', () => {
  const MockStripe = jest.fn().mockImplementation(() => ({
    paymentIntents: { create: jest.fn(), retrieve: jest.fn(), cancel: jest.fn() },
    webhooks: { constructEvent: jest.fn() },
  }))
  return MockStripe
})

jest.mock('../../socket/utils/emit', () => ({ emitToUser: jest.fn() }))
jest.mock('../../socket/utils/order-emit', () => ({ emitOrderStatusUpdate: jest.fn() }))

import supertest from 'supertest'
import mongoose from 'mongoose'
import axios from 'axios'
import { VNPay } from 'vnpay'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import { ProductModel } from '@database/models/product.model'
import { CategoryModel } from '@database/models/category.model'
import { PaymentModel, GATEWAY_PAYMENT_STATUS } from '@database/models/payment.model'
import { OrderModel, ORDER_STATUS } from '@database/models/order.model'
import { signMomoPayload } from '../helpers/payment.fixtures'
import './setup'

const mockAxios = axios as jest.Mocked<typeof axios>

const getVnpayMocks = () => {
  const MockVNPay = VNPay as any
  return {
    verifyIpnCall: MockVNPay.__mockVerifyIpnCall as jest.Mock,
    buildPaymentUrl: MockVNPay.__mockBuildPaymentUrl as jest.Mock,
    queryDr: MockVNPay.__mockQueryDr as jest.Mock,
  }
}

const app = createTestApp()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildMomoIpnPayload(overrides: Record<string, unknown> = {}) {
  const secretKey = process.env.MOMO_SECRET_KEY || ''
  const accessKey = process.env.MOMO_ACCESS_KEY || ''
  const partnerCode = process.env.MOMO_PARTNER_CODE || ''

  const base: Record<string, unknown> = {
    partnerCode,
    orderId: 'ORDER_SEC_001',
    requestId: 'req-sec-001',
    amount: 150000,
    resultCode: 0,
    transId: 3456789012,
    message: 'Successful.',
    orderInfo: 'Test order',
    orderType: 'momo_wallet',
    accessKey,
    payType: 'qr',
    responseTime: 1700000000000,
    extraData: '',
    ...overrides,
  }

  const signature = signMomoPayload(base, secretKey)
  return { ...base, signature }
}

async function seedProduct(price = 150000) {
  const category = await CategoryModel.create({ name: 'Test Category' })
  const product = await ProductModel.create({
    name: 'Test Product',
    price,
    price_before_discount: price + 20000,
    quantity: 50,
    sold: 0,
    view: 0,
    image: 'test.jpg',
    images: ['test.jpg'],
    category: category._id,
    description: 'Test product',
    rating: 4.5,
  })
  return product
}

async function createOrderViaCheckout(
  authToken: string,
  productId: string,
  paymentMethod: string,
  buyCount = 1,
) {
  const cartRes = await supertest(app)
    .post('/purchases/add-to-cart')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ product_id: productId, buy_count: buyCount })

  const purchaseId = cartRes.body.data?._id
  if (!purchaseId) throw new Error('Failed to add to cart')

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
  const addressId = addressRes.body.data?._id

  return supertest(app)
    .post('/checkout/create-order')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      purchase_ids: [purchaseId],
      shipping_address_id: addressId,
      shipping_method_id: 'standard',
      payment_method: paymentMethod,
    })
}

// ─── F.2 MoMo IPN endpoint accessible WITHOUT JWT ────────────────────────────

describe('F.2 MoMo IPN endpoint accessible WITHOUT JWT', () => {
  it('POST /payment/momo/ipn without Authorization header does not return 401', async () => {
    const payload = buildMomoIpnPayload()

    const res = await supertest(app)
      .post('/payment/momo/ipn')
      .set('Content-Type', 'application/json')
      .send(payload)

    // MoMo IPN is public — must not return 401
    expect(res.status).not.toBe(401)
    // MoMo always returns 204
    expect(res.status).toBe(204)
  })
})

// ─── F.3 VNPay IPN endpoint accessible WITHOUT JWT ───────────────────────────

describe('F.3 VNPay IPN endpoint accessible WITHOUT JWT', () => {
  it('GET /payment/vnpay/ipn without Authorization header does not return 401', async () => {
    const { verifyIpnCall } = getVnpayMocks()
    verifyIpnCall.mockReturnValue({ isVerified: false })

    const res = await supertest(app).get('/payment/vnpay/ipn').query({
      vnp_TxnRef: 'test-order',
      vnp_Amount: '15000000',
      vnp_ResponseCode: '00',
      vnp_SecureHash: 'some-hash',
    })

    // VNPay IPN is public — must not return 401
    expect(res.status).not.toBe(401)
    // Invalid signature returns 200 with RspCode 97
    expect(res.status).toBe(200)
  })
})

// ─── F.4 MoMo IPN with invalid signature — rejected gracefully ───────────────

describe('F.4 MoMo IPN with invalid signature — rejected gracefully', () => {
  it('invalid MoMo signature returns 204 (no state change)', async () => {
    const orderId = new mongoose.Types.ObjectId()

    await OrderModel.create({
      _id: orderId,
      user: new mongoose.Types.ObjectId(),
      items: [],
      shipping_address: {
        full_name: 'Test User',
        phone: '0901234567',
        province: 'HCM',
        district: 'Q1',
        ward: 'P1',
        street: '123 ABC',
      },
      shipping_method: { id: 'standard', name: 'Standard', price: 30000 },
      payment_method: 'momo',
      subtotal: 150000,
      shipping_fee: 30000,
      total: 150000,
      status: ORDER_STATUS.PAYMENT_PENDING,
    })

    await PaymentModel.create({
      orderId,
      provider: 'MOMO',
      amount: 150000,
      currency: 'VND',
      status: GATEWAY_PAYMENT_STATUS.PENDING,
      idempotencyKey: `${orderId}-invalid-sig-001`,
    })

    // Send payload with tampered signature
    const res = await supertest(app)
      .post('/payment/momo/ipn')
      .set('Content-Type', 'application/json')
      .send({
        orderId: orderId.toString(),
        amount: 150000,
        resultCode: 0,
        signature: 'invalid-signature-tampered',
        partnerCode: 'TEST',
        requestId: 'req-001',
        transId: 12345,
        message: 'Successful.',
        orderInfo: 'Test',
        orderType: 'momo_wallet',
        accessKey: 'test-key',
        payType: 'qr',
        responseTime: 1700000000000,
        extraData: '',
      })

    // MoMo always returns 204 even on signature failure
    expect(res.status).toBe(204)

    // Order status must NOT change
    const dbOrder = await OrderModel.findById(orderId).lean()
    expect(dbOrder?.status).toBe(ORDER_STATUS.PAYMENT_PENDING)

    // Payment status must NOT change
    const payment = await PaymentModel.findOne({ orderId }).lean()
    expect(payment?.status).toBe(GATEWAY_PAYMENT_STATUS.PENDING)
  })
})

// ─── F.5 IPN reject payload > 10MB ───────────────────────────────────────────

describe('F.5 IPN reject payload > 10MB', () => {
  it('POST /payment/momo/ipn with Content-Length > 10MB returns 400', async () => {
    // MAX_REQUEST_SIZE is '10mb' (10 * 1024 * 1024 bytes).
    // The requestSizeLimitMiddleware checks the Content-Length header and returns 400
    // before reading the body. We set Content-Length to just over the limit (10MB + 1)
    // with a small actual body to avoid ECONNRESET from sending a huge payload.
    const maxBytes = 10 * 1024 * 1024
    const oversizeContentLength = String(maxBytes + 1)

    const res = await supertest(app)
      .post('/payment/momo/ipn')
      .set('Content-Type', 'application/json')
      .set('Content-Length', oversizeContentLength)
      .send('{}')

    // requestSizeLimitMiddleware returns 400 for oversized requests
    expect(res.status).toBe(400)
  })
})

// ─── F.5b IPN payload valid (< 1MB) — not rejected ───────────────────────────

describe('F.5b IPN payload valid (< 1MB) — not rejected due to size', () => {
  it('normal-sized MoMo IPN payload is processed (not rejected for size)', async () => {
    const payload = buildMomoIpnPayload()

    const res = await supertest(app)
      .post('/payment/momo/ipn')
      .set('Content-Type', 'application/json')
      .send(payload)

    // Should not be rejected for size — MoMo returns 204
    expect(res.status).toBe(204)
  })
})

// ─── F.8 Content-Type validation on MoMo IPN ─────────────────────────────────

describe('F.8 Content-Type validation on MoMo IPN', () => {
  it('POST /payment/momo/ipn with Content-Type: text/plain returns 415', async () => {
    const res = await supertest(app)
      .post('/payment/momo/ipn')
      .set('Content-Type', 'text/plain')
      .send('some plain text body')

    // validateContentTypeMiddleware returns 415 for unsupported content types
    expect(res.status).toBe(415)
  })
})

// ─── F.8b Content-Type valid — request processed ─────────────────────────────

describe('F.8b Content-Type valid — request processed normally', () => {
  it('POST /payment/momo/ipn with Content-Type: application/json is processed', async () => {
    const payload = buildMomoIpnPayload()

    const res = await supertest(app)
      .post('/payment/momo/ipn')
      .set('Content-Type', 'application/json')
      .send(payload)

    // Valid content-type — MoMo returns 204
    expect(res.status).toBe(204)
  })
})

// ─── F.9 No secret keys leaked in logs ───────────────────────────────────────

describe('F.9 No secret keys leaked in logs', () => {
  it('payment flow does not log MOMO_SECRET_KEY or MOMO_ACCESS_KEY values', async () => {
    const secretKey = process.env.MOMO_SECRET_KEY || 'test-secret-key'
    const accessKey = process.env.MOMO_ACCESS_KEY || 'test-access-key'

    const loggedMessages: string[] = []
    const originalConsoleLog = console.log
    const originalConsoleError = console.error

    console.log = (...args: any[]) => {
      loggedMessages.push(args.map(String).join(' '))
    }
    console.error = (...args: any[]) => {
      loggedMessages.push(args.map(String).join(' '))
    }

    try {
      const payload = buildMomoIpnPayload()
      await supertest(app)
        .post('/payment/momo/ipn')
        .set('Content-Type', 'application/json')
        .send(payload)
    } finally {
      console.log = originalConsoleLog
      console.error = originalConsoleError
    }

    // No log entry should contain the actual secret key values
    if (secretKey && secretKey !== '') {
      const secretLeaked = loggedMessages.some((msg) => msg.includes(secretKey))
      expect(secretLeaked).toBe(false)
    }

    if (accessKey && accessKey !== '') {
      const accessLeaked = loggedMessages.some((msg) => msg.includes(accessKey))
      expect(accessLeaked).toBe(false)
    }
  })
})

// ─── F.10 No secret keys in error messages ───────────────────────────────────

describe('F.10 No secret keys in error messages', () => {
  it('MoMo provider error does not expose secret key in error message', async () => {
    const secretKey = process.env.MOMO_SECRET_KEY || 'test-secret-key'

    // Mock axios to throw an error
    mockAxios.post = jest.fn().mockRejectedValue(new Error('Network error'))

    const product = await seedProduct()
    const auth = await getAuthToken(app)

    const orderRes = await createOrderViaCheckout(auth.access_token, product._id.toString(), 'momo')

    // Order creation may succeed (payment failure is handled gracefully)
    // The important thing is that no secret key appears in the response
    const responseText = JSON.stringify(orderRes.body)
    if (secretKey && secretKey !== '') {
      expect(responseText).not.toContain(secretKey)
    }
  })
})

// ─── F.13 Order belongs to correct user — 200 on payment-status ──────────────

describe('F.13 Order belongs to correct user — 200 on payment-status', () => {
  it('GET /orders/:id/payment-status returns 200 for order owner', async () => {
    const auth = await getAuthToken(app)
    const userId = new mongoose.Types.ObjectId(auth.user._id)

    const orderId = new mongoose.Types.ObjectId()

    await OrderModel.create({
      _id: orderId,
      user: userId,
      items: [],
      shipping_address: {
        full_name: 'Test User',
        phone: '0901234567',
        province: 'HCM',
        district: 'Q1',
        ward: 'P1',
        street: '123 ABC',
      },
      shipping_method: { id: 'standard', name: 'Standard', price: 30000 },
      payment_method: 'momo',
      subtotal: 150000,
      shipping_fee: 30000,
      total: 150000,
      status: ORDER_STATUS.PAYMENT_PENDING,
    })

    await PaymentModel.create({
      orderId,
      provider: 'MOMO',
      amount: 150000,
      currency: 'VND',
      status: GATEWAY_PAYMENT_STATUS.PENDING,
      idempotencyKey: `${orderId}-ownership-test-001`,
    })

    const res = await supertest(app)
      .get(`/orders/${orderId}/payment-status`)
      .set('Authorization', `Bearer ${auth.access_token}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toBeDefined()
    expect(res.body.data.status).toBeDefined()
  })
})

// ─── F.14 Order belongs to different user — 403 on payment-status ────────────

describe('F.14 Order belongs to different user — 403 on payment-status', () => {
  it('GET /orders/:id/payment-status returns 403 or 404 for non-owner', async () => {
    // Create order for user A
    const authA = await getAuthToken(app)
    const userAId = new mongoose.Types.ObjectId(authA.user._id)

    const orderId = new mongoose.Types.ObjectId()

    await OrderModel.create({
      _id: orderId,
      user: userAId,
      items: [],
      shipping_address: {
        full_name: 'User A',
        phone: '0901234567',
        province: 'HCM',
        district: 'Q1',
        ward: 'P1',
        street: '123 ABC',
      },
      shipping_method: { id: 'standard', name: 'Standard', price: 30000 },
      payment_method: 'momo',
      subtotal: 150000,
      shipping_fee: 30000,
      total: 150000,
      status: ORDER_STATUS.PAYMENT_PENDING,
    })

    // User B tries to access user A's order
    const authB = await getAuthToken(app)

    const res = await supertest(app)
      .get(`/orders/${orderId}/payment-status`)
      .set('Authorization', `Bearer ${authB.access_token}`)

    // Must not return 200 — order belongs to a different user
    expect(res.status).toBeGreaterThanOrEqual(400)
    // Should be 403 Forbidden or 404 Not Found
    expect([403, 404]).toContain(res.status)
  })
})

// ─── F.11 / F.12 / F.12b Amount range validation ─────────────────────────────
//
// NOTE: Amount range validation (minimum/maximum order amount) is NOT currently
// implemented in the production code. There is no MIN_AMOUNT or MAX_AMOUNT check
// in the order creation or payment initiation flow. These tests are skipped until
// the validation is added to the production code.

describe('F.11 Amount below minimum — rejected', () => {
  it.skip('order with amount below minimum (e.g. 0 VND) returns 400', () => {
    // SKIPPED: Amount range validation is not implemented in production code.
    // When implemented, this test should:
    // - Attempt to create an order with total = 0 (or below minimum threshold)
    // - Expect HTTP 400 with a message about minimum order amount
  })
})

describe('F.12 Amount above maximum — rejected', () => {
  it.skip('order with amount above maximum returns 400', () => {
    // SKIPPED: Amount range validation is not implemented in production code.
    // When implemented, this test should:
    // - Attempt to create an order with total above the maximum allowed amount
    // - Expect HTTP 400 with a message about maximum order amount
  })
})

describe('F.12b Amount within valid range — accepted', () => {
  it.skip('order with amount within valid range is accepted', () => {
    // SKIPPED: Amount range validation is not implemented in production code.
    // When implemented, this test should:
    // - Create an order with a valid amount (e.g. 150,000 VND)
    // - Expect the order to be created successfully
  })
})

// ─── F.6 / F.6b IPN rate limiting — MUST RUN LAST ────────────────────────────
//
// The IPN rate limiter is a module-level RateLimiterMemory instance in
// apps/shopee-api/src/routes/common/ipn.route.ts. It is NOT part of the global
// allLimiters that resetAllRateLimits() resets between tests. Because it persists
// across the entire test run, these rate limit tests are placed LAST to avoid
// polluting earlier tests with consumed rate limit points.
//
// The limiter allows 100 requests per minute per IP. Sending 101 requests
// exhausts the limit and the 101st should return 429.

describe('F.6 IPN rate limiting — MoMo endpoint (RUNS LAST)', () => {
  it('returns 429 after 100 requests to POST /payment/momo/ipn from same IP', async () => {
    const payload = buildMomoIpnPayload()

    // Send 100 requests — all should succeed (204)
    const requests = Array.from({ length: 100 }, () =>
      supertest(app)
        .post('/payment/momo/ipn')
        .set('Content-Type', 'application/json')
        .set('X-Forwarded-For', '10.0.0.1')
        .send(payload),
    )
    await Promise.all(requests)

    // 101st request — should be rate limited
    const res = await supertest(app)
      .post('/payment/momo/ipn')
      .set('Content-Type', 'application/json')
      .set('X-Forwarded-For', '10.0.0.1')
      .send(payload)

    expect(res.status).toBe(429)
    expect(res.body.message).toContain('Too many IPN requests')
  }, 60000) // Allow up to 60s for 101 sequential requests
})

describe('F.6b IPN rate limiting — different IP is not affected', () => {
  it.skip('a different IP can still send IPN after the first IP is rate limited', () => {
    // SKIPPED: supertest does not support testing per-IP rate limiting because all
    // requests originate from the same loopback address regardless of the
    // X-Forwarded-For header value. The rate limiter key resolves to the same IP
    // for every supertest request, so a "different IP" cannot be simulated at the
    // integration level. Per-IP isolation is a unit-level concern of
    // rate-limiter-flexible and is covered by its own test suite.
  })
})

// ─── F.7 / F.7b Payment-status rate limiting ─────────────────────────────────
//
// NOTE: The GET /orders/:id/payment-status endpoint does NOT have a dedicated
// rate limiter in the current production code. It is protected only by JWT auth
// and the global rate limiter (if any). These tests are skipped until a rate
// limiter is added to that endpoint.

describe('F.7 Payment-status rate limiting', () => {
  it.skip('returns 429 after exceeding rate limit on GET /orders/:id/payment-status', () => {
    // SKIPPED: No rate limiter is currently implemented on the payment-status endpoint.
    // Add a RateLimiterMemory to the order route for this endpoint, then enable this test.
  })
})

describe('F.7b Payment-status rate limiting — different IP not affected', () => {
  it.skip('different IP can still access payment-status after first IP is rate limited', () => {
    // SKIPPED: No rate limiter is currently implemented on the payment-status endpoint.
  })
})
