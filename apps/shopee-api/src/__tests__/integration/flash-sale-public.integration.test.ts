/// <reference types="jest" />

/**
 * Integration Tests: Public Flash Sale Endpoints (Task 10.5)
 * - Only ACTIVE/ENDED flash sales visible to public
 * - No auth required
 */

import supertest from 'supertest'
import { createTestApp } from '../helpers/create-test-app'
import { getAdminToken } from '../helpers/auth-helper'
import './setup'

const app = createTestApp()

describe('Public Flash Sale Endpoints (Task 10.5)', () => {
  let adminToken: string

  const createAndActivateSale = async (name: string) => {
    const createRes = await supertest(app)
      .post('/admin/flash-sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name,
        startTime: new Date(Date.now() - 3600_000).toISOString(),
        endTime: new Date(Date.now() + 86400_000).toISOString(),
        products: [
          {
            productId: '507f1f77bcf86cd799439011',
            originalPrice: 100000,
            flashPrice: 50000,
            totalQuantity: 100,
            limitPerUser: 5,
          },
        ],
      })

    const id = createRes.body.data._id

    await supertest(app)
      .post(`/admin/flash-sales/${id}/activate`)
      .set('Authorization', `Bearer ${adminToken}`)

    return id
  }

  beforeEach(async () => {
    const admin = await getAdminToken(app)
    adminToken = admin.access_token
  })

  // ─── GET /flash-sales/active ───────────────────────────────────────────────

  describe('GET /flash-sales/active', () => {
    it('returns active flash sales without auth', async () => {
      await createAndActivateSale('Public Active Sale')

      const res = await supertest(app).get('/flash-sales/active')

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBeGreaterThanOrEqual(1)
      expect(res.body.data[0].status).toBe('ACTIVE')
    })

    it('does not return DRAFT flash sales', async () => {
      await supertest(app)
        .post('/admin/flash-sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Draft Sale',
          startTime: new Date(Date.now() + 86400_000).toISOString(),
          endTime: new Date(Date.now() + 172800_000).toISOString(),
          products: [
            {
              productId: '507f1f77bcf86cd799439022',
              originalPrice: 200000,
              flashPrice: 100000,
              totalQuantity: 50,
              limitPerUser: 2,
            },
          ],
        })

      const res = await supertest(app).get('/flash-sales/active')

      expect(res.status).toBe(200)
      const names = res.body.data.map((s: any) => s.name)
      expect(names).not.toContain('Draft Sale')
    })
  })

  // ─── GET /flash-sales/:id ─────────────────────────────────────────────────

  describe('GET /flash-sales/:id', () => {
    it('returns ACTIVE flash sale detail without auth', async () => {
      const id = await createAndActivateSale('Detail Sale')

      const res = await supertest(app).get(`/flash-sales/${id}`)

      expect(res.status).toBe(200)
      expect(res.body.data.name).toBe('Detail Sale')
    })

    it('returns 404 for DRAFT flash sale', async () => {
      const createRes = await supertest(app)
        .post('/admin/flash-sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Hidden Draft',
          startTime: new Date(Date.now() + 86400_000).toISOString(),
          endTime: new Date(Date.now() + 172800_000).toISOString(),
          products: [
            {
              productId: '507f1f77bcf86cd799439033',
              originalPrice: 150000,
              flashPrice: 75000,
              totalQuantity: 30,
              limitPerUser: 1,
            },
          ],
        })

      const id = createRes.body.data._id

      const res = await supertest(app).get(`/flash-sales/${id}`)

      expect(res.status).toBe(404)
    })
  })

  // ─── GET /flash-sales/:id/products ─────────────────────────────────────────

  describe('GET /flash-sales/:id/products', () => {
    it('returns products with stock info for ACTIVE sale', async () => {
      const id = await createAndActivateSale('Products Sale')

      const res = await supertest(app).get(`/flash-sales/${id}/products`)

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBeGreaterThanOrEqual(1)
      expect(res.body.data[0]).toHaveProperty('flash_price')
      expect(res.body.data[0]).toHaveProperty('total_quantity')
      expect(res.body.data[0]).toHaveProperty('sold_quantity')
      expect(res.body.data[0]).toHaveProperty('remaining_quantity')
    })
  })
})
