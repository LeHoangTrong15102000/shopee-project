/// <reference types="jest" />
import supertest from 'supertest'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken, getAdminToken } from '../helpers/auth-helper'
import './setup'

const app = createTestApp()

describe('Auth Integration', () => {
  describe('Register + Login flow', () => {
    it('should register, login, get profile, and logout', async () => {
      const email = 'test@test.com'
      const password = 'Test123456'

      const registerRes = await supertest(app).post('/register').send({ email, password })
      expect(registerRes.status).toBeLessThan(400)

      const loginRes = await supertest(app).post('/login').send({ email, password })
      expect(loginRes.status).toBe(200)
      expect(loginRes.body.data).toHaveProperty('access_token')
      expect(loginRes.body.data).toHaveProperty('refresh_token')
      const { access_token, refresh_token } = loginRes.body.data

      const meRes = await supertest(app).get('/me').set('Authorization', access_token)
      expect(meRes.status).toBe(200)
      expect(meRes.body.data.email).toBe(email)

      // Logout now requires refresh_token in body
      const logoutRes = await supertest(app)
        .post('/logout')
        .set('Authorization', access_token)
        .send({ refresh_token })
      expect(logoutRes.status).toBeLessThan(400)

      // Verify refresh token is deleted — subsequent refresh should fail
      const refreshAfterLogout = await supertest(app)
        .post('/refresh-access-token')
        .send({ refresh_token })
      expect(refreshAfterLogout.status).toBeGreaterThanOrEqual(400)
    })

    it('should allow access token to work after logout until natural expiry (stateless)', async () => {
      const email = 'stateless@test.com'
      const password = 'Test123456'

      await supertest(app).post('/register').send({ email, password })

      const loginRes = await supertest(app).post('/login').send({ email, password })
      const { access_token, refresh_token } = loginRes.body.data

      // Logout with refresh_token
      await supertest(app)
        .post('/logout')
        .set('Authorization', access_token)
        .send({ refresh_token })

      // Access token should still work (stateless — no DB lookup)
      const meAfterLogout = await supertest(app).get('/me').set('Authorization', access_token)
      expect(meAfterLogout.status).toBe(200)

      // But refresh should fail (RT deleted)
      const refreshAfterLogout = await supertest(app)
        .post('/refresh-access-token')
        .send({ refresh_token })
      expect(refreshAfterLogout.status).toBeGreaterThanOrEqual(400)
    })

    it('should return 422 when registering with duplicate email', async () => {
      const email = 'duplicate@test.com'
      const password = 'Test123456'

      await supertest(app).post('/register').send({ email, password })

      const duplicateRes = await supertest(app).post('/register').send({ email, password })
      expect(duplicateRes.status).toBe(422)
    })
  })

  describe('Login errors', () => {
    it('should return error when login with wrong password', async () => {
      const email = 'wrongpass@test.com'
      const password = 'Test123456'

      await supertest(app).post('/register').send({ email, password })

      const loginRes = await supertest(app)
        .post('/login')
        .send({ email, password: 'WrongPassword123' })
      expect(loginRes.status).toBeGreaterThanOrEqual(400)
    })

    it('should return error when login with non-existent email', async () => {
      const loginRes = await supertest(app)
        .post('/login')
        .send({ email: 'nonexistent@test.com', password: 'Test123456' })
      expect(loginRes.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Refresh token flow', () => {
    it('should get new access token using refresh token', async () => {
      const auth = await getAuthToken(app)
      expect(auth.access_token).toBeDefined()
      expect(auth.refresh_token).toBeDefined()

      const refreshRes = await supertest(app)
        .post('/refresh-access-token')
        .send({ refresh_token: auth.refresh_token })
      expect(refreshRes.status).toBe(200)
      expect(refreshRes.body.data).toHaveProperty('access_token')
    })
  })

  // =================== Task 6.5: Rotation integration tests ===================

  describe('Refresh token rotation flow (6.5)', () => {
    it('should issue new refresh token on each rotation', async () => {
      const auth = await getAuthToken(app)

      // First refresh
      const refresh1 = await supertest(app)
        .post('/refresh-access-token')
        .send({ refresh_token: auth.refresh_token })
      expect(refresh1.status).toBe(200)
      const newRefreshToken1 = refresh1.body.data.refresh_token
      expect(newRefreshToken1).toBeDefined()
      // Should receive a new refresh token (rotation)
      expect(newRefreshToken1).not.toBe(auth.refresh_token)

      // Second refresh using the new token
      const refresh2 = await supertest(app)
        .post('/refresh-access-token')
        .send({ refresh_token: newRefreshToken1 })
      expect(refresh2.status).toBe(200)
      const newRefreshToken2 = refresh2.body.data.refresh_token
      expect(newRefreshToken2).toBeDefined()
    })

    it('should return 401 when replaying old refresh token after rotation', async () => {
      const auth = await getAuthToken(app)
      const originalRefreshToken = auth.refresh_token

      // Rotate once — consumes originalRefreshToken
      const refresh1 = await supertest(app)
        .post('/refresh-access-token')
        .send({ refresh_token: originalRefreshToken })
      expect(refresh1.status).toBe(200)

      // Replay the original (already-rotated) refresh token — should fail
      const replayRes = await supertest(app)
        .post('/refresh-access-token')
        .send({ refresh_token: originalRefreshToken })
      // Reuse of rotated token must be rejected
      expect(replayRes.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('Protected routes', () => {
    it('should return 401 when accessing /me without token', async () => {
      const meRes = await supertest(app).get('/me')
      expect(meRes.status).toBe(401)
    })

    it('should return 401/403 when regular user accesses admin route', async () => {
      const auth = await getAuthToken(app)

      const adminRes = await supertest(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${auth.access_token}`)
      expect([401, 403]).toContain(adminRes.status)
    })

    it('should allow admin to access admin routes', async () => {
      const adminAuth = await getAdminToken(app)

      const adminRes = await supertest(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminAuth.access_token}`)
      expect(adminRes.status).toBe(200)
    })
  })
})
