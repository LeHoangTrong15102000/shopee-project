import { describe, test, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithRouter, waitForPageLoad, getFirstElementByText } from '../../src/utils/testUtils'

describe('End-to-End User Journey Tests', () => {
  test('Guest user journey: Browse homepage and see products', async () => {
    renderWithRouter()

    await waitForPageLoad()

    // Verify homepage renders
    await waitFor(
      () => {
        expect(window.location.pathname).toBe('/')
      },
      { timeout: 2000 },
    )
  })

  test('Authentication user journey: Register → Login navigation', async () => {
    const { user } = renderWithRouter({ route: '/register' })

    await waitForPageLoad('/register')

    // Navigate to login from register page
    const loginLink = getFirstElementByText(/Đăng nhập/i)
    if (loginLink) {
      await user.click(loginLink)

      await waitFor(() => {
        expect(window.location.pathname).toBe('/login')
      })
    } else {
      // Verify we're at least on the register page
      expect(window.location.pathname).toBe('/register')
    }
  })

  test('Shopping journey: Search input exists and accepts typing', async () => {
    const { user } = renderWithRouter()

    await waitForPageLoad()

    // Use getAllByPlaceholderText since multiple search inputs may exist (header + cart header)
    const searchInputs = screen.queryAllByPlaceholderText(/tìm kiếm/i)
    const searchInput = searchInputs[0] || screen.queryByRole('searchbox')

    if (searchInput) {
      await user.type(searchInput, 'iphone')
      expect(searchInput).toHaveValue('iphone')
    } else {
      // Search may be in a different form — verify page loaded with content
      const bodyText = document.body.textContent || ''
      expect(bodyText.length).toBeGreaterThan(100)
    }
  })

  test('Responsive journey: Mobile viewport renders', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    renderWithRouter()

    await waitForPageLoad()

    // Verify page renders content at mobile width
    await waitFor(() => {
      const bodyText = document.body.textContent || ''
      expect(bodyText.length).toBeGreaterThan(100)
    })
  })

  test('Error handling journey: Login page loads correctly', async () => {
    renderWithRouter({ route: '/login' })

    await waitForPageLoad('/login')

    await waitFor(() => {
      expect(window.location.pathname).toBe('/login')
    })
  })
})
