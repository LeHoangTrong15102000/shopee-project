import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
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

  test('Authenticated user can access cart page', { timeout: 10000 }, async () => {
    setAccessTokenToLS(access_token)
    renderWithRouter({ route: path.cart })

    await waitFor(
      () => {
        expect(window.location.pathname).toBe(path.cart)
      },
      { timeout: 5000 },
    )
  })

  test('Cart page renders content for authenticated user', { timeout: 10000 }, async () => {
    setAccessTokenToLS(access_token)
    renderWithRouter({ route: path.cart })

    await waitFor(
      () => {
        expect(window.location.pathname).toBe(path.cart)
      },
      { timeout: 5000 },
    )

    // Verify page rendered (header or cart content)
    const bodyText = document.body.textContent || ''
    expect(bodyText.length).toBeGreaterThan(0)
  })

  test('Unauthenticated user gets redirected from checkout', { timeout: 10000 }, async () => {
    renderWithRouter({ route: path.checkout })

    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/login')
      },
      { timeout: 5000 },
    )
  })

  test('Authenticated user can access checkout page', { timeout: 10000 }, async () => {
    setAccessTokenToLS(access_token)
    renderWithRouter({ route: path.checkout })

    await waitFor(
      () => {
        expect(window.location.pathname).toBe(path.checkout)
      },
      { timeout: 5000 },
    )

    // Verify page rendered with content
    const bodyText = document.body.textContent || ''
    expect(bodyText.length).toBeGreaterThan(0)
  })
})
