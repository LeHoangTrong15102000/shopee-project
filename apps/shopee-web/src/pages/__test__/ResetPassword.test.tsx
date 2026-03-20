import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import React from 'react';
import ResetPassword from '../ResetPassword/ResetPassword';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'auth:resetPassword.title': 'Đặt lại mật khẩu',
        'auth:resetPassword.newPassword': 'Mật khẩu mới',
        'auth:resetPassword.confirmPassword': 'Xác nhận mật khẩu',
        'auth:resetPassword.submit': 'Đặt lại mật khẩu',
        'auth:resetPassword.backToLogin': 'Quay lại đăng nhập',
        'auth:resetPassword.invalidLink.title': 'Link không hợp lệ',
        'auth:resetPassword.invalidLink.message':
          'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
        'auth:resetPassword.invalidLink.requestNew': 'Yêu cầu link mới',
        'auth:resetPassword.meta.title': 'Đặt lại mật khẩu',
        'auth:resetPassword.meta.description': 'Đặt lại mật khẩu',
      };
      return translations[key] || key.split(':')[1] || key;
    },
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
}));

vi.mock('src/apis/password-reset.api', () => ({
  default: {
    resetPassword: vi.fn(() => Promise.resolve({ data: { data: {} } })),
  },
}));

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const createWrapper = (token?: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const initialEntries = token ? [`/reset-password?token=${token}`] : ['/reset-password'];
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(MemoryRouter, { initialEntries }, children),
    );
};

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders reset password page with valid token', async () => {
    const Wrapper = createWrapper('valid-token-123');
    const { container } = render(React.createElement(ResetPassword), { wrapper: Wrapper });

    await waitFor(() => {
      expect(container.querySelector('form')).toBeInTheDocument();
    });
  });

  it('displays password input fields with valid token', async () => {
    const Wrapper = createWrapper('valid-token-123');
    const { container } = render(React.createElement(ResetPassword), { wrapper: Wrapper });

    await waitFor(() => {
      const passwordInputs = container.querySelectorAll('input[type="password"]');
      expect(passwordInputs.length).toBe(2);
    });
  });

  it('displays submit button with valid token', async () => {
    const Wrapper = createWrapper('valid-token-123');
    const { container } = render(React.createElement(ResetPassword), { wrapper: Wrapper });

    await waitFor(() => {
      const submitButton = container.querySelector('button[type="submit"]');
      expect(submitButton).toBeInTheDocument();
    });
  });

  it('shows invalid link message when no token', async () => {
    const Wrapper = createWrapper();
    const { container } = render(React.createElement(ResetPassword), { wrapper: Wrapper });

    await waitFor(() => {
      const errorIcon = container.querySelector('.text-red-500');
      expect(errorIcon).toBeInTheDocument();
    });
  });

  it('displays back to login link', async () => {
    const Wrapper = createWrapper('valid-token-123');
    const { container } = render(React.createElement(ResetPassword), { wrapper: Wrapper });

    await waitFor(() => {
      const link = container.querySelector('a[href="/login"]');
      expect(link).toBeInTheDocument();
    });
  });
});
