import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'src/test-utils';
import AnalyticsPage from './AnalyticsPage';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AreaChart: () => <div data-testid="area-chart" />,
  Area: () => null,
  BarChart: () => <div data-testid="bar-chart" />,
  Bar: () => null,
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => null,
  PieChart: () => <div data-testid="pie-chart" />,
  Pie: () => null,
  Cell: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({}) };
});

describe('AnalyticsPage', () => {
  it('renders page title', async () => {
    renderWithProviders(<AnalyticsPage />);
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  it('renders tabs', async () => {
    renderWithProviders(<AnalyticsPage />);
    await waitFor(() => {
      expect(screen.getByText('tabs.topSelling')).toBeInTheDocument();
      expect(screen.getByText('tabs.topViewed')).toBeInTheDocument();
    });
  });

  it('renders page description', async () => {
    renderWithProviders(<AnalyticsPage />);
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument();
    });
  });

  it('renders table after loading', async () => {
    renderWithProviders(<AnalyticsPage />);
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  it('renders analytics stat cards', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnalyticsPage />);
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });
    const chatbotTab = screen.getByRole('tab', { name: /tabs.chatbot/i });
    await user.click(chatbotTab);
    await waitFor(() => {
      expect(screen.getByText('chatbot.totalConversations')).toBeInTheDocument();
    });
    expect(screen.getByText('chatbot.totalMessages')).toBeInTheDocument();
  });
});

