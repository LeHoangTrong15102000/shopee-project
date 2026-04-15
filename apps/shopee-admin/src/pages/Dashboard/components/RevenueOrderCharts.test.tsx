import { screen } from '@testing-library/react'
import * as chartUI from 'src/components/ui/chart'
import { renderWithProviders } from 'src/test-utils'
import RevenueOrderCharts from './RevenueOrderCharts'

vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => null,
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
}))

vi.mock('src/components/ui/chart', () => ({
  ChartContainer: vi.fn(({ children }: { children: React.ReactNode }) => <div>{children}</div>),
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}))

const sampleRevenue = [{ date: '2024-01', revenue: 100000 }]
const sampleOrderTrend = [{ date: '2024-01', orders: 50 }]

describe('RevenueOrderCharts', () => {
  it('shows empty state for both charts when data is undefined', () => {
    renderWithProviders(<RevenueOrderCharts revenue={undefined} orderTrend={undefined} />)
    expect(screen.getAllByText('charts.noData')).toHaveLength(2)
  })

  it('shows empty state for both charts when arrays are empty', () => {
    renderWithProviders(<RevenueOrderCharts revenue={[]} orderTrend={[]} />)
    expect(screen.getAllByText('charts.noData')).toHaveLength(2)
  })

  it('renders area chart when revenue data is provided', () => {
    renderWithProviders(<RevenueOrderCharts revenue={sampleRevenue} orderTrend={undefined} />)
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
  })

  it('renders line chart when order trend data is provided', () => {
    renderWithProviders(<RevenueOrderCharts revenue={undefined} orderTrend={sampleOrderTrend} />)
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('renders both charts when all data is provided', () => {
    renderWithProviders(
      <RevenueOrderCharts revenue={sampleRevenue} orderTrend={sampleOrderTrend} />,
    )
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  // Regression test: chart configs must use var(--color-chart-N) syntax, not hsl() wrappers
  // This catches any revert to the broken hsl(var(--chart-N)) pattern
  it('uses CSS variable syntax for chart config colors', () => {
    renderWithProviders(
      <RevenueOrderCharts revenue={sampleRevenue} orderTrend={sampleOrderTrend} />,
    )
    const ChartContainerMock = vi.mocked(chartUI.ChartContainer)
    expect(ChartContainerMock).toHaveBeenCalled()
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
})
