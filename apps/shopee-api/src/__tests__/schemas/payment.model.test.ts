/// <reference types="jest" />
/**
 * Payment Model Tests — D.1 through D.5, D.9
 * Tests Mongoose schema validation, enum constraints, and uniqueness index.
 * Uses MongoMemoryReplSet (replica set required for transactions).
 */
import mongoose from 'mongoose'
import { connectTestDB, clearTestDB, disconnectTestDB } from '../helpers/db-setup'
import { PaymentModel, GATEWAY_PAYMENT_STATUS, PAYMENT_PROVIDER } from '@database/models/payment.model'
import { OrderModel, PAYMENT_METHOD } from '@database/models/order.model'

// ─── D.1 Setup ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await connectTestDB()
}, 120000)

beforeEach(async () => {
  await clearTestDB()
})

afterAll(async () => {
  await disconnectTestDB()
}, 30000)

// ─── D.2–D.5 Payment Model ────────────────────────────────────────────────────

describe('PaymentModel — schema validation', () => {
  const validOrderId = new mongoose.Types.ObjectId()

  // D.2 — required fields
  describe('required fields', () => {
    it('should fail validation when orderId is missing', async () => {
      const payment = new PaymentModel({
        provider: PAYMENT_PROVIDER.MOMO,
        amount: 100000,
        currency: 'VND',
        status: GATEWAY_PAYMENT_STATUS.PENDING,
        idempotencyKey: 'key-001',
      })

      await expect(payment.validate()).rejects.toThrow()
    })

    it('should fail validation when provider is missing', async () => {
      const payment = new PaymentModel({
        orderId: validOrderId,
        amount: 100000,
        currency: 'VND',
        status: GATEWAY_PAYMENT_STATUS.PENDING,
        idempotencyKey: 'key-002',
      })

      await expect(payment.validate()).rejects.toThrow()
    })

    it('should fail validation when amount is missing', async () => {
      const payment = new PaymentModel({
        orderId: validOrderId,
        provider: PAYMENT_PROVIDER.MOMO,
        currency: 'VND',
        status: GATEWAY_PAYMENT_STATUS.PENDING,
        idempotencyKey: 'key-003',
      })

      await expect(payment.validate()).rejects.toThrow()
    })

    it('should fail validation when idempotencyKey is missing', async () => {
      const payment = new PaymentModel({
        orderId: validOrderId,
        provider: PAYMENT_PROVIDER.MOMO,
        amount: 100000,
        currency: 'VND',
        status: GATEWAY_PAYMENT_STATUS.PENDING,
      })

      await expect(payment.validate()).rejects.toThrow()
    })
  })

  // D.3 — provider enum validation
  describe('provider enum validation', () => {
    it('should fail validation with invalid provider', async () => {
      const payment = new PaymentModel({
        orderId: validOrderId,
        provider: 'INVALID_PROVIDER',
        amount: 100000,
        currency: 'VND',
        status: GATEWAY_PAYMENT_STATUS.PENDING,
        idempotencyKey: 'key-004',
      })

      await expect(payment.validate()).rejects.toThrow()
    })

    it('should accept valid provider MOMO', async () => {
      const payment = new PaymentModel({
        orderId: validOrderId,
        provider: PAYMENT_PROVIDER.MOMO,
        amount: 100000,
        currency: 'VND',
        status: GATEWAY_PAYMENT_STATUS.PENDING,
        idempotencyKey: 'key-005',
      })

      await expect(payment.validate()).resolves.toBeUndefined()
    })

    it('should accept valid provider VNPAY', async () => {
      const payment = new PaymentModel({
        orderId: validOrderId,
        provider: PAYMENT_PROVIDER.VNPAY,
        amount: 100000,
        currency: 'VND',
        status: GATEWAY_PAYMENT_STATUS.PENDING,
        idempotencyKey: 'key-006',
      })

      await expect(payment.validate()).resolves.toBeUndefined()
    })
  })

  // D.4 — status enum validation
  describe('status enum validation', () => {
    it('should fail validation with invalid status', async () => {
      const payment = new PaymentModel({
        orderId: validOrderId,
        provider: PAYMENT_PROVIDER.MOMO,
        amount: 100000,
        currency: 'VND',
        status: 'UNKNOWN',
        idempotencyKey: 'key-007',
      })

      await expect(payment.validate()).rejects.toThrow()
    })

    it('should accept all valid status values', async () => {
      for (const status of Object.values(GATEWAY_PAYMENT_STATUS)) {
        const payment = new PaymentModel({
          orderId: validOrderId,
          provider: PAYMENT_PROVIDER.MOMO,
          amount: 100000,
          currency: 'VND',
          status,
          idempotencyKey: `key-status-${status}`,
        })
        await expect(payment.validate()).resolves.toBeUndefined()
      }
    })
  })

  // D.5 — idempotencyKey uniqueness constraint
  describe('idempotencyKey uniqueness', () => {
    it('should reject duplicate idempotencyKey on second insert', async () => {
      const sharedKey = 'unique-key-test-001'

      await PaymentModel.create({
        orderId: validOrderId,
        provider: PAYMENT_PROVIDER.MOMO,
        amount: 100000,
        currency: 'VND',
        status: GATEWAY_PAYMENT_STATUS.PENDING,
        idempotencyKey: sharedKey,
      })

      await expect(
        PaymentModel.create({
          orderId: new mongoose.Types.ObjectId(),
          provider: PAYMENT_PROVIDER.VNPAY,
          amount: 200000,
          currency: 'VND',
          status: GATEWAY_PAYMENT_STATUS.PENDING,
          idempotencyKey: sharedKey,
        }),
      ).rejects.toThrow()
    })

    it('should allow different idempotencyKeys for same orderId', async () => {
      await PaymentModel.create({
        orderId: validOrderId,
        provider: PAYMENT_PROVIDER.MOMO,
        amount: 100000,
        currency: 'VND',
        status: GATEWAY_PAYMENT_STATUS.FAILED,
        idempotencyKey: 'key-attempt-1',
      })

      await expect(
        PaymentModel.create({
          orderId: validOrderId,
          provider: PAYMENT_PROVIDER.MOMO,
          amount: 100000,
          currency: 'VND',
          status: GATEWAY_PAYMENT_STATUS.PENDING,
          idempotencyKey: 'key-attempt-2',
        }),
      ).resolves.toBeDefined()
    })
  })
})

// ─── D.9 Order Model — paymentMethod enum validation ─────────────────────────

describe('OrderModel — paymentMethod enum validation', () => {
  const validShippingAddress = {
    full_name: 'Test User',
    phone: '0901234567',
    province: 'HCM',
    district: 'Q1',
    ward: 'P1',
    street: '123 ABC',
  }

  const validShippingMethod = {
    id: 'standard',
    name: 'Standard Shipping',
    price: 30000,
  }

  it('should fail validation with invalid paymentMethod BITCOIN', async () => {
    const order = new OrderModel({
      user: new mongoose.Types.ObjectId(),
      items: [],
      shipping_address: validShippingAddress,
      shipping_method: validShippingMethod,
      payment_method: 'BITCOIN',
      subtotal: 100000,
      shipping_fee: 30000,
      total: 130000,
    })

    await expect(order.validate()).rejects.toThrow()
  })

  it('should accept all valid paymentMethod enum values', async () => {
    for (const method of Object.values(PAYMENT_METHOD)) {
      const order = new OrderModel({
        user: new mongoose.Types.ObjectId(),
        items: [],
        shipping_address: validShippingAddress,
        shipping_method: validShippingMethod,
        payment_method: method,
        subtotal: 100000,
        shipping_fee: 30000,
        total: 130000,
      })
      await expect(order.validate()).resolves.toBeUndefined()
    }
  })
})
