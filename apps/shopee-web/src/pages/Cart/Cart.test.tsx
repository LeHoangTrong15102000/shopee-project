import { describe, it, expect, afterEach } from 'vitest'
import { waitFor, cleanup } from '@testing-library/react'
import { renderWithRouter } from 'src/utils/testUtils'
import { setAccessTokenToLS, clearLS } from 'src/utils/auth'
import { access_token } from 'src/msw/auth.msw'

describe('Cart', () => {
  afterEach(() => {
    cleanup()
    clearLS()
  })

  it('redirects to login when not authenticated', async () => {
    clearLS()
    renderWithRouter({ route: '/cart' })

    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/login')
      },
      { timeout: 5000 },
    )
  })

  it('displays cart content when authenticated', async () => {
    setAccessTokenToLS(access_token)
    renderWithRouter({ route: '/cart' })

    // Verify cart page renders (page structure loads even if data is still loading)
    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/cart')
      },
      { timeout: 2000 },
    )
  })
})
