/// <reference types="jest" />
/**
 * Auth Logout Integration Tests
 *
 * Regression test for: POST /logout with an empty body (Content-Length: 0, no
 * Content-Type: application/json) MUST return HTTP 200, never HTTP 500 / E9002.
 *
 * Root cause: body-parser 2.x skips parsing when Content-Type does not match,
 * leaving req.body === undefined. The global normalization middleware added in
 * index.ts (and create-test-app.ts) sets req.body = {} so logoutController's
 * `const { refresh_token } = req.body` never throws a TypeError.
 */
import supertest from 'supertest'
import { createTestApp } from '../helpers/create-test-app'
import { getAuthToken } from '../helpers/auth-helper'
import './setup'

const app = createTestApp()

describe('POST /logout — empty-body regression', () => {
  it('returns 200 (not 500/E9002) when called with no body and no Content-Type', async () => {
    // Obtain a valid access token so verifyAccessToken middleware passes
    const auth = await getAuthToken(app)

    // Simulate the client bug: POST with Content-Length: 0, no Content-Type
    // supertest with no .send() and no .set('Content-Type') reproduces the condition
    const res = await supertest(app)
      .post('/logout')
      .set('Authorization', `Bearer ${auth.access_token}`)
    // No .send() call → Content-Length: 0, no Content-Type header

    expect(res.status).toBe(200)
    expect(res.body.code).not.toBe('E9002')
  })
})
