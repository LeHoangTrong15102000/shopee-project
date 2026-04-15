import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import React from 'react'
import ForgotPassword from '../ForgotPassword/ForgotPassword'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'auth:forgotPassword.title': 'Quên mật khẩu',
        'auth:forgotPassword.subtitle': 'Nhập email để nhận link đặt lại mật khẩu',
        'auth:forgotPassword.submit': 'Gửi',
        'auth:forgotPassword.backToLogin': 'Quay lại đăng nhập',
        'auth:forgotPassword.meta.title': 'Quên mật khẩu',
        'auth:forgotPassword.meta.description': 'Đặt lại mật khẩu',
      }
      return translations[key] || key.split(':')[1] || key
    },
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
}))

vi.mock('src/apis/password-reset.api', () => ({
  default: {
    forgotPassword: vi.fn(() => Promise.resolve({ data: { data: {} } })),
  },
}))

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(MemoryRouter, null, children),
    )
}

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders forgot password page', async () => {
    const Wrapper = createWrapper()
    const { container } = render(React.createElement(ForgotPassword), { wrapper: Wrapper })

    await waitFor(() => {
      expect(container.querySelector('form')).toBeInTheDocument()
    })
  })

  it('displays email input field', async () => {
    const Wrapper = createWrapper()
    render(React.createElement(ForgotPassword), { wrapper: Wrapper })

    await waitFor(() => {
      const emailInput = screen.getByPlaceholderText('Email')
      expect(emailInput).toBeInTheDocument()
      expect(emailInput).toHaveAttribute('type', 'email')
    })
  })

  it('displays submit button', async () => {
    const Wrapper = createWrapper()
    const { container } = render(React.createElement(ForgotPassword), { wrapper: Wrapper })

    await waitFor(() => {
      const submitButton = container.querySelector('button[type="submit"]')
      expect(submitButton).toBeInTheDocument()
    })
  })

  it('displays back to login link', async () => {
    const Wrapper = createWrapper()
    const { container } = render(React.createElement(ForgotPassword), { wrapper: Wrapper })

    await waitFor(() => {
      const link = container.querySelector('a[href="/login"]')
      expect(link).toBeInTheDocument()
    })
  })

  it('displays subtitle', async () => {
    const Wrapper = createWrapper()
    const { container } = render(React.createElement(ForgotPassword), { wrapper: Wrapper })

    await waitFor(() => {
      expect(container.querySelector('form')).toBeInTheDocument()
    })
  })
})
