import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from 'src/test-utils';
import UserListPage from './UserListPage';
import { server } from '../../../vitest.setup';
import { http, HttpResponse } from 'msw';
import { API_URL } from 'src/msw/msw-utils';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('UserListPage', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('renders user table after loading', async () => {
    renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  it('renders page header with add user button', async () => {
    renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /actions.addUser/i })).toBeInTheDocument();
  });

  it('renders search input', async () => {
    renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('search')).toBeInTheDocument();
  });

  it('renders export CSV button', async () => {
    renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /buttons.exportCsv/i })).toBeInTheDocument();
  });

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/users`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 });
      }),
    );
    renderWithProviders(<UserListPage />);
    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument();
    });
  });
});

