import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithRouter } from 'src/utils/testUtils'
import path from 'src/constant/path'

describe('Register', () => {
  it('renders register form with email, password, and confirm_password fields', async () => {
    renderWithRouter({ route: path.register })

    await waitFor(
      () => {
        expect(document.querySelector('input[name="email"]')).toBeInTheDocument()
      },
      { timeout: 30000 }
    )

    expect(document.querySelector('input[name="password"]')).toBeInTheDocument()
    expect(document.querySelector('input[name="confirm_password"]')).toBeInTheDocument()
  })

  it('shows validation errors when submitting empty form', async () => {
    const { user } = renderWithRouter({ route: path.register })

    await waitFor(
      () => {
        expect(document.querySelector('input[name="email"]')).toBeInTheDocument()
      },
      { timeout: 30000 }
    )

    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement
    // Touch and blur to trigger validation
    await user.click(emailInput)
    await user.tab()

    await waitFor(() => {
      // Should show some validation error
      const errorElements = document.querySelectorAll('[class*="text-red"], [class*="text-danger"]')
      expect(
        errorElements.length > 0 || screen.queryByText(/bắt buộc/i) || screen.queryByText(/required/i)
      ).toBeTruthy()
    })
  })

  it('has link to login page', async () => {
    renderWithRouter({ route: path.register })

    await waitFor(
      () => {
        expect(document.querySelector('input[name="email"]')).toBeInTheDocument()
      },
      { timeout: 30000 }
    )

    // Register page should have a link to login
    const loginLink = screen.queryByText(/Đăng nhập/i)
    expect(loginLink).toBeTruthy()
  })
})
