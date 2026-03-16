import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from 'src/test-utils';
import LoyaltyPage from './LoyaltyPage';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({}) };
});

describe('LoyaltyPage', () => {
  it('renders page title', async () => {
    renderWithProviders(<LoyaltyPage />);
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  it('renders tabs', async () => {
    renderWithProviders(<LoyaltyPage />);
    await waitFor(() => {
      expect(screen.getByText('tabs.rewards')).toBeInTheDocument();
      expect(screen.getByText('tabs.transactions')).toBeInTheDocument();
    });
  });
});

