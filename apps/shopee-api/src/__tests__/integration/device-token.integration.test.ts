/**
 * Integration tests for device token API endpoints.
 *
 * POST /notifications/device-token — creates/upserts a device token
 * DELETE /notifications/device-token/:id — enforces ownership (403 for wrong user)
 */

/// <reference types="jest" />
import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import './setup'

const app = createTestApp()

const validToken = {
  token: 'fcm-test-token-abc123',
  platform: 'android',
  deviceName: 'Test Device',
}

describe('Device Token API Integration', () => {
  let authToken: string
  let userId: string

  beforeEach(async () => {
    const auth = await getAuthToken(app)
    authToken = auth.access_token
    userId = auth.user._id
  })

  describe('POST /notifications/device-token', () => {
    it('registers a device token and returns 201', async () => {
      const res = await supertest(app)
        .post('/notifications/device-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validToken)

      expect(res.status).toBe(201)
      expect(res.body.data).toBeDefined()
      expect(res.body.data.token).toBe(validToken.token)
      expect(res.body.data.platform).toBe(validToken.platform)
    })

    it('upserts when the same token is registered again', async () => {
      // First registration
      await supertest(app)
        .post('/notifications/device-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validToken)

      // Second registration with same token — should succeed (upsert)
      const res = await supertest(app)
        .post('/notifications/device-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validToken, deviceName: 'Updated Device Name' })

      expect(res.status).toBe(201)
      expect(res.body.data.deviceName).toBe('Updated Device Name')
    })

    it('requires authentication', async () => {
      const res = await supertest(app)
        .post('/notifications/device-token')
        .send(validToken)

      expect(res.status).toBe(401)
    })

    it('rejects missing token field', async () => {
      const res = await supertest(app)
        .post('/notifications/device-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ platform: 'android' })

      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('rejects invalid platform value', async () => {
      const res = await supertest(app)
        .post('/notifications/device-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ token: 'some-token', platform: 'blackberry' })

      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('DELETE /notifications/device-token/:id', () => {
    it('deletes a device token owned by the requesting user', async () => {
      // Register first
      const createRes = await supertest(app)
        .post('/notifications/device-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validToken)

      const tokenId = createRes.body.data._id

      const res = await supertest(app)
        .delete(`/notifications/device-token/${tokenId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeLessThan(400)
    })

    it('returns 403 when a different user tries to delete the token', async () => {
      // Register token as user 1
      const createRes = await supertest(app)
        .post('/notifications/device-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validToken)

      const tokenId = createRes.body.data._id

      // Get a second user's token
      const auth2 = await getAuthToken(app)
      const authToken2 = auth2.access_token

      const res = await supertest(app)
        .delete(`/notifications/device-token/${tokenId}`)
        .set('Authorization', `Bearer ${authToken2}`)

      expect(res.status).toBe(403)
    })

    it('requires authentication', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const res = await supertest(app).delete(`/notifications/device-token/${fakeId}`)

      expect(res.status).toBe(401)
    })

    it('returns an error for a non-existent token ID', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const res = await supertest(app)
        .delete(`/notifications/device-token/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('rejects an invalid (non-ObjectId) token ID', async () => {
      const res = await supertest(app)
        .delete('/notifications/device-token/not-an-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })
})
