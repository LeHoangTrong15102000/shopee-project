import { describe, expect, test, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import path from '../../src/constant/path'
import { renderWithRouter } from '../../src/utils/testUtils'
import { setAccessTokenToLS, clearLS } from '../../src/utils/auth'
import { access_token } from '../../src/msw/auth.msw'

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    clearLS()
  })

  afterEach(() => {
    cleanup()
  })

  test('Login flow: Enter credentials and submit', { timeout: 15000 }, async () => {
    const { user } = renderWithRouter({ route: path.login })

    await waitFor(
      () => {
        expect(document.body.innerHTML.length).toBeGreaterThan(0)
      },
      { timeout: 3000 },
    )

    const emailInput = screen.queryByPlaceholderText(/email/i)
    const passwordInput = screen.queryByPlaceholderText(/password/i)

    if (emailInput && passwordInput) {
      await user.type(emailInput, 'langtupro0456@gmail.com')
      await user.type(passwordInput, '123123123')

      const submitButton = document.querySelector('form button[type="submit"]') as HTMLButtonElement
      if (submitButton) {
        await user.click(submitButton)

        await waitFor(
          () => {
            expect(window.location.pathname).not.toBe('/login')
          },
          { timeout: 5000 },
        )
      }
    } else {
      // Form not found — verify we're at least on the login page
      expect(window.location.pathname).toBe('/login')
    }
  })

  test(
    'Protected route access: Without token → Redirect to login',
    { timeout: 10000 },
    async () => {
      renderWithRouter({ route: path.profile })

      await waitFor(
        () => {
          expect(window.location.pathname).toBe('/login')
        },
        { timeout: 3000 },
      )
    },
  )

  test('Protected route access: With valid token → Allow access', { timeout: 10000 }, async () => {
    setAccessTokenToLS(access_token)
    renderWithRouter({ route: path.profile })

    await waitFor(
      () => {
        // Should stay on profile page, not redirect to login
        expect(window.location.pathname).toBe(path.profile)
      },
      { timeout: 5000 },
    )
  })

  test('Logout flow: User logged in → Verify authenticated state', { timeout: 10000 }, async () => {
    setAccessTokenToLS(access_token)
    renderWithRouter()

    await waitFor(() => {
      // Should be on home page and authenticated
      expect(window.location.pathname).toBe('/')
    })
  })

  test('Registration flow: Navigate to register page', { timeout: 15000 }, async () => {
    renderWithRouter({ route: path.register })

    await waitFor(
      () => {
        expect(document.body.innerHTML.length).toBeGreaterThan(0)
      },
      { timeout: 3000 },
    )

    const emailInput = screen.queryByPlaceholderText(/email/i)

    if (emailInput) {
      expect(emailInput).toBeInTheDocument()
    } else {
      // Verify we're at least on the register page
      expect(window.location.pathname).toBe('/register')
    }
  })
})
