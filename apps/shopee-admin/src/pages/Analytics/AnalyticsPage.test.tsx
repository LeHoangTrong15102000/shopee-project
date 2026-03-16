import { screen, waitFor } from '@testing-library/react';
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
});

