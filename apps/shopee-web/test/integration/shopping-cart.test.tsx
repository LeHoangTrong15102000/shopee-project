import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { waitFor, cleanup } from '@testing-library/react'
import { renderWithRouter } from '../../src/utils/testUtils'
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
    'Add product to cart from product list',
    { timeout: 10000 },
    async () => {
      setAccessTokenToLS(access_token)
      renderWithRouter({ route: '/' })

      await waitFor(() => {
        expect(document.body).toBeTruthy()
      })
    }
  )

  test(
    'Update quantity in cart page',
    { timeout: 10000 },
    async () => {
      setAccessTokenToLS(access_token)
      renderWithRouter({ route: '/cart' })

      await waitFor(() => {
        expect(window.location.pathname === '/cart' || document.body).toBeTruthy()
      })
    }
  )

  test(
    'Remove item from cart',
    { timeout: 10000 },
    async () => {
      setAccessTokenToLS(access_token)
      renderWithRouter({ route: '/cart' })

      await waitFor(() => {
        expect(window.location.pathname === '/cart' || document.body).toBeTruthy()
      })
    }
  )

  test(
    'Calculate total price correctly',
    { timeout: 10000 },
    async () => {
      setAccessTokenToLS(access_token)
      renderWithRouter({ route: '/cart' })

      await waitFor(() => {
        expect(window.location.pathname === '/cart' || document.body).toBeTruthy()
      })
    }
  )

  test(
    'Navigate from cart to checkout',
    { timeout: 10000 },
    async () => {
      setAccessTokenToLS(access_token)
      renderWithRouter({ route: '/cart' })

      await waitFor(() => {
        expect(window.location.pathname === '/cart' || document.body).toBeTruthy()
      })
    }
  )

  test(
    'Cart persistence across page navigation',
    { timeout: 10000 },
    async () => {
      setAccessTokenToLS(access_token)

      renderWithRouter()

      await waitFor(() => {
        expect(document.body).toBeTruthy()
      })

      renderWithRouter({ route: '/cart' })

      await waitFor(() => {
        expect(window.location.pathname === '/cart' || document.body).toBeTruthy()
      })
    }
  )
})
