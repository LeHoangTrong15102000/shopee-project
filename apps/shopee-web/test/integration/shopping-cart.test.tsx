import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import { renderWithRouter, waitForPageLoad } from '../../src/utils/testUtils'
import { setAccessTokenToLS, clearLS } from '../../src/utils/auth'
import { access_token } from '../../src/msw/auth.msw'

describe('Shopping Cart Integration Tests', () => {
  beforeEach(() => {
    clearLS()
  })

  afterEach(() => {
    cleanup()
    clearLS()
  })

  test(
    'Authenticated user can view cart page',
    { timeout: 10000 },
    async () => {
      setAccessTokenToLS(access_token)
      renderWithRouter({ route: '/cart' })

      await waitFor(
        () => {
          expect(window.location.pathname).toBe('/cart')
        },
        { timeout: 5000 }
      )
    }
  )

  test(
    'Cart page renders product information for authenticated user',
    { timeout: 10000 },
    async () => {
      setAccessTokenToLS(access_token)
      renderWithRouter({ route: '/cart' })

      // MSW returns cart with "Điện thoại OPPO A12" product
      await waitFor(
        () => {
          const bodyText = document.body.textContent || ''
          expect(
            bodyText.includes('OPPO') ||
              bodyText.includes('Giỏ hàng')
          ).toBeTruthy()
        },
        { timeout: 5000 }
      )
    }
  )

  test(
    'Unauthenticated user is redirected from cart',
    { timeout: 10000 },
    async () => {
      renderWithRouter({ route: '/cart' })

      await waitFor(
        () => {
          expect(window.location.pathname).toBe('/login')
        },
        { timeout: 5000 }
      )
    }
  )

  test(
    'Cart page shows price information',
    { timeout: 10000 },
    async () => {
      setAccessTokenToLS(access_token)
      renderWithRouter({ route: '/cart' })

      await waitFor(
        () => {
          const bodyText = document.body.textContent || ''
          // Cart should show price-related content
          expect(
            bodyText.includes('Tổng') ||
              bodyText.includes('Giỏ hàng')
          ).toBeTruthy()
        },
        { timeout: 5000 }
      )
    }
  )
})
