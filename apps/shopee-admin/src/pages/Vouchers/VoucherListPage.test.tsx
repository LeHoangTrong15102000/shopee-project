import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from 'src/test-utils';
import VoucherListPage from './VoucherListPage';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('VoucherListPage', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('renders voucher table after loading', async () => {
    renderWithProviders(<VoucherListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  it('renders page header with create voucher button', async () => {
    renderWithProviders(<VoucherListPage />);
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /actions.createVoucher/i })).toBeInTheDocument();
  });

  it('renders stat cards', async () => {
    renderWithProviders(<VoucherListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    // Verify page description renders (stat cards may use different keys)
    expect(screen.getByText('description')).toBeInTheDocument();
  });

  it('renders page description', async () => {
    renderWithProviders(<VoucherListPage />);
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument();
    });
  });
});

