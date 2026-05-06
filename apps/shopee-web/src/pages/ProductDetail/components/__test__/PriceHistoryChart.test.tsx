import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PriceHistoryChart from '../PriceHistoryChart'

vi.mock('src/utils/utils', () => ({
  formatCurrency: (n: number) => `${n.toLocaleString('vi-VN')}₫`,
}))

const mockData = [
  { date: '2024-01-01T00:00:00Z', price: 100000 },
  { date: '2024-01-15T00:00:00Z', price: 90000 },
  { date: '2024-02-01T00:00:00Z', price: 80000 },
]

const singlePointData = [{ date: '2024-01-01T00:00:00Z', price: 100000 }]

describe('PriceHistoryChart', () => {
  it('renders empty state when data is empty', () => {
    render(<PriceHistoryChart data={[]} />)
    expect(screen.getByText('No price history available')).toBeInTheDocument()
  })

  it('renders empty state when data is undefined-like (null passed)', () => {
    render(<PriceHistoryChart data={null as any} />)
    expect(screen.getByText('No price history available')).toBeInTheDocument()
  })

  it('renders SVG chart when data is provided', () => {
    const { container } = render(<PriceHistoryChart data={mockData} />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
  })

  it('has accessible label on the SVG element', () => {
    render(<PriceHistoryChart data={mockData} />)
    const chart = screen.getByRole('img', { name: 'Price history chart' })
    expect(chart).toBeInTheDocument()
  })

  it('renders correct number of data point circles', () => {
    const { container } = render(<PriceHistoryChart data={mockData} />)
    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBe(mockData.length)
  })

  it('renders price values as tooltip titles on data points', () => {
    const { container } = render(<PriceHistoryChart data={mockData} />)
    const titles = container.querySelectorAll('title')
    expect(titles.length).toBeGreaterThanOrEqual(mockData.length)
  })

  it('renders x-axis date labels', () => {
    const { container } = render(<PriceHistoryChart data={mockData} />)
    const textNodes = container.querySelectorAll('text')
    expect(textNodes.length).toBeGreaterThan(0)
  })

  it('renders with a single data point without error', () => {
    const { container } = render(<PriceHistoryChart data={singlePointData} />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBe(1)
  })

  it('renders line path element', () => {
    const { container } = render(<PriceHistoryChart data={mockData} />)
    // The line path has fill="none" and stroke="#ee4d2d"
    const paths = container.querySelectorAll('path[fill="none"]')
    expect(paths.length).toBeGreaterThanOrEqual(1)
  })

  it('renders area fill path element', () => {
    const { container } = render(<PriceHistoryChart data={mockData} />)
    // The area fill path has fill="#ee4d2d" and fillOpacity
    const areaPath = container.querySelector('path[fill="#ee4d2d"]')
    expect(areaPath).not.toBeNull()
  })

  it('renders y-axis tick lines', () => {
    const { container } = render(<PriceHistoryChart data={mockData} />)
    const lines = container.querySelectorAll('line[stroke-dasharray]')
    expect(lines.length).toBeGreaterThanOrEqual(3)
  })

  it('renders axis lines', () => {
    const { container } = render(<PriceHistoryChart data={mockData} />)
    const lines = container.querySelectorAll('line')
    // 3 y-ticks grid lines + 2 axis lines = at least 5
    expect(lines.length).toBeGreaterThanOrEqual(5)
  })

  it('wraps chart in a scrollable container', () => {
    const { container } = render(<PriceHistoryChart data={mockData} />)
    const wrapper = container.querySelector('.overflow-x-auto')
    expect(wrapper).not.toBeNull()
  })
})
