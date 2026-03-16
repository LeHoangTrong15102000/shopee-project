import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from 'src/test-utils';
import NotificationListPage from './NotificationListPage';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('NotificationListPage', () => {
  beforeEach(() => mockNavigate.mockClear());

  it('renders notification table after loading', async () => {
    renderWithProviders(<NotificationListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  it('renders page header with title', async () => {
    renderWithProviders(<NotificationListPage />);
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  it('renders create notification buttons', async () => {
    renderWithProviders(<NotificationListPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /tabs.targeted/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tabs.broadcast/i })).toBeInTheDocument();
  });

  it('renders page description', async () => {
    renderWithProviders(<NotificationListPage />);
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument();
    });
  });
});

