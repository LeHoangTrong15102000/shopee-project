import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import RecentlyViewed from '../RecentlyViewed'

vi.mock('src/components/ProductRating', () => ({
  default: ({ rating }: any) => <div data-testid="rating">{rating}</div>,
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => {
    const { animated, variant, ariaLabel, ...rest } = props
    return (
      <button onClick={onClick} className={className} aria-label={ariaLabel} {...rest}>
        {children}
      </button>
    )
  },
}))

const makeProduct = (id: string, overrides = {}) => ({
  _id: id,
  name: `Product ${id}`,
  image: `img-${id}.jpg`,
  price: 100000,
  price_before_discount: 150000,
  rating: 4.5,
  sold: 1500,
  viewedAt: '2024-01-01',
  ...overrides,
})

const renderWithRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('RecentlyViewed', () => {
  it('returns null when no products', () => {
    const { container } = renderWithRouter(<RecentlyViewed products={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders section title', () => {
    renderWithRouter(<RecentlyViewed products={[makeProduct('1')]} />)
    expect(screen.getAllByText('Sản phẩm đã xem gần đây').length).toBeGreaterThan(0)
  })

  it('renders product name', () => {
    renderWithRouter(<RecentlyViewed products={[makeProduct('1')]} />)
    expect(screen.getAllByText('Product 1').length).toBeGreaterThan(0)
  })

  it('renders product image', () => {
    renderWithRouter(<RecentlyViewed products={[makeProduct('1')]} />)
    expect(screen.getAllByAltText(/Product 1/).length).toBeGreaterThan(0)
  })

  it('renders product price', () => {
    renderWithRouter(<RecentlyViewed products={[makeProduct('1')]} />)
    expect(screen.getAllByText(/100.000/).length).toBeGreaterThan(0)
  })

  it('renders strikethrough price when discount exists', () => {
    const { container } = renderWithRouter(<RecentlyViewed products={[makeProduct('1')]} />)
    expect(container.querySelector('.line-through')).toBeInTheDocument()
  })

  it('does not render strikethrough when no discount', () => {
    const { container } = renderWithRouter(
      <RecentlyViewed
        products={[makeProduct('1', { price: 100000, price_before_discount: 100000 })]}
      />,
    )
    expect(container.querySelector('.line-through')).not.toBeInTheDocument()
  })

  it('renders rating', () => {
    renderWithRouter(<RecentlyViewed products={[makeProduct('1')]} />)
    expect(screen.getAllByTestId('rating').length).toBeGreaterThan(0)
  })

  it('renders sold count', () => {
    renderWithRouter(<RecentlyViewed products={[makeProduct('1')]} />)
    expect(screen.getAllByText(/Đã bán 1500/).length).toBeGreaterThan(0)
  })

  it('renders clear all button when onClearAll provided', () => {
    renderWithRouter(<RecentlyViewed products={[makeProduct('1')]} onClearAll={vi.fn()} />)
    expect(screen.getByText('Xóa tất cả')).toBeInTheDocument()
  })

  it('does not render clear all button when onClearAll not provided', () => {
    renderWithRouter(<RecentlyViewed products={[makeProduct('1')]} />)
    expect(screen.queryByText('Xóa tất cả')).not.toBeInTheDocument()
  })

  it('calls onClearAll when clear all clicked', () => {
    const onClearAll = vi.fn()
    renderWithRouter(<RecentlyViewed products={[makeProduct('1')]} onClearAll={onClearAll} />)
    fireEvent.click(screen.getByText('Xóa tất cả'))
    expect(onClearAll).toHaveBeenCalled()
  })

  it('renders remove button when onRemove provided', () => {
    renderWithRouter(<RecentlyViewed products={[makeProduct('1')]} onRemove={vi.fn()} />)
    expect(screen.getAllByLabelText(/Xóa sản phẩm/).length).toBeGreaterThan(0)
  })

  it('calls onRemove when remove clicked', () => {
    const onRemove = vi.fn()
    renderWithRouter(<RecentlyViewed products={[makeProduct('1')]} onRemove={onRemove} />)
    const removeButtons = screen.getAllByLabelText(/Xóa sản phẩm/)
    fireEvent.click(removeButtons[0])
    expect(onRemove).toHaveBeenCalledWith('1')
  })

  it('limits displayed products to maxItems', () => {
    const products = Array.from({ length: 15 }, (_, i) => makeProduct(String(i)))
    renderWithRouter(<RecentlyViewed products={products} maxItems={3} />)
    // Should only show 3 products (rendered in both mobile and desktop views)
    const names = screen.getAllByText(/Product \d+/)
    // Each product appears twice (mobile + desktop), so 3 * 2 = 6
    expect(names.length).toBe(6)
  })

  it('applies custom className', () => {
    const { container } = renderWithRouter(
      <RecentlyViewed products={[makeProduct('1')]} className="custom-class" />,
    )
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })
})
