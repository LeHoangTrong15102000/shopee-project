import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from 'src/test-utils';
import QAPage from './QAPage';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({}) };
});

describe('QAPage', () => {
  it('renders loading state initially', () => {
    renderWithProviders(<QAPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders page title after loading', async () => {
    renderWithProviders(<QAPage />);
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });
});

