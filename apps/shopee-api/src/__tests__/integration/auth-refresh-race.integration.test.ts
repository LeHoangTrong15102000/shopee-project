/// <reference types="jest" />
/**
 * Integration test — Task 6.7
 * Two simultaneous /refresh-token calls with the same refresh token (same JTI).
 * Verifies that both return 200, the session is intact, and revokeAllUserTokens
 * is NOT triggered (no cascade logout).
 */
import supertest from 'supertest'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import './setup'

const app = createTestApp()

describe('Concurrent refresh-token rotation race (task 6.7)', () => {
  it('two simultaneous /refresh-access-token calls with the same RT both return 200, session intact', async () => {
    // Arrange: register and log in to get a valid refresh token
    const auth = await getAuthToken(app)
    expect(auth.refresh_token).toBeDefined()

    // Act: fire two refresh calls concurrently with the same refresh token
    const [res1, res2] = await Promise.all([
      supertest(app).post('/refresh-access-token').send({ refresh_token: auth.refresh_token }),
      supertest(app).post('/refresh-access-token').send({ refresh_token: auth.refresh_token }),
    ])

    // Assert: both must succeed — neither should cause a cascade revocation
    expect(res1.status).toBe(200)
    expect(res2.status).toBe(200)

    // Both should carry back access tokens
    expect(res1.body.data).toHaveProperty('access_token')
    expect(res2.body.data).toHaveProperty('access_token')

    // Both should carry back a refresh token (winner's new RT or the grace-path child)
    expect(res1.body.data).toHaveProperty('refresh_token')
    expect(res2.body.data).toHaveProperty('refresh_token')

    // The session should still be usable: verify with the access token from either response
    const survivingAccessToken: string = res1.body.data.access_token
    const meRes = await supertest(app).get('/me').set('Authorization', survivingAccessToken)
    expect(meRes.status).toBe(200)
  })
})
