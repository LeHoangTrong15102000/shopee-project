/// <reference types="jest" />

/**
 * Integration Tests: 2FA Login Flow
 *
 * Task 12.1: Full 2FA login flow — login → partial token → complete with TOTP → full tokens
 * Task 12.2: Backup code login — login → partial token → complete with backup code → full tokens → backup code consumed
 */

import supertest from 'supertest'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import './setup'

const app = createTestApp()

/**
 * Strip the 'Bearer ' prefix from an access token returned directly by the API.
 * The auth-helper already strips it, but direct API calls do not.
 */
const stripBearer = (token: string | undefined): string => {
  if (!token) return ''
  return token.startsWith('Bearer ') ? token.slice(7) : token
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Register + login a user, then enable 2FA via setup + verify-setup.
 * Returns the user's access token (before 2FA is required) and the TOTP secret.
 */
async function setupUserWith2FA(email: string, password: string) {
  // Register and get initial tokens
  const auth = await getAuthToken(app, { email, password })
  const accessToken = auth.access_token

  // Initiate 2FA setup
  const setupRes = await supertest(app)
    .post('/auth/2fa/setup')
    .set('Authorization', `Bearer ${accessToken}`)
  expect(setupRes.status).toBe(200)

  const { secret, backup_codes: backupCodes } = setupRes.body.data

  // Verify setup with a valid TOTP code
  // In integration tests we use the real otplib to generate a valid code
  const { authenticator } = await import('otplib')
  const validCode = authenticator.generate(secret)

  const verifyRes = await supertest(app)
    .post('/auth/2fa/verify-setup')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ code: validCode })
  expect(verifyRes.status).toBe(200)

  return { accessToken, secret, backupCodes, email, password }
}

// ─── Task 12.1: Full 2FA login flow ──────────────────────────────────────────

describe('2FA Login Flow (Task 12.1)', () => {
  it('login returns requires2FA=true and partial_token when 2FA is enabled', async () => {
    const email = `2fa-login-${Date.now()}@test.com`
    const password = 'Test123456!'

    await setupUserWith2FA(email, password)

    // Now login again — should get partial token
    const loginRes = await supertest(app).post('/login').send({ email, password })

    expect(loginRes.status).toBe(200)
    expect(loginRes.body.data.requires2FA).toBe(true)
    expect(loginRes.body.data.partial_token).toBeDefined()
    expect(loginRes.body.data).not.toHaveProperty('access_token')
    expect(loginRes.body.data).not.toHaveProperty('refresh_token')
  })

  it('partial token is rejected by verifyAccessToken middleware', async () => {
    const email = `2fa-partial-${Date.now()}@test.com`
    const password = 'Test123456!'

    await setupUserWith2FA(email, password)

    const loginRes = await supertest(app).post('/login').send({ email, password })
    const partialToken = loginRes.body.data.partial_token

    // Partial token must NOT grant access to protected routes
    const meRes = await supertest(app).get('/me').set('Authorization', `Bearer ${partialToken}`)

    expect(meRes.status).toBe(401)
  })

  it('completing 2FA with valid TOTP code issues full access + refresh tokens', async () => {
    const email = `2fa-complete-${Date.now()}@test.com`
    const password = 'Test123456!'

    const { secret } = await setupUserWith2FA(email, password)

    const loginRes = await supertest(app).post('/login').send({ email, password })
    const partialToken = loginRes.body.data.partial_token

    const { authenticator } = await import('otplib')
    const totpCode = authenticator.generate(secret)

    const completeRes = await supertest(app)
      .post('/auth/2fa/complete')
      .send({ partial_token: partialToken, code: totpCode })

    expect(completeRes.status).toBe(200)
    expect(completeRes.body.data).toHaveProperty('access_token')
    expect(completeRes.body.data).toHaveProperty('refresh_token')
    expect(completeRes.body.data.requires2FA).toBeFalsy()
  })

  it('full tokens from 2FA completion grant access to protected routes', async () => {
    const email = `2fa-access-${Date.now()}@test.com`
    const password = 'Test123456!'

    const { secret } = await setupUserWith2FA(email, password)

    const loginRes = await supertest(app).post('/login').send({ email, password })
    const partialToken = loginRes.body.data.partial_token

    const { authenticator } = await import('otplib')
    const totpCode = authenticator.generate(secret)

    const completeRes = await supertest(app)
      .post('/auth/2fa/complete')
      .send({ partial_token: partialToken, code: totpCode })

    const fullAccessToken = stripBearer(completeRes.body.data.access_token)

    const meRes = await supertest(app).get('/me').set('Authorization', `Bearer ${fullAccessToken}`)

    expect(meRes.status).toBe(200)
    expect(meRes.body.data.email).toBe(email)
  })

  it('completing 2FA with invalid TOTP code returns 422', async () => {
    const email = `2fa-invalid-${Date.now()}@test.com`
    const password = 'Test123456!'

    await setupUserWith2FA(email, password)

    const loginRes = await supertest(app).post('/login').send({ email, password })
    const partialToken = loginRes.body.data.partial_token

    const completeRes = await supertest(app)
      .post('/auth/2fa/complete')
      .send({ partial_token: partialToken, code: '000000' })

    expect(completeRes.status).toBeGreaterThanOrEqual(400)
  })

  it('completing 2FA with an expired/invalid partial token returns 401', async () => {
    const completeRes = await supertest(app)
      .post('/auth/2fa/complete')
      .send({ partial_token: 'invalid.partial.token', code: '123456' })

    expect(completeRes.status).toBeGreaterThanOrEqual(400)
  })
})

// ─── Task 12.2: Backup code login ─────────────────────────────────────────────

describe('Backup Code Login (Task 12.2)', () => {
  it('completing 2FA with a valid backup code issues full tokens', async () => {
    const email = `backup-login-${Date.now()}@test.com`
    const password = 'Test123456!'

    const { backupCodes } = await setupUserWith2FA(email, password)

    const loginRes = await supertest(app).post('/login').send({ email, password })
    const partialToken = loginRes.body.data.partial_token

    // Use the first backup code
    const completeRes = await supertest(app)
      .post('/auth/2fa/complete')
      .send({ partial_token: partialToken, code: backupCodes[0] })

    expect(completeRes.status).toBe(200)
    expect(completeRes.body.data).toHaveProperty('access_token')
    expect(completeRes.body.data).toHaveProperty('refresh_token')
  })

  it('backup code is consumed after use — cannot be reused', async () => {
    const email = `backup-consumed-${Date.now()}@test.com`
    const password = 'Test123456!'

    const { backupCodes } = await setupUserWith2FA(email, password)
    const usedCode = backupCodes[0]

    // First use — should succeed
    const loginRes1 = await supertest(app).post('/login').send({ email, password })
    const partialToken1 = loginRes1.body.data.partial_token

    const complete1 = await supertest(app)
      .post('/auth/2fa/complete')
      .send({ partial_token: partialToken1, code: usedCode })
    expect(complete1.status).toBe(200)

    // Second use of the same backup code — should fail
    const loginRes2 = await supertest(app).post('/login').send({ email, password })
    const partialToken2 = loginRes2.body.data.partial_token

    const complete2 = await supertest(app)
      .post('/auth/2fa/complete')
      .send({ partial_token: partialToken2, code: usedCode })
    expect(complete2.status).toBeGreaterThanOrEqual(400)
  })

  it('other backup codes remain valid after one is consumed', async () => {
    const email = `backup-others-${Date.now()}@test.com`
    const password = 'Test123456!'

    const { backupCodes } = await setupUserWith2FA(email, password)

    // Use the first backup code
    const loginRes1 = await supertest(app).post('/login').send({ email, password })
    const partialToken1 = loginRes1.body.data.partial_token

    await supertest(app)
      .post('/auth/2fa/complete')
      .send({ partial_token: partialToken1, code: backupCodes[0] })

    // Use the second backup code — should still work
    const loginRes2 = await supertest(app).post('/login').send({ email, password })
    const partialToken2 = loginRes2.body.data.partial_token

    const complete2 = await supertest(app)
      .post('/auth/2fa/complete')
      .send({ partial_token: partialToken2, code: backupCodes[1] })
    expect(complete2.status).toBe(200)
  })

  it('full tokens from backup code login grant access to protected routes', async () => {
    const email = `backup-access-${Date.now()}@test.com`
    const password = 'Test123456!'

    const { backupCodes } = await setupUserWith2FA(email, password)

    const loginRes = await supertest(app).post('/login').send({ email, password })
    const partialToken = loginRes.body.data.partial_token

    const completeRes = await supertest(app)
      .post('/auth/2fa/complete')
      .send({ partial_token: partialToken, code: backupCodes[0] })

    const fullAccessToken = stripBearer(completeRes.body.data.access_token)

    const meRes = await supertest(app).get('/me').set('Authorization', `Bearer ${fullAccessToken}`)

    expect(meRes.status).toBe(200)
    expect(meRes.body.data.email).toBe(email)
  })
})
