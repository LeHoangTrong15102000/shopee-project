import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import { renderWithRouter } from '../../src/utils/testUtils'
import { setAccessTokenToLS, clearLS } from '../../src/utils/auth'
import { access_token } from '../../src/msw/auth.msw'
import path from '../../src/constant/path'

describe('User Settings Integration Tests', () => {
  beforeEach(() => {
    clearLS()
  })

  afterEach(() => {
    cleanup()
    clearLS()
  })

  test(
    'Authenticated user can access profile page',
    { timeout: 10000 },
    async () => {
      setAccessTokenToLS(access_token)
      renderWithRouter({ route: path.profile })

      await waitFor(
        () => {
          expect(window.location.pathname).toBe(path.profile)
        },
        { timeout: 5000 }
      )
    }
  )

  test(
    'Profile page renders user information',
    { timeout: 10000 },
    async () => {
      setAccessTokenToLS(access_token)
      renderWithRouter({ route: path.profile })

      await waitFor(
        () => {
          expect(window.location.pathname).toBe(path.profile)
        },
        { timeout: 5000 }
      )
    }
  )

  test(
    'Authenticated user can access change password page',
    { timeout: 10000 },
    async () => {
      setAccessTokenToLS(access_token)
      renderWithRouter({ route: path.changePassword })

      await waitFor(
        () => {
          expect(window.location.pathname).toBe(path.changePassword)
        },
        { timeout: 5000 }
      )
    }
  )

  test(
    'Unauthenticated user gets redirected from profile',
    { timeout: 10000 },
    async () => {
      renderWithRouter({ route: path.profile })

      await waitFor(
        () => {
          expect(window.location.pathname).toBe('/login')
        },
        { timeout: 5000 }
      )
    }
  )
})
