/// <reference types="jest" />
import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import { ShopModel } from '@database/models/shop.model'
import './setup'

const app = createTestApp()

describe('Shop Integration', () => {
  let authToken: string
  let shopId: string

  beforeEach(async () => {
    const auth = await getAuthToken(app)
    authToken = auth.access_token

    const shop = await ShopModel.create({
      name: 'Test Shop',
      description: 'A test shop',
      status: 'active',
      followers: [],
      followerCount: 0,
      rating: 4.5,
      owner: new mongoose.Types.ObjectId(),
    })
    shopId = shop._id.toString()
  })

  describe('GET /shops/:id', () => {
    it('returns shop data for valid id', async () => {
      const res = await supertest(app).get(`/shops/${shopId}`)
      expect(res.status).toBe(200)
      expect(res.body.data).toBeDefined()
      expect(res.body.data._id).toBe(shopId)
    })

    it('returns 404 for non-existent shop', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const res = await supertest(app).get(`/shops/${fakeId}`)
      expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('returns isFollowing false for unauthenticated request', async () => {
      const res = await supertest(app).get(`/shops/${shopId}`)
      expect(res.status).toBe(200)
      expect(res.body.data.isFollowing).toBe(false)
    })
  })

  describe('GET /shops/:id/products', () => {
    it('returns products list with pagination', async () => {
      const res = await supertest(app).get(`/shops/${shopId}/products`)
      expect(res.status).toBe(200)
      expect(res.body.data).toBeDefined()
      expect(res.body.data).toHaveProperty('data')
      expect(res.body.data).toHaveProperty('total')
    })

    it('forwards pagination params to service', async () => {
      const res = await supertest(app)
        .get(`/shops/${shopId}/products`)
        .query({ page: '2', limit: '5' })
      expect(res.status).toBe(200)
      expect(res.body.data.page).toBe(2)
      expect(res.body.data.limit).toBe(5)
    })
  })

  describe('POST /shops/:id/follow', () => {
    it('returns 401 without auth token', async () => {
      const res = await supertest(app).post(`/shops/${shopId}/follow`)
      expect(res.status).toBe(401)
    })

    it('follows shop when authenticated', async () => {
      const res = await supertest(app)
        .post(`/shops/${shopId}/follow`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(204)
    })
  })

  describe('DELETE /shops/:id/follow', () => {
    it('returns 401 without auth token', async () => {
      const res = await supertest(app).delete(`/shops/${shopId}/follow`)
      expect(res.status).toBe(401)
    })

    it('unfollows shop when authenticated', async () => {
      // Follow first
      await supertest(app)
        .post(`/shops/${shopId}/follow`)
        .set('Authorization', `Bearer ${authToken}`)

      const res = await supertest(app)
        .delete(`/shops/${shopId}/follow`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(204)
    })
  })
})
