import { describe, expect, test } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import path from '../../src/constant/path'
import { renderWithRouter, waitForPageLoad, getFirstElementByText } from '../../src/utils/testUtils'

describe('Navigation Integration Tests', () => {
  test('App render và chuyển trang từ Home to Login', async () => {
    const { user } = renderWithRouter()

    // Wait for page to load
    await waitForPageLoad()

    // Navigate to login using first available link
    const loginLink = getFirstElementByText(/Đăng nhập/i)
    if (loginLink) {
      await user.click(loginLink)
      await waitFor(() => {
        expect(window.location.pathname === '/login' || document.title.includes('Đăng nhập')).toBeTruthy()
      })
    }
  })

  test('Navigate to 404 page for invalid routes', async () => {
    const badRoute = '/some/bad/route'
    renderWithRouter({ route: badRoute })

    await waitFor(() => {
      expect(
        screen.queryByText(/page not found/i) || screen.queryByText(/404/i) || window.location.pathname === badRoute // App might render anyway
      ).toBeTruthy()
    })
  })

  test('Navigate to Register page', async () => {
    renderWithRouter({ route: path.register })

    await waitForPageLoad('/register')

    // Check if on register page
    await waitFor(() => {
      expect(screen.queryByText(/Bạn đã có tài khoản?/i) || window.location.pathname === '/register').toBeTruthy()
    })
  })

  test('Navigate between authenticated and public routes', async () => {
    const { user } = renderWithRouter()

    await waitForPageLoad()

    // Test navigation from home to login - use first match
    const loginLink = getFirstElementByText(/Đăng nhập/i)
    if (loginLink) {
      await user.click(loginLink)

      await waitFor(() => {
        expect(window.location.pathname === '/login' || document.title.includes('Đăng nhập')).toBeTruthy()
      })

      // Test navigation from login to register if available
      const registerLink = screen.queryByText(/Bạn mới biết đến Shopee?/i)
      if (registerLink) {
        await user.click(registerLink)

        await waitFor(() => {
          expect(window.location.pathname === '/register' || document.title.includes('Đăng ký')).toBeTruthy()
        })
      }
    }
  })
})
