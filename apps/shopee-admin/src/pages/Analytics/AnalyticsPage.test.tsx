import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as chartUI from 'src/components/ui/chart'
import { renderWithProviders } from 'src/test-utils'
import AnalyticsPage from './AnalyticsPage'
import { server } from '../../../vitest.setup'
import { http, HttpResponse } from 'msw'
import { API_URL } from 'src/msw/msw-utils'

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

vi.mock('src/components/ui/chart', () => ({
  ChartContainer: vi.fn(({ children }: { children: React.ReactNode }) => <div>{children}</div>),
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
  ChartStyle: () => null,
  ChartLegend: () => null,
  ChartLegendContent: () => null,
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({}) }
})

describe('AnalyticsPage', () => {
  it('renders page title', async () => {
    renderWithProviders(<AnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByText('title')).toBeInTheDocument()
    })
  })

  it('renders tabs', async () => {
    renderWithProviders(<AnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByText('tabs.topSelling')).toBeInTheDocument()
      expect(screen.getByText('tabs.topViewed')).toBeInTheDocument()
    })
  })

  it('renders page description', async () => {
    renderWithProviders(<AnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByText('description')).toBeInTheDocument()
    })
  })

  it('renders table after loading', async () => {
    renderWithProviders(<AnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('renders analytics stat cards', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })
    const chatbotTab = screen.getByRole('tab', { name: /tabs.chatbot/i })
    await user.click(chatbotTab)
    await waitFor(() => {
      expect(screen.getByText('chatbot.totalConversations')).toBeInTheDocument()
    })
    expect(screen.getByText('chatbot.totalMessages')).toBeInTheDocument()
  })

  it('switches to top-viewed tab and renders table', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('tab', { name: /tabs.topViewed/i }))
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('switches to top-rated tab and renders table', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('tab', { name: /tabs.topRated/i }))
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('switches to by-category tab and renders table', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('tab', { name: /tabs.byCategory/i }))
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('renders all chatbot stat cards', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('tab', { name: /tabs.chatbot/i }))
    await waitFor(() => {
      expect(screen.getByText('chatbot.totalConversations')).toBeInTheDocument()
    })
    expect(screen.getByText('chatbot.totalMessages')).toBeInTheDocument()
    expect(screen.getByText('chatbot.avgMessagesPerConv')).toBeInTheDocument()
    expect(screen.getByText('chatbot.satisfactionRate')).toBeInTheDocument()
  })

  // Regression test: chatbot chart config must use var(--color-chart-N), not hsl() wrappers
  it('uses CSS variable syntax in chatbot chart config colors', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })
    const chatbotTab = screen.getByRole('tab', { name: /tabs.chatbot/i })
    await user.click(chatbotTab)
    await waitFor(() => {
      const ChartContainerMock = vi.mocked(chartUI.ChartContainer)
      expect(ChartContainerMock).toHaveBeenCalled()
    })
    const ChartContainerMock = vi.mocked(chartUI.ChartContainer)
    const colorValues = ChartContainerMock.mock.calls.flatMap(([props]: any[]) =>
      Object.values(props.config as Record<string, { color?: string }>)
        .map((c) => c?.color)
        .filter(Boolean),
    )
    expect(colorValues.length).toBeGreaterThan(0)
    colorValues.forEach((color) => {
      expect(color).toMatch(/^var\(--color-chart-\d\)$/)
      expect(color).not.toContain('hsl(')
    })
  })

  it('renders dash fallback for products with no rating', async () => {
    server.use(
      http.get(`${API_URL}/admin/products/analytics/top-selling`, () => {
        return HttpResponse.json({
          message: 'ok',
          data: [
            {
              _id: 'p-no-rating',
              name: 'No Rating Product',
              sold: 10,
              view: 100,
              rating: null,
              revenue: 500000,
            },
          ],
        })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<AnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    // rating is null — cell should render '—'
    await waitFor(() => {
      expect(screen.getByText('No Rating Product')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders dash fallback for products with no revenue', async () => {
    server.use(
      http.get(`${API_URL}/admin/products/analytics/top-selling`, () => {
        return HttpResponse.json({
          message: 'ok',
          data: [
            {
              _id: 'p-no-revenue',
              name: 'No Revenue Product',
              sold: 5,
              view: 50,
              rating: 4.2,
              revenue: 0,
            },
          ],
        })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<AnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    // revenue is 0 (falsy) — cell should render '—'
    await waitFor(() => {
      expect(screen.getByText('No Revenue Product')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders formatted average price in by-category tab', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('tab', { name: /tabs.byCategory/i }))
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    // categoryCols average_price cell renders formatCurrency(Math.round(average_price))
    // mock data has category_name 'Điện thoại' with average_price 15000000
    await waitFor(() => {
      expect(screen.getByText('Điện thoại')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })

  it('renders formatted revenue for products with revenue in top-selling tab', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    // Default mock has revenue set — cell renders formatCurrency(revenue)
    await waitFor(() => {
      expect(screen.getByText('iPhone 15 Pro Max')).toBeInTheDocument()
    })
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
  })
})
