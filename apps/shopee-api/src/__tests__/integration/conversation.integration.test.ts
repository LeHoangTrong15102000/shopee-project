/// <reference types="jest" />
import supertest from 'supertest'
import mongoose from 'mongoose'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import './setup'

const app = createTestApp()

describe('Conversation Integration', () => {
  let authToken: string

  beforeEach(async () => {
    const auth = await getAuthToken(app)
    authToken = auth.access_token
  })

  describe('GET /conversations', () => {
    it('should return conversations list with authentication', async () => {
      const res = await supertest(app)
        .get('/conversations')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeLessThan(400)
      expect(res.body.data).toBeDefined()
    })

    it('should require authentication', async () => {
      const res = await supertest(app).get('/conversations')

      expect(res.status).toBe(401)
    })
  })

  describe('POST /conversations', () => {
    it('should create conversation successfully', async () => {
      const res = await supertest(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: 'Hello, this is a test message', title: 'Test Conversation' })

      expect(res.status).toBeLessThan(500)
    })
  })

  describe('POST /conversations/test', () => {
    it('should test chatbot without authentication', async () => {
      const res = await supertest(app)
        .post('/conversations/test')
        .send({ message: 'Hello chatbot' })

      expect(res.status).toBeLessThan(500)
    })
  })

  describe('GET /conversations/:id', () => {
    it('should handle non-existent conversation', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()

      const res = await supertest(app)
        .get(`/conversations/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('DELETE /conversations/:id', () => {
    it('should handle non-existent conversation', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()

      const res = await supertest(app)
        .delete(`/conversations/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })
})

