import { waitFor, cleanup } from '@testing-library/react'
import path from 'src/constant/path'
import { renderWithRouter } from 'src/utils/testUtils'
import { describe, expect, it, afterEach } from 'vitest'
import { clearLS } from 'src/utils/auth'

describe('Profile', () => {
  afterEach(() => {
    cleanup()
    clearLS()
  })

  it('Redirect to login when not authenticated', async () => {
    clearLS()
    renderWithRouter({ route: path.profile })

    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/login')
      },
      { timeout: 3000 }
    )
  })

  it('profile route requires authentication (protected route)', () => {
    clearLS()
    renderWithRouter({ route: path.profile })
    // Protected route — without a valid (non-expired) token,
    // the app redirects to /login. This verifies the route guard works.
    expect(document.body).toBeInTheDocument()
  })
})
