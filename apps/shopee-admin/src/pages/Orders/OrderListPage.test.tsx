import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from 'src/test-utils';
import OrderListPage from './OrderListPage';
import { server } from '../../../vitest.setup';
import { http, HttpResponse } from 'msw';
import { API_URL } from 'src/msw/msw-utils';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('OrderListPage', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('renders order table after loading', async () => {
    renderWithProviders(<OrderListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  it('renders page header with title', async () => {
    renderWithProviders(<OrderListPage />);
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  it('renders status tabs', async () => {
    renderWithProviders(<OrderListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('renders export button', async () => {
    renderWithProviders(<OrderListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /buttons.exportCsv/i })).toBeInTheDocument();
  });

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/orders`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 });
      }),
    );
    renderWithProviders(<OrderListPage />);
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument();
    });
  });
});

