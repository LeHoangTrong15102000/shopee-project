/// <reference types="jest" />

// Mock Stripe so the StripeService constructor doesn't throw when
// STRIPE_SECRET_KEY is not set in the test environment.
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

jest.mock('../../socket/utils/order-emit', () => ({
  emitOrderStatusUpdate: jest.fn(),
}))

import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { getAdminToken, getAuthToken } from '../helpers/auth-helper'
import { PaymentMethodModel } from '@database/models/payment-method.model'
import { OrderModel } from '@database/models/order.model'
import './setup'

const app = createTestApp()

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_NONEXISTENT_ID = '507f1f77bcf86cd799439099'

const seedPaymentMethod = async (overrides: Record<string, any> = {}) => {
  return PaymentMethodModel.create({
    name: 'Test Method',
    type: 'cod',
    is_active: true,
    sort_order: 0,
    ...overrides,
  })
}

// ─── Integration Tests ────────────────────────────────────────────────────────

describe('Admin Payment Methods — Integration', () => {
  let adminToken: string

  beforeEach(async () => {
    const auth = await getAdminToken(app)
    adminToken = auth.access_token
  })

  // ─── 3.3 Auth enforcement ──────────────────────────────────────────────────

  describe('Auth enforcement', () => {
    it('GET /admin/payment-methods without token returns 401', async () => {
      const res = await supertest(app).get('/admin/payment-methods')
      expect(res.status).toBe(401)
    })

    it('POST /admin/payment-methods without token returns 401', async () => {
      const res = await supertest(app)
        .post('/admin/payment-methods')
        .send({ name: 'Test', type: 'cod' })
      expect(res.status).toBe(401)
    })

    it('non-admin JWT returns 403', async () => {
      const userAuth = await getAuthToken(app)
      const res = await supertest(app)
        .get('/admin/payment-methods')
        .set('Authorization', `Bearer ${userAuth.access_token}`)
      expect(res.status).toBe(403)
    })
  })

  // ─── 3.4 GET / — list sorted by sort_order ────────────────────────────────

  describe('GET /admin/payment-methods', () => {
    it('returns 200 with methods sorted by sort_order', async () => {
      await seedPaymentMethod({ name: 'Second', type: 'bank_transfer', sort_order: 1 })
      await seedPaymentMethod({ name: 'First', type: 'cod', sort_order: 0 })

      const res = await supertest(app)
        .get('/admin/payment-methods')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBe(2)
      expect(res.body.data[0].sort_order).toBeLessThanOrEqual(res.body.data[1].sort_order)
    })
  })

  // ─── 3.5 POST / — create ──────────────────────────────────────────────────

  describe('POST /admin/payment-methods', () => {
    it('returns 200 and created document for valid body', async () => {
      const res = await supertest(app)
        .post('/admin/payment-methods')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'E-Wallet', type: 'e_wallet' })

      expect(res.status).toBe(200)
      expect(res.body.data).toBeDefined()
      expect(res.body.data.name).toBe('E-Wallet')
      expect(res.body.data.type).toBe('e_wallet')
    })

    // ─── 3.6 POST / — validation ────────────────────────────────────────────

    it('returns 422 when required name is missing', async () => {
      const res = await supertest(app)
        .post('/admin/payment-methods')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'cod' })

      expect(res.status).toBe(422)
    })
  })

  // ─── 3.7 GET /:id — found ─────────────────────────────────────────────────

  describe('GET /admin/payment-methods/:id', () => {
    it('returns 200 with correct data for existing method', async () => {
      const method = await seedPaymentMethod({ name: 'Credit Card', type: 'credit_card' })

      const res = await supertest(app)
        .get(`/admin/payment-methods/${method._id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.name).toBe('Credit Card')
      expect(res.body.data.type).toBe('credit_card')
    })

    // ─── 3.8 GET /:id — not found ───────────────────────────────────────────

    it('returns 404 for valid but non-existent ObjectId', async () => {
      const res = await supertest(app)
        .get(`/admin/payment-methods/${VALID_NONEXISTENT_ID}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(404)
    })
  })

  // ─── 3.9 PUT /:id — update ────────────────────────────────────────────────

  describe('PUT /admin/payment-methods/:id', () => {
    it('returns 200 and reflects updated field', async () => {
      const method = await seedPaymentMethod({ name: 'Original Name', type: 'cod' })

      const res = await supertest(app)
        .put(`/admin/payment-methods/${method._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' })

      expect(res.status).toBe(200)
      expect(res.body.data.name).toBe('Updated Name')
    })

    // ─── 3.10 PUT /:id — not found ──────────────────────────────────────────

    it('returns 404 for valid but non-existent ObjectId', async () => {
      const res = await supertest(app)
        .put(`/admin/payment-methods/${VALID_NONEXISTENT_ID}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'X' })

      expect(res.status).toBe(404)
    })
  })

  // ─── 3.11 DELETE /:id — success ───────────────────────────────────────────

  describe('DELETE /admin/payment-methods/:id', () => {
    it('returns 200 and removes method from DB when no orders reference it', async () => {
      const method = await seedPaymentMethod({ type: 'e_wallet' })

      const res = await supertest(app)
        .delete(`/admin/payment-methods/${method._id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)

      const inDb = await PaymentMethodModel.findById(method._id).lean()
      expect(inDb).toBeNull()
    })

    // ─── 3.12 DELETE /:id — order guard ─────────────────────────────────────

    it('returns 400 and keeps method in DB when orders reference its type', async () => {
      const method = await seedPaymentMethod({ type: 'bank_transfer' })

      // Seed an order that references the same payment_method type
      await OrderModel.create({
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
        shipping_method: { id: 'standard', name: 'Standard', price: 0 },
        payment_method: 'bank_transfer',
        subtotal: 100000,
        shipping_fee: 0,
        total: 100000,
      })

      const res = await supertest(app)
        .delete(`/admin/payment-methods/${method._id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(400)

      const inDb = await PaymentMethodModel.findById(method._id).lean()
      expect(inDb).not.toBeNull()
    })

    // ─── 3.13 DELETE /:id — not found ───────────────────────────────────────

    it('returns 404 for valid but non-existent ObjectId', async () => {
      const res = await supertest(app)
        .delete(`/admin/payment-methods/${VALID_NONEXISTENT_ID}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(404)
    })
  })

  // ─── 3.14 PATCH /:id/toggle ───────────────────────────────────────────────

  describe('PATCH /admin/payment-methods/:id/toggle', () => {
    it('returns 200 and flips is_active from true to false in DB', async () => {
      const method = await seedPaymentMethod({ is_active: true })

      const res = await supertest(app)
        .patch(`/admin/payment-methods/${method._id}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)

      const inDb = await PaymentMethodModel.findById(method._id).lean()
      expect(inDb!.is_active).toBe(false)
    })
  })

  // ─── 3.15 PUT /reorder ────────────────────────────────────────────────────

  describe('PUT /admin/payment-methods/reorder', () => {
    it('returns 200 and updates sort_order for both methods in DB', async () => {
      const m1 = await seedPaymentMethod({ type: 'cod', sort_order: 0 })
      const m2 = await seedPaymentMethod({ type: 'bank_transfer', sort_order: 1 })

      const res = await supertest(app)
        .put('/admin/payment-methods/reorder')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [
            { id: m1._id.toString(), sort_order: 5 },
            { id: m2._id.toString(), sort_order: 3 },
          ],
        })

      expect(res.status).toBe(200)

      const updated1 = await PaymentMethodModel.findById(m1._id).lean()
      const updated2 = await PaymentMethodModel.findById(m2._id).lean()
      expect(updated1!.sort_order).toBe(5)
      expect(updated2!.sort_order).toBe(3)
    })

    // ─── 3.16 PUT /reorder — validation ─────────────────────────────────────

    it('returns 422 when items array is empty', async () => {
      const res = await supertest(app)
        .put('/admin/payment-methods/reorder')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ items: [] })

      expect(res.status).toBe(422)
    })
  })
})
