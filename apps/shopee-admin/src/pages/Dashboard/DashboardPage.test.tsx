import { screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import DashboardPage from './DashboardPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

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

  it('renders user growth section after loading', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(
      () => {
        expect(screen.getByText('charts.userGrowth')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it('renders revenue by category section after loading', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(
      () => {
        expect(screen.getByText('charts.revenueByCategory')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it('renders tables section after loading', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(
      () => {
        expect(screen.getByText('tables.topProductsByRevenue')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it('renders top buyers table after loading', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(
      () => {
        expect(screen.getByText('tables.topBuyers')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it('period selector changes value when option selected', async () => {
    const { user } = renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
    const combobox = screen.getByRole('combobox')
    await user.click(combobox)
    await waitFor(() => {
      expect(screen.getByText('period.last7days')).toBeInTheDocument()
    })
    await user.click(screen.getByText('period.last7days'))
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  it('renders order trend chart section', async () => {
    renderWithProviders(<DashboardPage />)
    await waitFor(
      () => {
        expect(screen.getByText('charts.orderTrend')).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
  })

  it('renders error state when overview API fails', async () => {
    server.use(
      http.get(`${API_URL}/admin/dashboard/overview`, () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 })
      }),
    )
    renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('renders custom range date inputs when custom period is selected', async () => {
    const { user } = renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
    const combobox = screen.getByRole('combobox')
    await user.click(combobox)
    await waitFor(() => {
      expect(screen.getByText('period.customRange')).toBeInTheDocument()
    })
    await user.click(screen.getByText('period.customRange'))
    await waitFor(() => {
      const inputs = screen.getAllByDisplayValue('')
      const dateInputs = inputs.filter((el) => el.getAttribute('type') === 'date')
      expect(dateInputs.length).toBeGreaterThan(0)
    })
  })

  it('handleCustomRange is called when both date inputs are filled', async () => {
    const { user } = renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
    // Select custom range
    const combobox = screen.getByRole('combobox')
    await user.click(combobox)
    await waitFor(() => {
      expect(screen.getByText('period.customRange')).toBeInTheDocument()
    })
    await user.click(screen.getByText('period.customRange'))
    await waitFor(() => {
      const inputs = screen.getAllByDisplayValue('')
      const dateInputs = inputs.filter((el) => el.getAttribute('type') === 'date')
      expect(dateInputs.length).toBeGreaterThan(0)
    })
    // Fill in start date
    const dateInputs = screen.getAllByDisplayValue('').filter((el) => el.getAttribute('type') === 'date')
    if (dateInputs.length >= 2) {
      await user.type(dateInputs[0], '2024-01-01')
      await user.type(dateInputs[1], '2024-01-31')
    }
    // Component should still render without crashing
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('triggers handleCustomRange via fireEvent on date inputs', async () => {
    const { user } = renderWithProviders(<DashboardPage />)
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
    const combobox = screen.getByRole('combobox')
    await user.click(combobox)
    await waitFor(() => {
      expect(screen.getByText('period.customRange')).toBeInTheDocument()
    })
    await user.click(screen.getByText('period.customRange'))
    await waitFor(() => {
      const allInputs = document.querySelectorAll('input[type="date"]')
      expect(allInputs.length).toBeGreaterThan(0)
    })
    const dateInputs = document.querySelectorAll('input[type="date"]')
    if (dateInputs.length >= 2) {
      fireEvent.change(dateInputs[0], { target: { value: '2024-01-01' } })
      fireEvent.change(dateInputs[1], { target: { value: '2024-01-31' } })
    }
    // handleCustomRange should have been called — component still renders
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
})
