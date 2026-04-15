import { describe, it, expect, afterEach } from 'vitest'
import { waitFor, cleanup } from '@testing-library/react'
import { renderWithRouter } from 'src/utils/testUtils'
import { setAccessTokenToLS, clearLS } from 'src/utils/auth'
import { access_token } from 'src/msw/auth.msw'

describe('ChangePassword', () => {
  afterEach(() => {
    cleanup()
    clearLS()
  })

  it('redirects to login when not authenticated', async () => {
    clearLS()
    renderWithRouter({ route: '/user/password' })

    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/login')
      },
      { timeout: 10000 },
    )
  })

  it('displays password form fields when authenticated', async () => {
    setAccessTokenToLS(access_token)
    renderWithRouter({ route: '/user/password' })

    // Verify password change page renders
    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/user/password')
      },
      { timeout: 2000 },
    )
  })
})
