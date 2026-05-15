import { describe, it, expect} from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import WishlistCard from '../WishlistCard'
import type { Product } from 'src/types/product.type'

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

vi.mock('src/components/ImageWithFallback', () => ({
  default: ({ src, alt, className }: any) => <img src={src} alt={alt} className={className} />,
}))

vi.mock('src/components/ProductRating', () => ({
  default: ({ rating }: any) => <div data-testid="rating">{rating}</div>,
}))

vi.mock('./WishlistIcons', () => ({
  getCategoryIcon:
    () =>
    ({ className }: any) => <span className={className}>📦</span>,
  IconFire: ({ className }: any) => <span className={className}>🔥</span>,
  IconLightning: ({ className }: any) => <span className={className}>⚡</span>,
  IconShoppingCart: ({ className }: any) => <span className={className}>🛒</span>,
  IconSparkles: ({ className }: any) => <span className={className}>✨</span>,
}))

const mockProduct: Product = {
  _id: 'prod1',
  name: 'Áo thun nam',
  image: 'img.jpg',
  images: [],
  price: 100000,
  price_before_discount: 150000,
  rating: 4.5,
  sold: 2500,
  quantity: 50,
  view: 100,
  category: { _id: 'c1', name: 'Thời trang nam' },
  description: '',
  location: 'HCM',
  createdAt: '',
  updatedAt: '',
}

const defaultProps = {
  item: { _id: 'w1', product: mockProduct, addedAt: '2024-01-01' },
  hoveredCardId: null as string | null,
  onMouseEnter: vi.fn(),
  onMouseLeave: vi.fn(),
  onRemove: vi.fn(),
  onAddToCart: vi.fn(),
  isRecentlyAdded: vi.fn().mockReturnValue(false),
  isTrending: vi.fn().mockReturnValue(false),
  getStockStatus: vi.fn().mockReturnValue(null),
  getDiscountPercent: vi.fn().mockReturnValue(33),
  itemVariants: {},
}

const renderCard = (overrides = {}) =>
  render(
    <MemoryRouter>
      <WishlistCard {...defaultProps} {...overrides} />
    </MemoryRouter>,
  )

describe('WishlistCard', () => {
  it('renders product name', () => {
    renderCard()
    expect(screen.getByText('Áo thun nam')).toBeInTheDocument()
  })

  it('renders product image', () => {
    renderCard()
    expect(screen.getByAltText('Áo thun nam')).toBeInTheDocument()
  })

  it('renders product price', () => {
    renderCard()
    expect(screen.getByText('₫100.000')).toBeInTheDocument()
  })

  it('renders strikethrough price when discount > 0', () => {
    renderCard()
    expect(screen.getByText('₫150.000')).toBeInTheDocument()
  })

  it('does not render strikethrough price when discount is 0', () => {
    renderCard({ getDiscountPercent: vi.fn().mockReturnValue(0) })
    expect(screen.queryByText('₫150.000')).not.toBeInTheDocument()
  })

  it('renders discount badge when discount > 0', () => {
    renderCard()
    expect(screen.getByText(/-33%/)).toBeInTheDocument()
  })

  it('does not render discount badge when discount is 0', () => {
    renderCard({ getDiscountPercent: vi.fn().mockReturnValue(0) })
    expect(screen.queryByText(/-\d+%/)).not.toBeInTheDocument()
  })

  it('renders lightning icon for discount >= 30', () => {
    renderCard({ getDiscountPercent: vi.fn().mockReturnValue(35) })
    expect(screen.getByText(/-35%/)).toBeInTheDocument()
  })

  it('renders NEW badge when recently added', () => {
    renderCard({ isRecentlyAdded: vi.fn().mockReturnValue(true) })
    expect(screen.getByText('MỚI')).toBeInTheDocument()
  })

  it('does not render NEW badge when not recently added', () => {
    renderCard()
    expect(screen.queryByText('MỚI')).not.toBeInTheDocument()
  })

  it('renders HOT badge when trending', () => {
    renderCard({ isTrending: vi.fn().mockReturnValue(true) })
    expect(screen.getByText('HOT')).toBeInTheDocument()
  })

  it('does not render HOT badge when not trending', () => {
    renderCard()
    expect(screen.queryByText('HOT')).not.toBeInTheDocument()
  })

  it('renders stock status badge when stock status exists', () => {
    renderCard({
      getStockStatus: vi.fn().mockReturnValue({ label: 'Sắp hết', color: 'bg-yellow-500' }),
    })
    expect(screen.getByText('Sắp hết')).toBeInTheDocument()
  })

  it('does not render stock badge when stock status is null', () => {
    renderCard()
    expect(screen.queryByText('Sắp hết')).not.toBeInTheDocument()
    expect(screen.queryByText('Hết hàng')).not.toBeInTheDocument()
  })

  it('renders category name', () => {
    renderCard()
    expect(screen.getByText('Thời trang nam')).toBeInTheDocument()
  })

  it('renders default category when product has no category', () => {
    const noCategory = { ...mockProduct, category: undefined as any }
    renderCard({ item: { _id: 'w2', product: noCategory, addedAt: '2024-01-01' } })
    expect(screen.getByText('Sản phẩm')).toBeInTheDocument()
  })

  it('renders rating', () => {
    renderCard()
    expect(screen.getByTestId('rating')).toBeInTheDocument()
  })

  it('renders sold count', () => {
    renderCard()
    expect(screen.getByText(/Đã bán 2,5k/)).toBeInTheDocument()
  })

  it('renders add to cart button', () => {
    renderCard()
    expect(screen.getByText('Thêm vào giỏ')).toBeInTheDocument()
  })

  it('calls onAddToCart when add to cart clicked', () => {
    const onAddToCart = vi.fn()
    renderCard({ onAddToCart })
    fireEvent.click(screen.getByText('Thêm vào giỏ'))
    expect(onAddToCart).toHaveBeenCalled()
  })

  it('calls onRemove when remove button clicked', () => {
    const onRemove = vi.fn()
    renderCard({ onRemove })
    const removeBtn = screen.getByLabelText('Xóa khỏi yêu thích')
    fireEvent.click(removeBtn)
    expect(onRemove).toHaveBeenCalled()
  })

  it('calls onMouseEnter and onMouseLeave', () => {
    const onMouseEnter = vi.fn()
    const onMouseLeave = vi.fn()
    const { container } = renderCard({ onMouseEnter, onMouseLeave })
    const card = container.querySelector('.group')
    fireEvent.mouseEnter(card!)
    expect(onMouseEnter).toHaveBeenCalled()
    fireEvent.mouseLeave(card!)
    expect(onMouseLeave).toHaveBeenCalled()
  })
})
