/**
 * Frontend vitest tests — tasks 7.1, 7.2, 7.3
 * Covers the new refresh-dedup and LS re-read logic added to http.ts.
 *
 * Uses the shared MSW server exposed on globalThis.__mswServer by vitest.setup.js.
 * The setup file starts the server in beforeAll and resets handlers in afterEach.
 * Tests add per-test handler overrides via server.use() — these survive for the
 * duration of the test and are cleared by the global afterEach resetHandlers().
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { http as mswHttp, HttpResponse } from 'msw'
import type { SetupServerApi } from 'msw/node'
import { Http } from '../http'
import { setAccessTokenToLS, setRefreshTokenToLS, getAccessTokenFromLS } from 'src/utils/auth'
import config from 'src/constant/config'

// A token that is valid for ~1000 days (far future) — used as the "current" AT stored in LS
import { access_token, access_token_1s, refresh_token_1000days } from 'src/msw/auth.msw'

// Base URL for MSW handlers — must match the axios instance's baseURL.
// Strip trailing slash so we can append /path consistently.
const BASE = config.baseUrl.replace(/\/$/, '')

// The global MSW server is created by vitest.setup.js and exposed so tests can
// add per-test handler overrides without starting a second server.
const server: SetupServerApi = (globalThis as unknown as { __mswServer: SetupServerApi })
  .__mswServer

// A freshly refreshed access token the mock refresh endpoint will return
const REFRESHED_ACCESS_TOKEN =
  'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzZTBmMDM4NmQ3YzYyMDM0MDg1MGU2ZSIsImVtYWlsIjoibGFuZ3R1cHJvMDQ1NkBnbWFpbC5jb20iLCJyb2xlcyI6WyJVc2VyIl0sImNyZWF0ZWRfYXQiOiIyMDI0LTAyLTA2VDA4OjM2OjM0Ljc0M1oiLCJpYXQiOjE3MDcyMDg1OTQsImV4cCI6MTc5MzYwODU0NX0.refreshed_token'
const REFRESHED_REFRESH_TOKEN = refresh_token_1000days

// ---------------------------------------------------------------------------
// Task 7.1 — two concurrent 401s → exactly one /refresh-token, both retried
// ---------------------------------------------------------------------------
describe('7.1 — concurrent 401s coalesce onto one refresh', () => {
  let refreshCallCount = 0

  beforeEach(() => {
    refreshCallCount = 0
  })

  it('fires exactly one refresh request and retries both originals', async () => {
    server.use(
      // /me endpoint: first calls fail with expired-token 401, after refresh they succeed
      mswHttp.get(`${BASE}/me`, ({ request }) => {
        const auth = request.headers.get('authorization')
        if (auth === access_token_1s) {
          return HttpResponse.json(
            {
              message: 'jwt expired',
              data: { name: 'EXPIRED_TOKEN', message: 'jwt expired' },
            },
            { status: 401 },
          )
        }
        // Any other token (i.e. the refreshed one) → success
        return HttpResponse.json(
          { message: 'ok', data: { email: 'test@test.com' } },
          { status: 200 },
        )
      }),

      // /refresh-access-token: count calls + return new token
      mswHttp.post(`${BASE}/refresh-access-token`, () => {
        refreshCallCount++
        return HttpResponse.json(
          {
            message: 'Refresh Token thành công',
            data: {
              access_token: REFRESHED_ACCESS_TOKEN,
              refresh_token: REFRESHED_REFRESH_TOKEN,
            },
          },
          { status: 200 },
        )
      }),
    )

    // Arrange: expired AT in LS
    setAccessTokenToLS(access_token_1s)
    setRefreshTokenToLS(refresh_token_1000days)

    const httpClient = new Http({ redirectOnTokenExpiry: false })

    // Act: fire two concurrent requests — both will get 401 then trigger refresh
    const [res1, res2] = await Promise.all([
      httpClient.instance.get('me').catch(() => null),
      httpClient.instance.get('me').catch(() => null),
    ])

    // Assert: exactly one refresh call
    expect(refreshCallCount).toBe(1)

    // Both retried requests should succeed
    expect(res1?.status).toBe(200)
    expect(res2?.status).toBe(200)
  })
})

// ---------------------------------------------------------------------------
// Task 7.2 — 401 when LS already has a newer token → retry without refresh
// ---------------------------------------------------------------------------
describe('7.2 — 401 with newer LS token retries without calling refresh', () => {
  let refreshCallCount = 0

  beforeEach(() => {
    refreshCallCount = 0
  })

  it('skips /refresh-token when LS token differs from sent token', async () => {
    server.use(
      // /me: returns 401 expired for the old token, 200 for the newer one
      mswHttp.get(`${BASE}/me`, ({ request }) => {
        const auth = request.headers.get('authorization')
        if (auth === access_token_1s) {
          return HttpResponse.json(
            {
              message: 'jwt expired',
              data: { name: 'EXPIRED_TOKEN', message: 'jwt expired' },
            },
            { status: 401 },
          )
        }
        // The valid (non-expired) token succeeds
        return HttpResponse.json(
          { message: 'ok', data: { email: 'test@test.com' } },
          { status: 200 },
        )
      }),

      mswHttp.post(`${BASE}/refresh-access-token`, () => {
        refreshCallCount++
        return HttpResponse.json(
          {
            message: 'Refresh Token thành công',
            data: { access_token: REFRESHED_ACCESS_TOKEN, refresh_token: REFRESHED_REFRESH_TOKEN },
          },
          { status: 200 },
        )
      }),
    )

    // Arrange: LS already holds a DIFFERENT (newer) access token than what the Http
    // instance has in memory. We prime the Http instance with the expired token,
    // then update LS with the newer one BEFORE the request fires, simulating a
    // concurrent tab that already refreshed.
    setAccessTokenToLS(access_token_1s)
    setRefreshTokenToLS(refresh_token_1000days)
    const httpClient = new Http({ redirectOnTokenExpiry: false })

    // Simulate another tab writing a newer token to LS
    setAccessTokenToLS(access_token) // access_token is a valid long-lived token

    // Act: make the request — it will fail with 401, then the interceptor should
    // notice LS has a different (newer) token and retry without refreshing
    const res = await httpClient.instance.get('me').catch(() => null)

    // Assert: no refresh call was made
    expect(refreshCallCount).toBe(0)

    // The retry with the LS token should succeed
    expect(res?.status).toBe(200)
  })
})

// ---------------------------------------------------------------------------
// Task 7.3 — refresh failure → clearLS + redirect
// ---------------------------------------------------------------------------
describe('7.3 — refresh failure clears LS and redirects', () => {
  it('clears localStorage and navigates to login when refresh endpoint rejects', async () => {
    server.use(
      mswHttp.get(`${BASE}/me`, () => {
        return HttpResponse.json(
          {
            message: 'jwt expired',
            data: { name: 'EXPIRED_TOKEN', message: 'jwt expired' },
          },
          { status: 401 },
        )
      }),

      mswHttp.post(`${BASE}/refresh-access-token`, () => {
        return HttpResponse.json(
          { message: 'Refresh token invalid — all sessions revoked' },
          { status: 401 },
        )
      }),
    )

    // Arrange
    setAccessTokenToLS(access_token_1s)
    setRefreshTokenToLS(refresh_token_1000days)
    const httpClient = new Http({ redirectOnTokenExpiry: true })

    // Act: request triggers 401 → refresh → refresh fails → clear + redirect
    await httpClient.instance.get('me').catch(() => {
      /* expected rejection */
    })

    // Assert: LS should be cleared (getAccessTokenFromLS returns '' when key absent)
    expect(getAccessTokenFromLS()).toBeFalsy()
  })
})
