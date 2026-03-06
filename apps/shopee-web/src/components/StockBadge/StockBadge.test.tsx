import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StockBadge from './StockBadge'

describe('StockBadge', () => {
  it('returns null when stock is normal', () => {
    const { container } = render(<StockBadge availableStock={100} requestedQuantity={1} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows out of stock badge when stock is 0', () => {
    render(<StockBadge availableStock={0} requestedQuantity={1} />)
    expect(screen.getByText('Hết hàng')).toBeInTheDocument()
  })

  it('shows exceeded badge when requested quantity exceeds stock', () => {
    render(<StockBadge availableStock={5} requestedQuantity={10} />)
    expect(screen.getByText('Vượt quá số lượng có sẵn')).toBeInTheDocument()
  })

  it('shows critical low badge when stock is 5 or less', () => {
    render(<StockBadge availableStock={3} requestedQuantity={1} />)
    expect(screen.getByText('Chỉ còn 3 sản phẩm')).toBeInTheDocument()
  })

  it('shows running low badge when stock is between 6 and 20', () => {
    render(<StockBadge availableStock={15} requestedQuantity={1} />)
    expect(screen.getByText('Sắp hết hàng')).toBeInTheDocument()
  })
})
