/// <reference types="jest" />
import supertest from 'supertest'
import { createTestApp } from '../helpers/create-test-app'
import { clearTestDB } from '../helpers/db-setup'
import { getAuthToken } from '../helpers/auth-helper'
import { VoucherModel, DISCOUNT_TYPE } from '@database/models/voucher.model'
import './setup'

const app = createTestApp()

describe('Loyalty and Voucher Flow E2E', () => {
  let voucherId: string
  let voucherCode: string

  beforeEach(async () => {
    await clearTestDB()
    // Seed a voucher
    const voucher = await VoucherModel.create({
      code: 'TESTDISCOUNT20',
      discount_type: DISCOUNT_TYPE.PERCENTAGE,
      discount_value: 20,
      min_order_value: 100000,
      max_discount: 50000,
      usage_limit: 100,
      used_count: 0,
      start_date: new Date(Date.now() - 86400000), // Yesterday
      end_date: new Date(Date.now() + 86400000 * 30), // 30 days from now
      is_active: true,
    })
    voucherId = voucher._id.toString()
    voucherCode = voucher.code
  })

  describe('Voucher listing', () => {
    it('should get available vouchers', async () => {
      const vouchersRes = await supertest(app)
        .get('/vouchers')
      expect(vouchersRes.status).toBe(200)
      expect(vouchersRes.body.data).toBeDefined()
    })

    it('should get voucher by code', async () => {
      const voucherRes = await supertest(app)
        .get(`/vouchers/code/${voucherCode}`)
      expect(voucherRes.status).toBe(200)
      expect(voucherRes.body.data.code).toBe(voucherCode)
    })
  })

  describe('Voucher collection', () => {
    it('should collect a voucher', async () => {
      const auth = await getAuthToken(app)

      const collectRes = await supertest(app)
        .post(`/vouchers/${voucherId}/collect`)
        .set('Authorization', `Bearer ${auth.access_token}`)
      expect(collectRes.status).toBe(200)
    })

    it('should require authentication to collect voucher', async () => {
      const collectRes = await supertest(app)
        .post(`/vouchers/${voucherId}/collect`)
      expect(collectRes.status).toBe(401)
    })

    it('should not allow collecting same voucher twice', async () => {
      const auth = await getAuthToken(app)

      // First collection
      await supertest(app)
        .post(`/vouchers/${voucherId}/collect`)
        .set('Authorization', `Bearer ${auth.access_token}`)

      // Second collection should fail
      const collectRes = await supertest(app)
        .post(`/vouchers/${voucherId}/collect`)
        .set('Authorization', `Bearer ${auth.access_token}`)
      expect(collectRes.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Voucher application', () => {
    it('should apply voucher to order', async () => {
      const auth = await getAuthToken(app)

      // Collect voucher first
      await supertest(app)
        .post(`/vouchers/${voucherId}/collect`)
        .set('Authorization', `Bearer ${auth.access_token}`)

      // Apply voucher
      const applyRes = await supertest(app)
        .post('/vouchers/apply')
        .set('Authorization', `Bearer ${auth.access_token}`)
        .send({
          code: voucherCode,
          order_total: 200000,
        })
      expect(applyRes.status).toBe(200)
      expect(applyRes.body.data).toHaveProperty('discount')
      // 20% of 200000 = 40000 (within max_discount of 50000)
      expect(applyRes.body.data.discount).toBe(40000)
    })

    it('should respect max_discount limit', async () => {
      const auth = await getAuthToken(app)

      await supertest(app)
        .post(`/vouchers/${voucherId}/collect`)
        .set('Authorization', `Bearer ${auth.access_token}`)

      // Apply voucher with large order
      const applyRes = await supertest(app)
        .post('/vouchers/apply')
        .set('Authorization', `Bearer ${auth.access_token}`)
        .send({
          code: voucherCode,
          order_total: 500000,
        })
      expect(applyRes.status).toBe(200)
      // 20% of 500000 = 100000, but max_discount is 50000
      expect(applyRes.body.data.discount).toBeLessThanOrEqual(50000)
    })

    it('should reject voucher below min_order_value', async () => {
      const auth = await getAuthToken(app)

      await supertest(app)
        .post(`/vouchers/${voucherId}/collect`)
        .set('Authorization', `Bearer ${auth.access_token}`)

      const applyRes = await supertest(app)
        .post('/vouchers/apply')
        .set('Authorization', `Bearer ${auth.access_token}`)
        .send({
          code: voucherCode,
          order_total: 50000, // Below min_order_value of 100000
        })
      expect(applyRes.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Fixed discount voucher', () => {
    it('should apply fixed discount correctly', async () => {
      const auth = await getAuthToken(app)

      // Create fixed discount voucher
      const fixedVoucher = await VoucherModel.create({
        code: 'FIXED50K',
        discount_type: DISCOUNT_TYPE.FIXED,
        discount_value: 50000,
        min_order_value: 100000,
        usage_limit: 100,
        start_date: new Date(Date.now() - 86400000),
        end_date: new Date(Date.now() + 86400000 * 30),
        is_active: true,
      })

      await supertest(app)
        .post(`/vouchers/${fixedVoucher._id}/collect`)
        .set('Authorization', `Bearer ${auth.access_token}`)

      const applyRes = await supertest(app)
        .post('/vouchers/apply')
        .set('Authorization', `Bearer ${auth.access_token}`)
        .send({
          code: 'FIXED50K',
          order_total: 200000,
        })
      expect(applyRes.status).toBe(200)
      expect(applyRes.body.data.discount).toBe(50000)
    })
  })
})

