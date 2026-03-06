/// <reference types="jest" />
import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import './setup'

const app = createTestApp()

describe('Loyalty Integration', () => {
  let authToken: string

  beforeEach(async () => {
    const auth = await getAuthToken(app)
    authToken = auth.access_token
  })

  describe('GET /loyalty/points', () => {
    it('should return points info with authentication', async () => {
      const res = await supertest(app)
        .get('/loyalty/points')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeLessThan(400)
      expect(res.body.data).toBeDefined()
    })

    it('should require authentication (401 without token)', async () => {
      const res = await supertest(app).get('/loyalty/points')

      expect(res.status).toBe(401)
    })
  })

  describe('GET /loyalty/transactions', () => {
    it('should return transactions list with authentication', async () => {
      const res = await supertest(app)
        .get('/loyalty/transactions')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeLessThan(400)
      expect(res.body.data).toBeDefined()
    })
  })

  describe('GET /loyalty/rewards', () => {
    it('should return rewards list with authentication', async () => {
      const res = await supertest(app)
        .get('/loyalty/rewards')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeLessThan(400)
      expect(res.body.data).toBeDefined()
    })
  })

  describe('POST /loyalty/redeem/:rewardId', () => {
    it('should handle non-existent reward', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()

      const res = await supertest(app)
        .post(`/loyalty/redeem/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })
})

