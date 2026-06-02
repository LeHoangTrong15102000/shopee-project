import { screen } from '@testing-library/react'
import { renderWithProviders } from 'src/test-utils'
import TopProductsBuyers from './TopProductsBuyers'

const sampleTopProducts = [
  { _id: 'prod-1', name: 'iPhone 15 Pro', revenue: 299900000, sold: 10 },
  { _id: 'prod-2', name: 'Samsung Galaxy', revenue: 199900000, sold: 8 },
]

const sampleTopBuyers = [
  {
    _id: 'user-1',
    name: 'Nguyễn Văn A',
    email: 'user@example.com',
    total_orders: 5,
    total_spent: 150000000,
  },
  {
    _id: 'user-2',
    name: 'Trần Thị B',
    email: 'buyer@example.com',
    total_orders: 3,
    total_spent: 90000000,
  },
]

describe('TopProductsBuyers', () => {
  it('renders both tables', () => {
    renderWithProviders(
      <TopProductsBuyers topProducts={sampleTopProducts} topBuyers={sampleTopBuyers} />,
    )
    const tables = screen.getAllByRole('table')
    expect(tables.length).toBe(2)
  })

  it('renders top products table title', () => {
    renderWithProviders(
      <TopProductsBuyers topProducts={sampleTopProducts} topBuyers={sampleTopBuyers} />,
    )
    expect(screen.getByText('tables.topProductsByRevenue')).toBeInTheDocument()
  })

  it('renders top buyers table title', () => {
    renderWithProviders(
      <TopProductsBuyers topProducts={sampleTopProducts} topBuyers={sampleTopBuyers} />,
    )
    expect(screen.getByText('tables.topBuyers')).toBeInTheDocument()
  })

  it('renders product column headers', () => {
    renderWithProviders(<TopProductsBuyers topProducts={sampleTopProducts} topBuyers={undefined} />)
    expect(screen.getByText('tables.product')).toBeInTheDocument()
    expect(screen.getByText('tables.revenue')).toBeInTheDocument()
    expect(screen.getByText('tables.sold')).toBeInTheDocument()
  })

  it('renders buyer column headers', () => {
    renderWithProviders(<TopProductsBuyers topProducts={undefined} topBuyers={sampleTopBuyers} />)
    expect(screen.getByText('tables.customer')).toBeInTheDocument()
    expect(screen.getByText('tables.orders')).toBeInTheDocument()
    expect(screen.getByText('tables.totalSpent')).toBeInTheDocument()
  })

  it('renders product names in table', () => {
    renderWithProviders(<TopProductsBuyers topProducts={sampleTopProducts} topBuyers={undefined} />)
    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
    expect(screen.getByText('Samsung Galaxy')).toBeInTheDocument()
  })

  it('renders buyer names in table', () => {
    renderWithProviders(<TopProductsBuyers topProducts={undefined} topBuyers={sampleTopBuyers} />)
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument()
    expect(screen.getByText('Trần Thị B')).toBeInTheDocument()
  })

  it('renders buyer emails in table', () => {
    renderWithProviders(<TopProductsBuyers topProducts={undefined} topBuyers={sampleTopBuyers} />)
    expect(screen.getByText('user@example.com')).toBeInTheDocument()
    expect(screen.getByText('buyer@example.com')).toBeInTheDocument()
  })

  it('renders product sold count', () => {
    renderWithProviders(<TopProductsBuyers topProducts={sampleTopProducts} topBuyers={undefined} />)
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('renders buyer total orders', () => {
    renderWithProviders(<TopProductsBuyers topProducts={undefined} topBuyers={sampleTopBuyers} />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders empty tables when data is undefined', () => {
    renderWithProviders(<TopProductsBuyers topProducts={undefined} topBuyers={undefined} />)
    const tables = screen.getAllByRole('table')
    expect(tables.length).toBe(2)
    // Only header rows, no data rows
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBe(2)
  })

  it('renders empty tables when data arrays are empty', () => {
    renderWithProviders(<TopProductsBuyers topProducts={[]} topBuyers={[]} />)
    const tables = screen.getAllByRole('table')
    expect(tables.length).toBe(2)
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBe(2)
  })
})
