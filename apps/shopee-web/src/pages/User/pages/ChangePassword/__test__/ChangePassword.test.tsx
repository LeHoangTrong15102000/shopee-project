import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ChangePassword from '../ChangePassword'
import React from 'react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// Provide a profile with hasPassword: true so ChangePasswordForm (not SetPasswordForm) renders
vi.mock('src/contexts/app.context', async () => {
  const React = await vi.importActual<typeof import('react')>('react')
  return {
    AppContext: React.createContext({
      profile: { name: 'Test User', avatar: '', hasPassword: true },
      isAuthenticated: true,
      setIsAuthenticated: vi.fn(),
      setProfile: vi.fn(),
    }),
  }
})

vi.mock('src/i18n/i18n', () => ({
  default: {
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common:validation.passwordMismatch': 'Nhập lại password không khớp!!',
      }
      return translations[key] || key
    },
    use: () => ({ init: () => {} }),
    language: 'vi',
  },
}))

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

vi.mock('src/components/SEO', () => ({
  default: () => <div data-testid="seo" />,
}))

vi.mock('src/components/PasswordStrengthMeter', () => ({
  default: () => <div data-testid="password-strength" />,
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, disabled, type, isLoading, ...props }: any) => (
    <button onClick={onClick} disabled={disabled || isLoading} type={type} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('src/components/Input', () => ({
  default: ({ register, name, type, errorMessage, className }: any) => (
    <div className={className}>
      <input {...(register ? register(name) : {})} type={type} data-testid={`input-${name}`} />
      {errorMessage && <span role="alert">{errorMessage}</span>}
    </div>
  ),
}))

const mockUpdateProfile = vi.fn(() => Promise.resolve({ data: { message: 'Success' } }))
vi.mock('src/apis/user.api', () => ({
  default: {
    updateProfile: (...args: any[]) => mockUpdateProfile(...args),
  },
}))

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn() },
}))

describe('ChangePassword', () => {
  let queryClient: QueryClient

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  beforeEach(() => {
    queryClient = new QueryClient()
    vi.clearAllMocks()
    mockUpdateProfile.mockImplementation(() => Promise.resolve({ data: { message: 'Success' } }))
  })

  it('should render form fields', () => {
    render(<ChangePassword />, { wrapper })
    expect(screen.getByText('changePassword.oldPassword')).toBeInTheDocument()
    expect(screen.getByText('changePassword.newPassword')).toBeInTheDocument()
    expect(screen.getByText('changePassword.confirmPassword')).toBeInTheDocument()
  })

  it('should render security tips', () => {
    render(<ChangePassword />, { wrapper })
    expect(screen.getByText('changePassword.requirements.title')).toBeInTheDocument()
  })

  it('should show validation error for mismatched passwords', async () => {
    render(<ChangePassword />, { wrapper })

    const oldPw = screen.getByTestId('input-password')
    const newPw = screen.getByTestId('input-new_password')
    const confirmPw = screen.getByTestId('input-confirm_password')

    fireEvent.change(oldPw, { target: { value: 'oldpass123' } })
    fireEvent.change(newPw, { target: { value: 'newpass123' } })
    fireEvent.change(confirmPw, { target: { value: 'different123' } })

    const submitButton = screen.getByText('changePassword.confirm')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Nhập lại password không khớp!!')).toBeInTheDocument()
    })
  })

  it('should submit form with valid data', async () => {
    render(<ChangePassword />, { wrapper })

    const oldPw = screen.getByTestId('input-password')
    const newPw = screen.getByTestId('input-new_password')
    const confirmPw = screen.getByTestId('input-confirm_password')

    fireEvent.change(oldPw, { target: { value: 'oldpass123' } })
    fireEvent.change(newPw, { target: { value: 'newpass123' } })
    fireEvent.change(confirmPw, { target: { value: 'newpass123' } })

    const submitButton = screen.getByText('changePassword.confirm')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled()
    })
  })

  it('should show password strength meter', () => {
    render(<ChangePassword />, { wrapper })
    expect(screen.getByTestId('password-strength')).toBeInTheDocument()
  })

  it('should show password requirements checklist', () => {
    render(<ChangePassword />, { wrapper })
    expect(screen.getByText('changePassword.requirements.minLength')).toBeInTheDocument()
    expect(screen.getByText('changePassword.requirements.uppercase')).toBeInTheDocument()
    expect(screen.getByText('changePassword.requirements.lowercase')).toBeInTheDocument()
    expect(screen.getByText('changePassword.requirements.number')).toBeInTheDocument()
    expect(screen.getByText('changePassword.requirements.special')).toBeInTheDocument()
  })

  it('should reset form after successful submission', async () => {
    render(<ChangePassword />, { wrapper })

    const oldPw = screen.getByTestId('input-password') as HTMLInputElement
    const newPw = screen.getByTestId('input-new_password') as HTMLInputElement
    const confirmPw = screen.getByTestId('input-confirm_password') as HTMLInputElement

    fireEvent.change(oldPw, { target: { value: 'oldpass123' } })
    fireEvent.change(newPw, { target: { value: 'newpass123' } })
    fireEvent.change(confirmPw, { target: { value: 'newpass123' } })

    const submitButton = screen.getByText('changePassword.confirm')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(oldPw.value).toBe('')
      expect(newPw.value).toBe('')
      expect(confirmPw.value).toBe('')
    })
  })

  it('should show loading state during submission', async () => {
    mockUpdateProfile.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))

    render(<ChangePassword />, { wrapper })

    const oldPw = screen.getByTestId('input-password')
    const newPw = screen.getByTestId('input-new_password')
    const confirmPw = screen.getByTestId('input-confirm_password')

    fireEvent.change(oldPw, { target: { value: 'oldpass123' } })
    fireEvent.change(newPw, { target: { value: 'newpass123' } })
    fireEvent.change(confirmPw, { target: { value: 'newpass123' } })

    const submitButton = screen.getByText('changePassword.confirm')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('changePassword.processing')).toBeInTheDocument()
    })
  })
})
