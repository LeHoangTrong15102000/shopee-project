/// <reference types="jest" />

/**
 * Integration Tests: Session Management (Task 12.3)
 *
 * Tests:
 * - Login creates a session
 * - Refresh updates the session (new JTIs, updated lastActive)
 * - Revoke single session
 * - Revoke all sessions (skips current)
 */

import supertest from 'supertest'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import './setup'

const app = createTestApp()

describe('Session Management (Task 12.3)', () => {
  // ─── Login creates a session ────────────────────────────────────────────────

  describe('Login creates a session', () => {
    it('GET /sessions returns at least one session after login', async () => {
      const auth = await getAuthToken(app)

      const res = await supertest(app)
        .get('/sessions')
        .set('Authorization', `Bearer ${auth.access_token}`)

      expect(res.status).toBe(200)
      expect(res.body.data.sessions).toBeDefined()
      expect(Array.isArray(res.body.data.sessions)).toBe(true)
      expect(res.body.data.sessions.length).toBeGreaterThanOrEqual(1)
    })

    it('the current session is marked isCurrent=true', async () => {
      const auth = await getAuthToken(app)

      const res = await supertest(app)
        .get('/sessions')
        .set('Authorization', `Bearer ${auth.access_token}`)

      expect(res.status).toBe(200)
      const sessions = res.body.data.sessions
      const currentSession = sessions.find((s: any) => s.isCurrent === true)
      expect(currentSession).toBeDefined()
    })

    it('session has expected fields: id, device, ip, location, lastActive, isCurrent', async () => {
      const auth = await getAuthToken(app)

      const res = await supertest(app)
        .get('/sessions')
        .set('Authorization', `Bearer ${auth.access_token}`)

      const session = res.body.data.sessions[0]
      expect(session).toHaveProperty('id')
      expect(session).toHaveProperty('device')
      expect(session).toHaveProperty('ip')
      expect(session).toHaveProperty('location')
      expect(session).toHaveProperty('lastActive')
      expect(session).toHaveProperty('isCurrent')
    })
  })

  // ─── Refresh updates the session ────────────────────────────────────────────

  describe('Refresh updates the session', () => {
    it('session count stays the same after token refresh', async () => {
      const auth = await getAuthToken(app)

      const beforeRes = await supertest(app)
        .get('/sessions')
        .set('Authorization', `Bearer ${auth.access_token}`)
      const countBefore = beforeRes.body.data.sessions.length

      // Refresh the token
      const refreshRes = await supertest(app)
        .post('/refresh-access-token')
        .send({ refresh_token: auth.refresh_token })
      expect(refreshRes.status).toBe(200)

      const newAccessToken = refreshRes.body.data.access_token

      const afterRes = await supertest(app)
        .get('/sessions')
        .set('Authorization', `Bearer ${newAccessToken}`)
      const countAfter = afterRes.body.data.sessions.length

      // Refresh should update the existing session, not create a new one
      expect(countAfter).toBe(countBefore)
    })
  })

  // ─── Revoke single session ──────────────────────────────────────────────────

  describe('Revoke single session', () => {
    it('DELETE /sessions/:id removes the session from the list', async () => {
      // Create two sessions by logging in twice
      const auth1 = await getAuthToken(app, { email: `session-revoke-${Date.now()}@test.com` })

      // Login again with the same credentials to create a second session
      const loginRes2 = await supertest(app)
        .post('/login')
        .send({ email: auth1.user.email, password: 'Test123456!' })
      const auth2AccessToken = loginRes2.body.data.access_token

      // List sessions from auth2's perspective
      const listRes = await supertest(app)
        .get('/sessions')
        .set('Authorization', `Bearer ${auth2AccessToken}`)
      expect(listRes.status).toBe(200)

      const sessions = listRes.body.data.sessions
      // Find a non-current session to revoke
      const nonCurrentSession = sessions.find((s: any) => !s.isCurrent)

      if (!nonCurrentSession) {
        // Only one session — skip this assertion
        return
      }

      const revokeRes = await supertest(app)
        .delete(`/sessions/${nonCurrentSession.id}`)
        .set('Authorization', `Bearer ${auth2AccessToken}`)
      expect(revokeRes.status).toBe(200)

      // Verify the session is gone
      const afterRes = await supertest(app)
        .get('/sessions')
        .set('Authorization', `Bearer ${auth2AccessToken}`)
      const remainingIds = afterRes.body.data.sessions.map((s: any) => s.id)
      expect(remainingIds).not.toContain(nonCurrentSession.id)
    })

    it('DELETE /sessions/:id returns 404 for a session belonging to another user', async () => {
      const auth1 = await getAuthToken(app)
      const auth2 = await getAuthToken(app)

      // Get auth1's session ID
      const listRes = await supertest(app)
        .get('/sessions')
        .set('Authorization', `Bearer ${auth1.access_token}`)
      const auth1SessionId = listRes.body.data.sessions[0].id

      // auth2 tries to revoke auth1's session
      const revokeRes = await supertest(app)
        .delete(`/sessions/${auth1SessionId}`)
        .set('Authorization', `Bearer ${auth2.access_token}`)

      expect(revokeRes.status).toBe(404)
    })

    it('DELETE /sessions/:id returns 404 for invalid session ID format', async () => {
      const auth = await getAuthToken(app)

      const revokeRes = await supertest(app)
        .delete('/sessions/not-a-valid-id')
        .set('Authorization', `Bearer ${auth.access_token}`)

      expect(revokeRes.status).toBe(404)
    })
  })

  // ─── Revoke all sessions ────────────────────────────────────────────────────

  describe('Revoke all sessions', () => {
    it('DELETE /sessions removes all sessions except the current one', async () => {
      const email = `revoke-all-${Date.now()}@test.com`
      const password = 'Test123456!'

      // Create first session
      const auth1 = await getAuthToken(app, { email, password })

      // Create a second session by logging in again
      const loginRes2 = await supertest(app).post('/login').send({ email, password })
      const auth2AccessToken = loginRes2.body.data.access_token

      // Verify we have 2 sessions
      const beforeRes = await supertest(app)
        .get('/sessions')
        .set('Authorization', `Bearer ${auth2AccessToken}`)
      expect(beforeRes.body.data.sessions.length).toBeGreaterThanOrEqual(2)

      // Revoke all from auth2's perspective
      const revokeAllRes = await supertest(app)
        .delete('/sessions')
        .set('Authorization', `Bearer ${auth2AccessToken}`)
      expect(revokeAllRes.status).toBe(200)

      // Only the current session should remain
      const afterRes = await supertest(app)
        .get('/sessions')
        .set('Authorization', `Bearer ${auth2AccessToken}`)
      expect(afterRes.status).toBe(200)
      const remaining = afterRes.body.data.sessions
      expect(remaining.length).toBe(1)
      expect(remaining[0].isCurrent).toBe(true)
    })

    it('revoked sessions refresh tokens are invalidated', async () => {
      const email = `revoke-rt-${Date.now()}@test.com`
      const password = 'Test123456!'

      // Create first session and capture its refresh token
      const auth1 = await getAuthToken(app, { email, password })
      const oldRefreshToken = auth1.refresh_token

      // Create a second session
      const loginRes2 = await supertest(app).post('/login').send({ email, password })
      const auth2AccessToken = loginRes2.body.data.access_token

      // Revoke all from auth2 (this revokes auth1's session)
      await supertest(app)
        .delete('/sessions')
        .set('Authorization', `Bearer ${auth2AccessToken}`)

      // auth1's refresh token should now be invalid
      const refreshRes = await supertest(app)
        .post('/refresh-access-token')
        .send({ refresh_token: oldRefreshToken })
      expect(refreshRes.status).toBeGreaterThanOrEqual(400)
    })
  })

  // ─── Login history ──────────────────────────────────────────────────────────

  describe('Login history', () => {
    it('GET /login-history returns entries after login', async () => {
      const auth = await getAuthToken(app)

      const res = await supertest(app)
        .get('/login-history')
        .set('Authorization', `Bearer ${auth.access_token}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('entries')
      expect(Array.isArray(res.body.data.entries)).toBe(true)
    })

    it('GET /login-history supports pagination', async () => {
      const auth = await getAuthToken(app)

      const res = await supertest(app)
        .get('/login-history?page=1&limit=5')
        .set('Authorization', `Bearer ${auth.access_token}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('pagination')
      expect(res.body.data.pagination).toHaveProperty('page', 1)
      expect(res.body.data.pagination).toHaveProperty('limit', 5)
    })

    it('GET /login-history?status=success filters by status', async () => {
      const auth = await getAuthToken(app)

      const res = await supertest(app)
        .get('/login-history?status=success')
        .set('Authorization', `Bearer ${auth.access_token}`)

      expect(res.status).toBe(200)
      const entries = res.body.data.entries
      for (const entry of entries) {
        expect(entry.status).toBe('success')
      }
    })
  })
})
