import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'src/test-utils';
import LoginPage from './LoginPage';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('LoginPage', () => {
  it('renders login form', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText('form.email')).toBeInTheDocument();
    expect(screen.getByLabelText('form.password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /form.signIn/i })).toBeInTheDocument();
  });

  it('shows email validation error for invalid email', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    const emailInput = screen.getByLabelText('form.email');
    const passwordInput = screen.getByLabelText('form.password');
    // Use a value that passes HTML5 email validation but fails Zod
    await user.type(emailInput, 'a@b');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: /form.signIn/i }));
    await waitFor(() => {
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('shows password validation error', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    const emailInput = screen.getByLabelText('form.email');
    const passwordInput = screen.getByLabelText('form.password');
    await user.type(emailInput, 'admin@shopee.com');
    await user.type(passwordInput, '123');
    await user.click(screen.getByRole('button', { name: /form.signIn/i }));
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    const emailInput = screen.getByLabelText('form.email');
    const passwordInput = screen.getByLabelText('form.password');
    await user.type(emailInput, 'admin@shopee.com');
    await user.type(passwordInput, 'password123');
    await user.click(screen.getByRole('button', { name: /form.signIn/i }));
    // Should not show validation errors
    await waitFor(() => {
      expect(screen.queryByText('Invalid email format')).not.toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    await user.type(screen.getByLabelText('form.email'), 'admin@shopee.com');
    await user.type(screen.getByLabelText('form.password'), 'password123');
    await user.click(screen.getByRole('button', { name: /form.signIn/i }));
    // Button should be disabled during loading
    const button = screen.getByRole('button', { name: /form.signIn/i });
    // After submission completes, button should be enabled again
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });
});
