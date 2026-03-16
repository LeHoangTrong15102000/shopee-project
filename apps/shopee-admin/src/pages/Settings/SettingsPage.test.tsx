import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from 'src/test-utils';
import SettingsPage from './SettingsPage';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({}) };
});

describe('SettingsPage', () => {
  it('renders loading state initially', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders page title after loading', async () => {
    renderWithProviders(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  it('renders tabs after loading', async () => {
    renderWithProviders(<SettingsPage />);
    await waitFor(() => {
      expect(screen.getByText('tabs.profile')).toBeInTheDocument();
      expect(screen.getByText('tabs.changePassword')).toBeInTheDocument();
    });
  });
});

