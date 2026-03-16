import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from 'src/test-utils';
import ActivityLogPage from './ActivityLogPage';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({}) };
});

describe('ActivityLogPage', () => {
  it('renders page title', async () => {
    renderWithProviders(<ActivityLogPage />);
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  it('renders empty state when no entries', async () => {
    renderWithProviders(<ActivityLogPage />);
    await waitFor(() => {
      expect(screen.getByText('empty.title')).toBeInTheDocument();
    });
  });
});

