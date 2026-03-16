import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from 'src/test-utils';
import InventoryPage from './InventoryPage';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({}) };
});

describe('InventoryPage', () => {
  it('renders page title', async () => {
    renderWithProviders(<InventoryPage />);
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  it('renders tabs after loading', async () => {
    renderWithProviders(<InventoryPage />);
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });
  });
});

