/// <reference types="jest" />
import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import { GpsTrackingUpdateModel } from '@database/models/gps-tracking.model'
import './setup'

const app = createTestApp()

describe('GPS Tracking Integration', () => {
  let authToken: string
  let orderId: string

  beforeEach(async () => {
    const auth = await getAuthToken(app)
    authToken = auth.access_token

    // Use a valid ObjectId as orderId (no real order needed for tracking lookup)
    orderId = new mongoose.Types.ObjectId().toString()
  })

  describe('GET /orders/:id/tracking', () => {
    it('returns 401 without auth token', async () => {
      const res = await supertest(app).get(`/orders/${orderId}/tracking`)
      expect(res.status).toBe(401)
    })

    it('returns 404 when no tracking exists for order', async () => {
      const res = await supertest(app)
        .get(`/orders/${orderId}/tracking`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(404)
    })

    it('returns 400 for invalid order id format', async () => {
      const res = await supertest(app)
        .get('/orders/not-a-valid-id/tracking')
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(400)
    })

    it('returns latest tracking record when tracking exists', async () => {
      // Create a tracking record in the DB
      await GpsTrackingUpdateModel.create({
        orderId: new mongoose.Types.ObjectId(orderId),
        status: 'in_transit',
        location: { lat: 10.7769, lng: 106.7009 },
        driverName: 'Test Driver',
        driverPhone: '0901234567',
        vehicleInfo: 'Motorbike',
        estimatedArrival: new Date(Date.now() + 3600000),
        timestamp: new Date(),
      })

      const res = await supertest(app)
        .get(`/orders/${orderId}/tracking`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toBeDefined()
      expect(res.body.data.status).toBe('in_transit')
    })
  })
})
