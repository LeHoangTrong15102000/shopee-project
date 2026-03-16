import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from 'src/test-utils';
import ImportPage from './ImportPage';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({}) };
});

describe('ImportPage', () => {
  it('renders page title', async () => {
    renderWithProviders(<ImportPage />);
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  it('renders stat cards after loading', async () => {
    renderWithProviders(<ImportPage />);
    await waitFor(() => {
      expect(screen.getByText('stats.totalProducts')).toBeInTheDocument();
    });
  });
});

