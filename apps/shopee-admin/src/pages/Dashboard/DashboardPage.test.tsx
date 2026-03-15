import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from 'src/test-utils';
import DashboardPage from './DashboardPage';

// Mock recharts to avoid rendering issues in jsdom
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

describe('DashboardPage', () => {
  it('renders loading state initially', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders page header after loading', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  it('renders stat cards after data loads', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      // Stat cards show formatted values from dashboard overview
      expect(screen.getByText('stats.totalRevenue')).toBeInTheDocument();
    });
  });

  it('renders period selector', async () => {
    renderWithProviders(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });
});
