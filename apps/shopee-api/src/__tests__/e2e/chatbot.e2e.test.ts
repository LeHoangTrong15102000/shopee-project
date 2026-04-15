/// <reference types="jest" />
import supertest from 'supertest'
import { createTestApp } from '../helpers/create-test-app'
import { clearTestDB } from '../helpers/db-setup'
import { getAuthToken } from '../helpers/auth-helper'
import './setup'

// Mock Anthropic SDK at module level
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          id: 'msg_mock_123',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Hello! I am a mock chatbot response.' }],
          model: 'claude-3-sonnet-20240229',
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 20 },
        }),
      },
    })),
  }
})

const app = createTestApp()

describe('Chatbot Flow E2E', () => {
  let accessToken: string
  let conversationId: string

  beforeEach(async () => {
    await clearTestDB()
  })

  describe('Conversation CRUD', () => {
    it('should create a new conversation', async () => {
      const auth = await getAuthToken(app)
      accessToken = auth.access_token

      const createRes = await supertest(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          message: 'Hello, I need help with my order',
          title: 'Order Help',
        })
      expect(createRes.status).toBe(201)
      expect(createRes.body.data).toHaveProperty('conversationId')
      expect(createRes.body.data).toHaveProperty('totalMessages')
      expect(createRes.body.data.totalMessages).toBeGreaterThan(0)
      conversationId = createRes.body.data.conversationId
    })

    it('should get all conversations for user', async () => {
      const auth = await getAuthToken(app)

      // Create a conversation first
      await supertest(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${auth.access_token}`)
        .send({ message: 'Test conversation' })

      const listRes = await supertest(app)
        .get('/conversations')
        .set('Authorization', `Bearer ${auth.access_token}`)
      expect(listRes.status).toBe(200)
      expect(listRes.body.data).toHaveProperty('conversations')
      expect(Array.isArray(listRes.body.data.conversations)).toBe(true)
    })

    it('should get conversation by id', async () => {
      const auth = await getAuthToken(app)

      const createRes = await supertest(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${auth.access_token}`)
        .send({ message: 'Get by ID test' })
      const convId = createRes.body.data.conversationId

      const getRes = await supertest(app)
        .get(`/conversations/${convId}`)
        .set('Authorization', `Bearer ${auth.access_token}`)
      expect(getRes.status).toBe(200)
      expect(getRes.body.data._id.toString()).toBe(convId.toString())
    })

    it('should send message to existing conversation', async () => {
      const auth = await getAuthToken(app)

      const createRes = await supertest(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${auth.access_token}`)
        .send({ message: 'Initial message' })
      const convId = createRes.body.data.conversationId

      const messageRes = await supertest(app)
        .post(`/conversations/${convId}/messages`)
        .set('Authorization', `Bearer ${auth.access_token}`)
        .send({ message: 'Follow up question' })
      expect(messageRes.status).toBe(200)
      expect(messageRes.body.data.totalMessages).toBeGreaterThan(2)
    })

    it('should delete a conversation', async () => {
      const auth = await getAuthToken(app)

      const createRes = await supertest(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${auth.access_token}`)
        .send({ message: 'Conversation to delete' })
      const convId = createRes.body.data.conversationId

      const deleteRes = await supertest(app)
        .delete(`/conversations/${convId}`)
        .set('Authorization', `Bearer ${auth.access_token}`)
      expect(deleteRes.status).toBe(200)

      // Verify deletion
      const getRes = await supertest(app)
        .get(`/conversations/${convId}`)
        .set('Authorization', `Bearer ${auth.access_token}`)
      expect(getRes.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Authentication requirements', () => {
    it('should require auth to create conversation', async () => {
      const createRes = await supertest(app)
        .post('/conversations')
        .send({ message: 'Unauthorized message' })
      expect(createRes.status).toBe(401)
    })

    it('should require auth to list conversations', async () => {
      const listRes = await supertest(app).get('/conversations')
      expect(listRes.status).toBe(401)
    })

    it('should not allow access to other user conversations', async () => {
      const auth1 = await getAuthToken(app, { email: 'user1@test.com' })
      const auth2 = await getAuthToken(app, { email: 'user2@test.com' })

      const createRes = await supertest(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${auth1.access_token}`)
        .send({ message: 'User 1 conversation' })
      const convId = createRes.body.data.conversationId

      // User 2 tries to access User 1's conversation
      const getRes = await supertest(app)
        .get(`/conversations/${convId}`)
        .set('Authorization', `Bearer ${auth2.access_token}`)
      expect(getRes.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Conversation validation', () => {
    it('should validate message is required', async () => {
      const auth = await getAuthToken(app)

      const createRes = await supertest(app)
        .post('/conversations')
        .set('Authorization', `Bearer ${auth.access_token}`)
        .send({})
      expect(createRes.status).toBeGreaterThanOrEqual(400)
    })

    it('should validate conversation id format', async () => {
      const auth = await getAuthToken(app)

      const getRes = await supertest(app)
        .get('/conversations/invalid-id')
        .set('Authorization', `Bearer ${auth.access_token}`)
      expect(getRes.status).toBeGreaterThanOrEqual(400)
    })
  })
})
