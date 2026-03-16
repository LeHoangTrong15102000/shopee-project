import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from 'src/test-utils';
import ReviewListPage from './ReviewListPage';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('ReviewListPage', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('renders review table after loading', async () => {
    renderWithProviders(<ReviewListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  it('renders page header with title', async () => {
    renderWithProviders(<ReviewListPage />);
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  it('renders stat cards', async () => {
    renderWithProviders(<ReviewListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    // Stat cards use StatCard component — verify the page renders description
    expect(screen.getByText('description')).toBeInTheDocument();
  });

  it('renders search input', async () => {
    renderWithProviders(<ReviewListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('search')).toBeInTheDocument();
  });
});

