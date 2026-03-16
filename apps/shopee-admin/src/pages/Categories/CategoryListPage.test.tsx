import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from 'src/test-utils';
import CategoryListPage from './CategoryListPage';
import { server } from '../../../vitest.setup';
import { http, HttpResponse } from 'msw';
import { API_URL } from 'src/msw/msw-utils';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('CategoryListPage', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('renders category table after loading', async () => {
    renderWithProviders(<CategoryListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  it('renders page header with add category button', async () => {
    renderWithProviders(<CategoryListPage />);
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /actions.addCategory/i })).toBeInTheDocument();
  });

  it('renders search input', async () => {
    renderWithProviders(<CategoryListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('search')).toBeInTheDocument();
  });

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/categories`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 });
      }),
    );
    renderWithProviders(<CategoryListPage />);
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument();
    });
  });
});

