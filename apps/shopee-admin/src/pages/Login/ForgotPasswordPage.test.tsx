import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import ForgotPasswordPage from './ForgotPasswordPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

describe('ForgotPasswordPage', () => {
  it('renders page title', async () => {
    renderWithProviders(<ForgotPasswordPage />)
    expect(screen.getByText('forgotPassword.title')).toBeInTheDocument()
  })

  it('renders page description', async () => {
    renderWithProviders(<ForgotPasswordPage />)
    expect(screen.getByText('forgotPassword.description')).toBeInTheDocument()
  })

  it('renders email input', async () => {
    renderWithProviders(<ForgotPasswordPage />)
    expect(screen.getByLabelText('form.email')).toBeInTheDocument()
  })

  it('renders submit button', async () => {
    renderWithProviders(<ForgotPasswordPage />)
    expect(screen.getByRole('button', { name: 'forgotPassword.submit' })).toBeInTheDocument()
  })

  it('renders back to login link', async () => {
    renderWithProviders(<ForgotPasswordPage />)
    expect(screen.getByText('forgotPassword.backToLogin')).toBeInTheDocument()
  })

  it('shows validation error for invalid email', async () => {
    const { user } = renderWithProviders(<ForgotPasswordPage />)
    await user.click(screen.getByRole('button', { name: 'forgotPassword.submit' }))
    await waitFor(() => {
      const emailInput = screen.getByLabelText('form.email')
      expect(emailInput).toHaveAttribute('aria-invalid', 'true')
    })
  })

  it('submits form with valid email and shows success', async () => {
    const { user } = renderWithProviders(<ForgotPasswordPage />)
    await user.type(screen.getByLabelText('form.email'), 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'forgotPassword.submit' }))
    await waitFor(() => {
      expect(screen.getByText('forgotPassword.successMessage')).toBeInTheDocument()
    })
  })

  it('shows error message on API failure', async () => {
    server.use(
      http.post(`${API_URL}/auth/forgot-password`, () => {
        return HttpResponse.json({ message: 'Error' }, { status: 500 })
      }),
    )
    const { user } = renderWithProviders(<ForgotPasswordPage />)
    await user.type(screen.getByLabelText('form.email'), 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'forgotPassword.submit' }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('shows back to login link after success', async () => {
    const { user } = renderWithProviders(<ForgotPasswordPage />)
    await user.type(screen.getByLabelText('form.email'), 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'forgotPassword.submit' }))
    await waitFor(() => {
      expect(screen.getByText('forgotPassword.successMessage')).toBeInTheDocument()
    })
    expect(screen.getByText('forgotPassword.backToLogin')).toBeInTheDocument()
  })
})
