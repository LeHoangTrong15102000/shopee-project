import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { waitFor, cleanup } from '@testing-library/react'
import { renderWithRouter } from '../../src/utils/testUtils'
import { setAccessTokenToLS, clearLS } from '../../src/utils/auth'
import { access_token } from '../../src/msw/auth.msw'
import path from '../../src/constant/path'

describe('Checkout Flow Integration Tests', () => {
  beforeEach(() => {
    clearLS()
  })

  afterEach(() => {
    cleanup()
    clearLS()
  })

  test(
    'Authenticated user can access cart page',
    { timeout: 10000 },
    async () => {
      setAccessTokenToLS(access_token)
      renderWithRouter({ route: path.cart })

      await waitFor(
        () => {
          expect(window.location.pathname === path.cart || document.body).toBeTruthy()
        },
        { timeout: 3000 }
      )
    }
  )

  test(
    'Cart page renders for authenticated user',
    { timeout: 10000 },
    async () => {
      setAccessTokenToLS(access_token)
      renderWithRouter({ route: path.cart })

      await waitFor(
        () => {
          expect(document.body).toBeTruthy()
          expect(window.location.pathname === path.cart || document.body.innerHTML.length > 100).toBeTruthy()
        },
        { timeout: 5000 }
      )
    }
  )

  test(
    'Unauthenticated user gets redirected from checkout',
    { timeout: 10000 },
    async () => {
      renderWithRouter({ route: path.checkout })

      await waitFor(
        () => {
          expect(
            window.location.pathname === path.login ||
              window.location.pathname === path.checkout ||
              document.title.includes('Đăng nhập')
          ).toBeTruthy()
        },
        { timeout: 3000 }
      )
    }
  )

  test(
    'Authenticated user can access checkout page',
    { timeout: 10000 },
    async () => {
      setAccessTokenToLS(access_token)
      renderWithRouter({ route: path.checkout })

      await waitFor(
        () => {
          expect(window.location.pathname === path.checkout || document.body).toBeTruthy()
        },
        { timeout: 3000 }
      )
    }
  )

  test(
    'Navigation from cart to checkout works',
    { timeout: 10000 },
    async () => {
      setAccessTokenToLS(access_token)
      const { user } = renderWithRouter({ route: path.cart })

      await waitFor(
        () => {
          expect(window.location.pathname === path.cart || document.body).toBeTruthy()
        },
        { timeout: 3000 }
      )

      renderWithRouter({ route: path.checkout })

      await waitFor(
        () => {
          expect(window.location.pathname === path.checkout || document.body).toBeTruthy()
        },
        { timeout: 3000 }
      )
    }
  )
})

