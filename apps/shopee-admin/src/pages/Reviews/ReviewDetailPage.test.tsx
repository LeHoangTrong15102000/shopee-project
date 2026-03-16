import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from 'src/test-utils';
import ReviewDetailPage from './ReviewDetailPage';
import { server } from '../../../vitest.setup';
import { http, HttpResponse } from 'msw';
import { API_URL } from 'src/msw/msw-utils';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ id: 'review-1' }) };
});

describe('ReviewDetailPage', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('renders loading state initially', () => {
    renderWithProviders(<ReviewDetailPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders review content after loading', async () => {
    renderWithProviders(<ReviewDetailPage />);
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    expect(screen.getByText('detail.review')).toBeInTheDocument();
    expect(screen.getByText('detail.product')).toBeInTheDocument();
  });

  it('renders page header with title', async () => {
    renderWithProviders(<ReviewDetailPage />);
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    expect(screen.getByText('detail.title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /buttons.back/i })).toBeInTheDocument();
  });

  it('shows error state on API failure', async () => {
    server.use(
      http.get(`${API_URL}/admin/reviews/:id`, () => {
        return HttpResponse.json({ message: 'Not found' }, { status: 404 });
      }),
    );
    renderWithProviders(<ReviewDetailPage />);
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});

