/// <reference types="jest" />
/**
 * Middleware Chain Integration Tests
 * Tests validation, authentication, request limits, and error handling
 */
import supertest from 'supertest'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import './setup'

const app = createTestApp()

describe('Middleware Chain Integration', () => {
  describe('Zod Validation Middleware', () => {
    it('should return validation error for empty login body', async () => {
      const res = await supertest(app).post('/login').send({})

      expect(res.status).toBe(422)
      expect(res.body.message).toBeDefined()
    })

    it('should return validation error for invalid email format', async () => {
      const res = await supertest(app).post('/login').send({
        email: 'invalid-email',
        password: 'password123',
      })

      expect(res.status).toBe(422)
    })

    it('should return validation error for short password', async () => {
      const res = await supertest(app).post('/login').send({
        email: 'test@test.com',
        password: '123',
      })

      expect(res.status).toBe(422)
    })

    it('should return validation error for empty register body', async () => {
      const res = await supertest(app).post('/register').send({})

      expect(res.status).toBe(422)
    })
  })

  describe('Auth Middleware', () => {
    it('should return 401 for /me without token', async () => {
      const res = await supertest(app).get('/me')

      expect(res.status).toBe(401)
    })

    it('should return 401 for invalid token', async () => {
      const res = await supertest(app).get('/me').set('Authorization', 'Bearer invalid-token')

      expect(res.status).toBe(401)
    })

    it('should return 401 for malformed authorization header', async () => {
      const res = await supertest(app).get('/me').set('Authorization', 'InvalidFormat token123')

      expect(res.status).toBe(401)
    })

    it('should allow access with valid token', async () => {
      const auth = await getAuthToken(app)

      const res = await supertest(app)
        .get('/me')
        .set('Authorization', `Bearer ${auth.access_token}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toBeDefined()
    })
  })

  describe('Request Size Limit Middleware', () => {
    it('should reject oversized request body', async () => {
      const largePayload = { data: 'x'.repeat(2 * 1024 * 1024) }

      const res = await supertest(app).post('/login').send(largePayload)

      expect(res.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('404 Handler', () => {
    it('should return 404 for non-existent GET route', async () => {
      const res = await supertest(app).get('/nonexistent-route-xyz')

      expect(res.status).toBe(404)
    })

    it('should return 404 for non-existent POST route', async () => {
      const res = await supertest(app).post('/nonexistent-route-xyz').send({})

      expect(res.status).toBe(404)
    })

    it('should return 404 for non-existent nested route', async () => {
      const res = await supertest(app).get('/api/v1/nonexistent/nested/route')

      expect(res.status).toBe(404)
    })
  })

  describe('Content-Type Validation', () => {
    it('should handle JSON content type', async () => {
      const res = await supertest(app)
        .post('/login')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ email: 'test@test.com', password: 'password123' }))

      expect(res.status).toBeLessThan(500)
    })
  })

  describe('Error Response Format', () => {
    it('should return consistent error format for validation errors', async () => {
      const res = await supertest(app).post('/login').send({})

      expect(res.body).toHaveProperty('message')
      expect(res.status).toBe(422)
    })

    it('should return consistent error format for auth errors', async () => {
      const res = await supertest(app).get('/me')

      expect(res.body).toHaveProperty('message')
      expect(res.status).toBe(401)
    })

    it('should return consistent error format for 404 errors', async () => {
      const res = await supertest(app).get('/nonexistent')

      expect(res.body).toHaveProperty('message')
      expect(res.status).toBe(404)
    })
  })
})
