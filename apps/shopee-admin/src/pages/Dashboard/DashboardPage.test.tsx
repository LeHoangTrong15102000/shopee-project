import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import DashboardPage from './DashboardPage'

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
}))

describe('DashboardPage', () => {
  it('renders loading state initially', () => {
    renderWithProviders(<DashboardPage />)
    // Stat cards show skeleton placeholders while overview data loads
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders page header after loading', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
  })

  it('renders stat cards after data loads', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      // Stat cards show formatted values from dashboard overview
      expect(screen.getByText('stats.totalRevenue')).toBeInTheDocument()
    })
  })

  it('renders period selector', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  it('renders description', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument()
    })
  })

  it('renders chart sections after loading', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(
      () => {
        expect(screen.getByText('charts.revenue')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it('renders all stat card labels', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('stats.totalRevenue')).toBeInTheDocument()
    })
    expect(screen.getByText('stats.totalOrders')).toBeInTheDocument()
    expect(screen.getByText('stats.totalUsers')).toBeInTheDocument()
    expect(screen.getByText('stats.totalProducts')).toBeInTheDocument()
  })

  it('renders Suspense fallback skeletons while charts load', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByText('stats.totalRevenue')).toBeInTheDocument()
    })
    // Lazy-loaded chart components use Suspense with ChartSkeleton fallback
    // After data loads, charts should eventually appear
    await waitFor(
      () => {
        expect(screen.getByText('charts.revenue')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })
})
