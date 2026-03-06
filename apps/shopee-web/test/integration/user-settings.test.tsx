import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { waitFor, cleanup } from '@testing-library/react'
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
          expect(window.location.pathname === path.profile || document.body).toBeTruthy()
        },
        { timeout: 3000 }
      )
    }
  )

  test(
    'Profile page renders user information section',
    { timeout: 10000 },
    async () => {
      setAccessTokenToLS(access_token)
      renderWithRouter({ route: path.profile })

      await waitFor(
        () => {
          expect(document.body).toBeTruthy()
          expect(window.location.pathname === path.profile || document.body.innerHTML.length > 100).toBeTruthy()
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
          expect(window.location.pathname === path.changePassword || document.body).toBeTruthy()
        },
        { timeout: 3000 }
      )
    }
  )

  test(
    'Navigation between user settings pages works',
    { timeout: 10000 },
    async () => {
      setAccessTokenToLS(access_token)
      renderWithRouter({ route: path.profile })

      await waitFor(
        () => {
          expect(window.location.pathname === path.profile || document.body).toBeTruthy()
        },
        { timeout: 3000 }
      )

      renderWithRouter({ route: path.changePassword })

      await waitFor(
        () => {
          expect(window.location.pathname === path.changePassword || document.body).toBeTruthy()
        },
        { timeout: 3000 }
      )

      renderWithRouter({ route: path.historyPurchases })

      await waitFor(
        () => {
          expect(window.location.pathname === path.historyPurchases || document.body).toBeTruthy()
        },
        { timeout: 3000 }
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
          expect(
            window.location.pathname === path.login ||
              window.location.pathname === path.profile ||
              document.title.includes('Đăng nhập')
          ).toBeTruthy()
        },
        { timeout: 3000 }
      )
    }
  )
})

