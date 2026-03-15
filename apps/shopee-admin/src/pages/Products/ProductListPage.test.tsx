import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'src/test-utils';
import ProductListPage from './ProductListPage';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('ProductListPage', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('renders product table after loading', async () => {
    renderWithProviders(<ProductListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  it('renders page header with add product button', async () => {
    renderWithProviders(<ProductListPage />);
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /actions.addProduct/i })).toBeInTheDocument();
  });

  it('renders search input', async () => {
    renderWithProviders(<ProductListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('search')).toBeInTheDocument();
  });
});
