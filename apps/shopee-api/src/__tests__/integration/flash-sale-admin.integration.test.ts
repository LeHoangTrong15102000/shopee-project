/// <reference types="jest" />

/**
 * Integration Tests: Admin Flash Sale CRUD (Task 10.4)
 * Tests all admin endpoints with real DB
 */

import supertest from 'supertest'
import { createTestApp } from '../helpers/create-test-app'
import { getAdminToken, getAuthToken } from '../helpers/auth-helper'
import './setup'

const app = createTestApp()

describe('Admin Flash Sale CRUD (Task 10.4)', () => {
  let adminToken: string
  let userToken: string

  const validFlashSale = {
    name: 'Integration Test Sale',
    startTime: new Date(Date.now() + 86400_000).toISOString(),
    endTime: new Date(Date.now() + 172800_000).toISOString(),
    products: [
      {
        productId: '507f1f77bcf86cd799439011',
        originalPrice: 100000,
        flashPrice: 50000,
        totalQuantity: 100,
        limitPerUser: 5,
      },
    ],
  }

  beforeEach(async () => {
    const admin = await getAdminToken(app)
    adminToken = admin.access_token
    const user = await getAuthToken(app)
    userToken = user.access_token
  })

  // ─── POST /admin/flash-sales ───────────────────────────────────────────────

  describe('POST /admin/flash-sales', () => {
    it('creates a flash sale with DRAFT status', async () => {
      const res = await supertest(app)
        .post('/admin/flash-sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validFlashSale)

      expect(res.status).toBe(200)
      expect(res.body.data.name).toBe('Integration Test Sale')
      expect(res.body.data.status).toBe('DRAFT')
    })

    it('rejects non-admin users', async () => {
      const res = await supertest(app)
        .post('/admin/flash-sales')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validFlashSale)

      expect(res.status).toBe(403)
    })

    it('rejects invalid body (missing name)', async () => {
      const res = await supertest(app)
        .post('/admin/flash-sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validFlashSale, name: undefined })

      expect(res.status).toBe(422)
    })
  })

  // ─── GET /admin/flash-sales ────────────────────────────────────────────────

  describe('GET /admin/flash-sales', () => {
    it('returns paginated list of flash sales', async () => {
      // Create a flash sale first
      await supertest(app)
        .post('/admin/flash-sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validFlashSale)

      const res = await supertest(app)
        .get('/admin/flash-sales?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toBeDefined()
      expect(Array.isArray(res.body.data.data)).toBe(true)
    })

    it('filters by status', async () => {
      await supertest(app)
        .post('/admin/flash-sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validFlashSale)

      const res = await supertest(app)
        .get('/admin/flash-sales?status=DRAFT')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
    })
  })

  // ─── GET /admin/flash-sales/:id ────────────────────────────────────────────

  describe('GET /admin/flash-sales/:id', () => {
    it('returns flash sale detail', async () => {
      const createRes = await supertest(app)
        .post('/admin/flash-sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validFlashSale)

      const id = createRes.body.data._id

      const res = await supertest(app)
        .get(`/admin/flash-sales/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data._id).toBe(id)
    })

    it('returns 404 for non-existent ID', async () => {
      const res = await supertest(app)
        .get('/admin/flash-sales/507f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(404)
    })
  })

  // ─── PUT /admin/flash-sales/:id ────────────────────────────────────────────

  describe('PUT /admin/flash-sales/:id', () => {
    it('updates a DRAFT flash sale', async () => {
      const createRes = await supertest(app)
        .post('/admin/flash-sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validFlashSale)

      const id = createRes.body.data._id

      const res = await supertest(app)
        .put(`/admin/flash-sales/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Name' })

      expect(res.status).toBe(200)
      expect(res.body.data.name).toBe('Updated Name')
    })
  })

  // ─── DELETE /admin/flash-sales/:id ─────────────────────────────────────────

  describe('DELETE /admin/flash-sales/:id', () => {
    it('hard deletes a DRAFT flash sale', async () => {
      const createRes = await supertest(app)
        .post('/admin/flash-sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validFlashSale)

      const id = createRes.body.data._id

      const res = await supertest(app)
        .delete(`/admin/flash-sales/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.deleted).toBe(true)

      // Verify it's gone
      const getRes = await supertest(app)
        .get(`/admin/flash-sales/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(getRes.status).toBe(404)
    })
  })

  // ─── POST /admin/flash-sales/:id/activate ──────────────────────────────────

  describe('POST /admin/flash-sales/:id/activate', () => {
    it('activates a DRAFT flash sale', async () => {
      const createRes = await supertest(app)
        .post('/admin/flash-sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validFlashSale)

      const id = createRes.body.data._id

      const res = await supertest(app)
        .post(`/admin/flash-sales/${id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('ACTIVE')
    })
  })

  // ─── POST /admin/flash-sales/:id/deactivate ────────────────────────────────

  describe('POST /admin/flash-sales/:id/deactivate', () => {
    it('deactivates an ACTIVE flash sale', async () => {
      const createRes = await supertest(app)
        .post('/admin/flash-sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validFlashSale)

      const id = createRes.body.data._id

      // First activate
      await supertest(app)
        .post(`/admin/flash-sales/${id}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)

      // Then deactivate
      const res = await supertest(app)
        .post(`/admin/flash-sales/${id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('ENDED')
    })
  })

  // ─── GET /admin/flash-sales/:id/stats ──────────────────────────────────────

  describe('GET /admin/flash-sales/:id/stats', () => {
    it('returns stats for a flash sale', async () => {
      const createRes = await supertest(app)
        .post('/admin/flash-sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validFlashSale)

      const id = createRes.body.data._id

      const res = await supertest(app)
        .get(`/admin/flash-sales/${id}/stats`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('totalSold')
      expect(res.body.data).toHaveProperty('totalRevenue')
      expect(res.body.data).toHaveProperty('remainingQuantity')
      expect(res.body.data).toHaveProperty('products')
    })
  })
})
