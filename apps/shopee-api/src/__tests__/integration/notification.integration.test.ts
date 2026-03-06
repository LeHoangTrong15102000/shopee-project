/// <reference types="jest" />
import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import './setup'

const app = createTestApp()

describe('Notification Integration', () => {
  let authToken: string

  beforeEach(async () => {
    const auth = await getAuthToken(app)
    authToken = auth.access_token
  })

  describe('GET /notifications', () => {
    it('should return notifications list with authentication', async () => {
      const res = await supertest(app)
        .get('/notifications')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeLessThan(400)
      expect(res.body.data).toBeDefined()
    })

    it('should require authentication', async () => {
      const res = await supertest(app).get('/notifications')

      expect(res.status).toBe(401)
    })
  })

  describe('GET /notifications/unread-count', () => {
    it('should return unread count with authentication', async () => {
      const res = await supertest(app)
        .get('/notifications/unread-count')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeLessThan(400)
    })

    it('should require authentication', async () => {
      const res = await supertest(app).get('/notifications/unread-count')

      expect(res.status).toBe(401)
    })
  })

  describe('PUT /notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const res = await supertest(app)
        .put('/notifications/read-all')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeLessThan(400)
    })

    it('should require authentication', async () => {
      const res = await supertest(app).put('/notifications/read-all')

      expect(res.status).toBe(401)
    })
  })

  describe('PUT /notifications/:id/read', () => {
    it('should handle non-existent notification', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()

      const res = await supertest(app)
        .put(`/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('should require authentication', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()

      const res = await supertest(app).put(`/notifications/${fakeId}/read`)

      expect(res.status).toBe(401)
    })
  })
})

