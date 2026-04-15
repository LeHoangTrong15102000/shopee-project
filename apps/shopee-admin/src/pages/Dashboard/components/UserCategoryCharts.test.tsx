import { screen } from '@testing-library/react'
import * as chartUI from 'src/components/ui/chart'
import * as recharts from 'recharts'
import { renderWithProviders } from 'src/test-utils'
import UserCategoryCharts from './UserCategoryCharts'

vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  Cell: vi.fn((_props: { fill: string }) => null),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
}))

vi.mock('src/components/ui/chart', () => ({
  ChartContainer: vi.fn(({ children }: { children: React.ReactNode }) => <div>{children}</div>),
  ChartTooltip: () => null,
  ChartTooltipContent: () => null,
}))

const sampleUserGrowth = [{ date: '2024-01', users: 100 }]
const sampleRevenueByCategory = [
  { category: 'Electronics', revenue: 50000, percent: 0.5 },
  { category: 'Clothing', revenue: 30000, percent: 0.3 },
]

describe('UserCategoryCharts', () => {
  it('shows empty state for both charts when data is undefined', () => {
    renderWithProviders(<UserCategoryCharts userGrowth={undefined} revenueByCategory={undefined} />)
    expect(screen.getAllByText('charts.noData')).toHaveLength(2)
  })

  it('shows empty state for both charts when arrays are empty', () => {
    renderWithProviders(<UserCategoryCharts userGrowth={[]} revenueByCategory={[]} />)
    expect(screen.getAllByText('charts.noData')).toHaveLength(2)
  })

  it('renders bar chart when user growth data is provided', () => {
    renderWithProviders(
      <UserCategoryCharts userGrowth={sampleUserGrowth} revenueByCategory={undefined} />,
    )
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('renders pie chart when revenue by category data is provided', () => {
    renderWithProviders(
      <UserCategoryCharts userGrowth={undefined} revenueByCategory={sampleRevenueByCategory} />,
    )
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()
  })

  // Regression test: Cell fills must use var(--color-chart-N) syntax, not hsl()
  // This catches any revert to the broken hsl(var(--chart-N)) pattern
  it('uses CSS variable syntax for chart Cell fills', () => {
    renderWithProviders(
      <UserCategoryCharts
        userGrowth={sampleUserGrowth}
        revenueByCategory={sampleRevenueByCategory}
      />,
    )
    const CellMock = vi.mocked(recharts.Cell)
    expect(CellMock).toHaveBeenCalled()
    CellMock.mock.calls.forEach(([props]) => {
      const fill = (props as { fill: string }).fill
      expect(fill).toMatch(/^var\(--color-chart-\d\)$/)
      expect(fill).not.toContain('hsl(')
    })
  })
})
