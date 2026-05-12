/// <reference types="jest" />
/**
 * PaymentRepository Tests — D.6 through D.8
 * Tests findByIdempotencyKey (found and not found).
 * Uses MongoMemoryReplSet for real DB operations.
 */
import mongoose from 'mongoose'
import { connectTestDB, clearTestDB, disconnectTestDB } from '../helpers/db-setup'
import { PaymentRepository } from '@repositories/payment.repository'
import { PaymentModel, GATEWAY_PAYMENT_STATUS, PAYMENT_PROVIDER } from '@database/models/payment.model'

// ─── D.6 Setup ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await connectTestDB()
}, 120000)

beforeEach(async () => {
  await clearTestDB()
})

afterAll(async () => {
  await disconnectTestDB()
}, 30000)

// ─── D.7–D.8 PaymentRepository.findByIdempotencyKey ──────────────────────────

describe('PaymentRepository', () => {
  let repository: PaymentRepository

  beforeEach(() => {
    repository = new PaymentRepository()
  })

  describe('findByIdempotencyKey', () => {
    // D.7 — found
    it('should return the payment record when idempotencyKey exists', async () => {
      const orderId = new mongoose.Types.ObjectId()
      const key = 'test-idempotency-key-001'

      await PaymentModel.create({
        orderId,
        provider: PAYMENT_PROVIDER.MOMO,
        amount: 150000,
        currency: 'VND',
        status: GATEWAY_PAYMENT_STATUS.PENDING,
        idempotencyKey: key,
      })

      const result = await repository.findByIdempotencyKey(key)

      expect(result).not.toBeNull()
      expect(result?.idempotencyKey).toBe(key)
      expect(result?.provider).toBe(PAYMENT_PROVIDER.MOMO)
      expect(result?.amount).toBe(150000)
    })

    // D.8 — not found
    it('should return null when idempotencyKey does not exist', async () => {
      const result = await repository.findByIdempotencyKey('nonexistent-key-xyz')

      expect(result).toBeNull()
    })
  })

  describe('findLatestByOrderId', () => {
    it('should return the most recent payment for an order', async () => {
      const orderId = new mongoose.Types.ObjectId()

      // Create two payments for the same order with different timestamps
      await PaymentModel.create({
        orderId,
        provider: PAYMENT_PROVIDER.MOMO,
        amount: 100000,
        currency: 'VND',
        status: GATEWAY_PAYMENT_STATUS.FAILED,
        idempotencyKey: 'key-first',
      })

      // Small delay to ensure different createdAt
      await new Promise((resolve) => setTimeout(resolve, 10))

      await PaymentModel.create({
        orderId,
        provider: PAYMENT_PROVIDER.MOMO,
        amount: 100000,
        currency: 'VND',
        status: GATEWAY_PAYMENT_STATUS.PENDING,
        idempotencyKey: 'key-second',
      })

      const result = await repository.findLatestByOrderId(orderId)

      expect(result).not.toBeNull()
      expect(result?.idempotencyKey).toBe('key-second')
      expect(result?.status).toBe(GATEWAY_PAYMENT_STATUS.PENDING)
    })

    it('should return null when no payments exist for the order', async () => {
      const result = await repository.findLatestByOrderId(new mongoose.Types.ObjectId())
      expect(result).toBeNull()
    })
  })

  describe('findWithFilters', () => {
    it('should filter by status', async () => {
      const orderId = new mongoose.Types.ObjectId()

      await PaymentModel.create([
        {
          orderId,
          provider: PAYMENT_PROVIDER.MOMO,
          amount: 100000,
          currency: 'VND',
          status: GATEWAY_PAYMENT_STATUS.PENDING,
          idempotencyKey: 'filter-key-1',
        },
        {
          orderId: new mongoose.Types.ObjectId(),
          provider: PAYMENT_PROVIDER.VNPAY,
          amount: 200000,
          currency: 'VND',
          status: GATEWAY_PAYMENT_STATUS.SUCCESS,
          idempotencyKey: 'filter-key-2',
        },
      ])

      const result = await repository.findWithFilters({ status: GATEWAY_PAYMENT_STATUS.PENDING })

      expect(result.total).toBe(1)
      expect(result.data[0].status).toBe(GATEWAY_PAYMENT_STATUS.PENDING)
    })

    it('should filter by provider', async () => {
      await PaymentModel.create([
        {
          orderId: new mongoose.Types.ObjectId(),
          provider: PAYMENT_PROVIDER.MOMO,
          amount: 100000,
          currency: 'VND',
          status: GATEWAY_PAYMENT_STATUS.PENDING,
          idempotencyKey: 'provider-key-1',
        },
        {
          orderId: new mongoose.Types.ObjectId(),
          provider: PAYMENT_PROVIDER.VNPAY,
          amount: 200000,
          currency: 'VND',
          status: GATEWAY_PAYMENT_STATUS.PENDING,
          idempotencyKey: 'provider-key-2',
        },
      ])

      const result = await repository.findWithFilters({ provider: PAYMENT_PROVIDER.MOMO })

      expect(result.total).toBe(1)
      expect(result.data[0].provider).toBe(PAYMENT_PROVIDER.MOMO)
    })
  })
})
