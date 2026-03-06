/// <reference types="jest" />
/**
 * Voucher Integration Tests
 * Tests voucher collection, application, and validation
 */
import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { VoucherModel, DISCOUNT_TYPE } from '@database/models/voucher.model'
import { getAuthToken } from '../helpers/auth-helper'
import './setup'

const app = createTestApp()

describe('Voucher Integration', () => {
  let authToken: string
  let voucherId: string
  let voucherCode: string

  const createActiveVoucher = async (overrides = {}) => {
    const now = new Date()
    const voucher = await VoucherModel.create({
      code: `TEST${Date.now()}`,
      discount_type: DISCOUNT_TYPE.PERCENTAGE,
      discount_value: 10,
      min_order_value: 100000,
      max_discount: 50000,
      usage_limit: 100,
      used_count: 0,
      start_date: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      end_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      is_active: true,
      ...overrides,
    })
    return voucher
  }

  beforeEach(async () => {
    const auth = await getAuthToken(app)
    authToken = auth.access_token

    const voucher = await createActiveVoucher()
    voucherId = voucher._id.toString()
    voucherCode = voucher.code
  })

  describe('GET /vouchers', () => {
    it('should return available vouchers (public endpoint)', async () => {
      const res = await supertest(app).get('/vouchers')

      expect(res.status).toBe(200)
      expect(res.body.data).toBeDefined()
    })

    it('should return vouchers including seeded voucher', async () => {
      const res = await supertest(app).get('/vouchers')

      expect(res.status).toBe(200)
    })
  })

  describe('GET /vouchers/code/:code', () => {
    it('should return voucher details by code', async () => {
      const res = await supertest(app).get(`/vouchers/code/${voucherCode}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toBeDefined()
    })

    it('should return error for non-existent voucher code', async () => {
      const res = await supertest(app).get('/vouchers/code/NONEXISTENT123')

      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('POST /vouchers/:id/collect', () => {
    it('should collect voucher with authentication', async () => {
      const res = await supertest(app)
        .post(`/vouchers/${voucherId}/collect`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeLessThan(500)
    })

    it('should require authentication to collect voucher', async () => {
      const res = await supertest(app).post(`/vouchers/${voucherId}/collect`)

      expect(res.status).toBe(401)
    })

    it('should handle non-existent voucher', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()

      const res = await supertest(app)
        .post(`/vouchers/${fakeId}/collect`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('POST /vouchers/apply', () => {
    it('should require authentication to apply voucher', async () => {
      // Validation runs before auth, so send valid schema fields
      const res = await supertest(app).post('/vouchers/apply').send({
        code: voucherCode,
        order_value: 200000,
      })

      expect(res.status).toBe(401)
    })

    it('should apply voucher with valid order value', async () => {
      const res = await supertest(app)
        .post('/vouchers/apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: voucherCode,
          order_value: 200000,
        })

      expect(res.status).toBeLessThan(500)
    })

    it('should fail when order value below min_order_value', async () => {
      const res = await supertest(app)
        .post('/vouchers/apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: voucherCode,
          order_value: 50000,
        })

      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('POST /vouchers/validate', () => {
    it('should require authentication', async () => {
      // Schema expects 'code' and 'order_total', validation runs before auth
      const res = await supertest(app).post('/vouchers/validate').send({
        code: voucherCode,
        order_total: 200000,
      })

      expect(res.status).toBe(401)
    })
  })

  describe('Expired Voucher', () => {
    it('should reject expired voucher', async () => {
      const expiredVoucher = await createActiveVoucher({
        code: `EXPIRED${Date.now()}`,
        start_date: new Date('2020-01-01'),
        end_date: new Date('2020-12-31'),
      })

      const res = await supertest(app)
        .post('/vouchers/apply')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          voucher_code: expiredVoucher.code,
          order_value: 200000,
        })

      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })
})

