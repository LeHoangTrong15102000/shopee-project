/// <reference types="jest" />
import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import { ShopConversationModel } from '@database/models/shop-conversation.model'
import { ShopModel } from '@database/models/shop.model'
import './setup'

const app = createTestApp()

describe('ShopChat Integration', () => {
  let authToken: string
  let userId: string
  let shopId: string
  let conversationId: string

  beforeEach(async () => {
    const auth = await getAuthToken(app)
    authToken = auth.access_token
    userId = auth.user._id

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

    const conv = await ShopConversationModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      shopId: new mongoose.Types.ObjectId(shopId),
      unreadCount: 0,
    })
    conversationId = conv._id.toString()
  })

  describe('GET /shop-conversations', () => {
    it('returns 401 without auth token', async () => {
      const res = await supertest(app).get('/shop-conversations')
      expect(res.status).toBe(401)
    })

    it('returns conversations list when authenticated', async () => {
      const res = await supertest(app)
        .get('/shop-conversations')
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })
  })

  describe('GET /shop-conversations/:id/messages', () => {
    it('returns 401 without auth token', async () => {
      const res = await supertest(app).get(`/shop-conversations/${conversationId}/messages`)
      expect(res.status).toBe(401)
    })

    it('returns messages with cursor pagination when authenticated', async () => {
      const res = await supertest(app)
        .get(`/shop-conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('data')
      expect(res.body.data).toHaveProperty('nextCursor')
    })

    it('accepts cursor param for pagination', async () => {
      const fakeCursor = new mongoose.Types.ObjectId().toString()
      const res = await supertest(app)
        .get(`/shop-conversations/${conversationId}/messages`)
        .query({ cursor: fakeCursor })
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(200)
    })
  })

  describe('POST /shop-conversations/:id/messages', () => {
    it('returns 401 without auth token', async () => {
      const res = await supertest(app)
        .post(`/shop-conversations/${conversationId}/messages`)
        .send({ content: 'hello' })
      expect(res.status).toBe(401)
    })

    it('sends message when authenticated', async () => {
      const res = await supertest(app)
        .post(`/shop-conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'hello world' })
      expect(res.status).toBe(201)
      expect(res.body.data).toBeDefined()
    })

    it('returns 400 when content is empty', async () => {
      const res = await supertest(app)
        .post(`/shop-conversations/${conversationId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: '' })
      expect(res.status).toBe(400)
    })
  })
})
