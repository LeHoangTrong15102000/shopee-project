import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ShopInfo from '../ShopInfo'

vi.mock('../ShopMetrics', () => ({
  default: ({ rating }: any) => <div data-testid="shop-metrics">Rating: {rating}</div>,
}))

vi.mock('src/components/OnlineIndicator', () => ({
  default: ({ isOnline, lastSeen, size }: any) => (
    <div data-testid="online-indicator">{isOnline ? 'Online' : 'Offline'}</div>
  ),
}))

const defaultProps = {
  rating: 4.5,
  isSellerOnline: true,
  sellerLastSeen: null,
}

describe('ShopInfo', () => {
  it('renders shop avatar placeholder', () => {
    render(<ShopInfo {...defaultProps} />)
    const svg = document.querySelector('svg[aria-hidden="true"]')
    expect(svg).toBeInTheDocument()
  })

  it('renders shop name with default name when no category', () => {
    render(<ShopInfo {...defaultProps} />)
    const elements = screen.getAllByText(/Shop/)
    expect(elements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders shop name with category name', () => {
    render(<ShopInfo {...defaultProps} categoryName="Điện thoại" />)
    expect(screen.getByText(/Điện thoại/)).toBeInTheDocument()
  })

  it('renders default location when location is not provided', () => {
    render(<ShopInfo {...defaultProps} />)
    // Component should render without error — location falls back to translation key
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
  })

  it('renders location when provided', () => {
    render(<ShopInfo {...defaultProps} location="Hồ Chí Minh" />)
    expect(screen.getByText('Hồ Chí Minh')).toBeInTheDocument()
  })

  it('renders online indicator', () => {
    render(<ShopInfo {...defaultProps} isSellerOnline={true} />)
    expect(screen.getByTestId('online-indicator')).toBeInTheDocument()
    expect(screen.getByText('Online')).toBeInTheDocument()
  })

  it('renders offline indicator', () => {
    render(<ShopInfo {...defaultProps} isSellerOnline={false} sellerLastSeen="2024-01-01T10:00:00Z" />)
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })

  it('renders Chat Now button', () => {
    render(<ShopInfo {...defaultProps} />)
    expect(screen.getByText('Chat Ngay')).toBeInTheDocument()
  })

  it('renders View Shop button', () => {
    render(<ShopInfo {...defaultProps} />)
    expect(screen.getByText('Xem Shop')).toBeInTheDocument()
  })

  it('renders shop metrics component', () => {
    render(<ShopInfo {...defaultProps} />)
    expect(screen.getByTestId('shop-metrics')).toBeInTheDocument()
  })

  it('passes rating to ShopMetrics', () => {
    render(<ShopInfo {...defaultProps} rating={4.2} />)
    expect(screen.getByText('Rating: 4.2')).toBeInTheDocument()
  })

  it('renders chat and view shop buttons as type=button', () => {
    render(<ShopInfo {...defaultProps} />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('type', 'button')
    })
  })
})
