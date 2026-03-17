import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from 'src/test-utils';
import LoginPage from './LoginPage';
import { server } from '../../../vitest.setup';
import { http, HttpResponse } from 'msw';
import { API_URL } from 'src/msw/msw-utils';
import { useAuthStore } from 'src/stores/auth.store';
import authApi from 'src/apis/auth.api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: { from: '/dashboard' } }),
  };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('LoginPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    useAuthStore.getState().logout();
  });

  it('renders login form', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText('form.email')).toBeInTheDocument();
    expect(screen.getByLabelText('form.password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /form.signIn/i })).toBeInTheDocument();
  });

  it('shows email validation error for invalid email', async () => {
    const { user } = renderWithProviders(<LoginPage />);
    await user.type(screen.getByLabelText('form.email'), 'a@b');
    await user.type(screen.getByLabelText('form.password'), 'password123');
    await user.click(screen.getByRole('button', { name: /form.signIn/i }));
    await waitFor(() => {
      expect(screen.getByLabelText('form.email')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('shows password validation error', async () => {
    const { user } = renderWithProviders(<LoginPage />);
    await user.type(screen.getByLabelText('form.email'), 'admin@shopee.com');
    await user.type(screen.getByLabelText('form.password'), '123');
    await user.click(screen.getByRole('button', { name: /form.signIn/i }));
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('successful login - navigates to dashboard', async () => {
    const { user } = renderWithProviders(<LoginPage />);
    await user.type(screen.getByLabelText('form.email'), 'admin@shopee.com');
    await user.type(screen.getByLabelText('form.password'), 'password123');
    await user.click(screen.getByRole('button', { name: /form.signIn/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('shows 401 error message when credentials are wrong', async () => {
    // Mock authApi.login directly to avoid HTTP interceptor refresh-token loop
    const loginSpy = vi.spyOn(authApi, 'login').mockRejectedValueOnce({
      response: { status: 401, data: { message: 'Invalid credentials' } },
    });
    const { user } = renderWithProviders(<LoginPage />);
    await user.type(screen.getByLabelText('form.email'), 'admin@shopee.com');
    await user.type(screen.getByLabelText('form.password'), 'wrongpass1');
    await user.click(screen.getByRole('button', { name: /form.signIn/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('errors.invalidCredentials');
    });
    loginSpy.mockRestore();
  });

  it('shows server error for non-401 errors', async () => {
    const loginSpy = vi.spyOn(authApi, 'login').mockRejectedValueOnce({
      response: { status: 500, data: { message: 'Server error' } },
    });
    const { user } = renderWithProviders(<LoginPage />);
    await user.type(screen.getByLabelText('form.email'), 'admin@shopee.com');
    await user.type(screen.getByLabelText('form.password'), 'password123');
    await user.click(screen.getByRole('button', { name: /form.signIn/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('errors.serverError');
    });
    loginSpy.mockRestore();
  });

  it('dev login button click - calls login store and navigates', async () => {
    const { user } = renderWithProviders(<LoginPage />);
    const devButton = screen.getByRole('button', { name: /dev.loginButton/i });
    await user.click(devButton);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe('admin@shopee.com');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('renders brand title and description', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('description')).toBeInTheDocument();
  });

  it('non-Admin user rejection - shows access denied toast', async () => {
    const { toast } = await import('sonner');
    server.use(
      http.post(`${API_URL}/login`, () => {
        return HttpResponse.json({
          message: 'Success',
          data: {
            access_token: 'token',
            refresh_token: 'refresh',
            user: { _id: '1', email: 'user@test.com', name: 'User', roles: ['User'] },
          },
        });
      }),
    );
    const { user } = renderWithProviders(<LoginPage />);
    await user.type(screen.getByLabelText('form.email'), 'user@test.com');
    await user.type(screen.getByLabelText('form.password'), 'password123');
    await user.click(screen.getByRole('button', { name: /form.signIn/i }));
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('errors.accessDenied');
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
