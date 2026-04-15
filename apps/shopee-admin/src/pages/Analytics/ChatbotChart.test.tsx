import { screen } from '@testing-library/react'
import * as chartUI from 'src/components/ui/chart'
import { renderWithProviders } from 'src/test-utils'
import ChatbotChart from './ChatbotChart'

vi.mock('recharts', () => ({
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

const sampleData = [
  { date: '2024-01', conversations: 120, messages: 450 },
  { date: '2024-02', conversations: 150, messages: 520 },
]

describe('ChatbotChart', () => {
  it('returns null when isLoading is true', () => {
    const { container } = renderWithProviders(<ChatbotChart data={sampleData} isLoading={true} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows empty state when data is undefined', () => {
    renderWithProviders(<ChatbotChart data={undefined} isLoading={false} />)
    expect(screen.getByText('charts.noData')).toBeInTheDocument()
  })

  it('shows empty state when data is empty array', () => {
    renderWithProviders(<ChatbotChart data={[]} isLoading={false} />)
    expect(screen.getByText('charts.noData')).toBeInTheDocument()
  })

  it('renders chart title and line chart when data is provided', () => {
    renderWithProviders(<ChatbotChart data={sampleData} isLoading={false} />)
    expect(screen.getByText('chatbot.performanceOverTime')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  // Regression test: chart config must use var(--color-chart-N) syntax, not hsl() wrappers
  it('uses CSS variable syntax for chart config colors', () => {
    renderWithProviders(<ChatbotChart data={sampleData} isLoading={false} />)
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
