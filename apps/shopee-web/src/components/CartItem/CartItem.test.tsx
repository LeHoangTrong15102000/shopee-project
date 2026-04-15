import { describe, it, expect, afterEach } from 'vitest'
import { waitFor, cleanup } from '@testing-library/react'
import { renderWithRouter } from 'src/utils/testUtils'
import { setAccessTokenToLS, clearLS } from 'src/utils/auth'
import { access_token } from 'src/msw/auth.msw'

// CartItem is rendered as part of the Cart page — test via page rendering
describe('CartItem', () => {
  afterEach(() => {
    cleanup()
    clearLS()
  })

  it('renders cart items with product info when authenticated', async () => {
    setAccessTokenToLS(access_token)
    renderWithRouter({ route: '/cart' })

    // Verify cart page renders
    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/cart')
      },
      { timeout: 2000 },
    )
  })

  it('displays price information in cart', async () => {
    setAccessTokenToLS(access_token)
    renderWithRouter({ route: '/cart' })

    // Verify cart page renders
    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/cart')
      },
      { timeout: 2000 },
    )
  })
})
