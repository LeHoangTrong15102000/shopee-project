import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Product from '../Product'
import { Product as ProductType } from 'src/types/product.type'

let mockNavigate = vi.fn()
const mockSavePosition = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('src/components/ProductRating', () => ({
  default: ({ rating }: any) => <div data-testid="rating">{rating}</div>,
}))

vi.mock('src/components/OptimizedImage', () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}))

vi.mock('src/components/WishlistButton', () => ({
  default: ({ productId }: any) => <button data-testid="wishlist">{productId}</button>,
}))

vi.mock('src/hooks/useScrollRestoration', () => ({
  scrollManager: {
    savePosition: (...args: any[]) => mockSavePosition(...args),
  },
}))

vi.mock('src/hooks/useHoverPrefetch', () => ({
  useHoverPrefetch: () => ({
    handleMouseEnter: vi.fn(),
    handleMouseLeave: vi.fn(),
    handleClick: vi.fn(),
  }),
}))

vi.mock('src/pages/NotFound', () => ({
  default: () => <div>Not Found</div>,
}))

describe('Product', () => {
  const mockProduct: ProductType = {
    _id: '1',
    name: 'Test Product',
    price: 100000,
    price_before_discount: 150000,
    rating: 4.5,
    sold: 1000,
    image: 'test.jpg',
    location: 'Hà Nội',
    description: 'Test description',
    category: { _id: 'cat1', name: 'Category 1' },
    quantity: 10,
    view: 500,
    images: [],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate = vi.fn()
    mockSavePosition.mockClear()
  })

  it('should render product information', () => {
    render(<Product product={mockProduct} />)
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('Hà Nội')).toBeInTheDocument()
  })

  it('should render product image', () => {
    render(<Product product={mockProduct} />)
    const image = screen.getByAltText('Test Product')
    expect(image).toHaveAttribute('src', 'test.jpg')
  })

  it('should render product prices', () => {
    render(<Product product={mockProduct} />)
    expect(screen.getByText('100.000')).toBeInTheDocument()
    expect(screen.getByText('150.000')).toBeInTheDocument()
  })

  it('should render product rating', () => {
    render(<Product product={mockProduct} />)
    expect(screen.getByTestId('rating')).toHaveTextContent('4.5')
  })

  it('should render sold count', () => {
    render(<Product product={mockProduct} />)
    expect(screen.getByText('1k')).toBeInTheDocument()
  })

  it('should render wishlist button', () => {
    render(<Product product={mockProduct} />)
    expect(screen.getByTestId('wishlist')).toBeInTheDocument()
  })

  it('should navigate on click', () => {
    render(<Product product={mockProduct} />)
    const productElement = screen.getByRole('link')
    fireEvent.click(productElement)
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('should navigate on Enter key press', () => {
    render(<Product product={mockProduct} />)
    const productElement = screen.getByRole('link')
    fireEvent.keyDown(productElement, { key: 'Enter' })
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('should navigate on Space key press', () => {
    render(<Product product={mockProduct} />)
    const productElement = screen.getByRole('link')
    fireEvent.keyDown(productElement, { key: ' ' })
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('should save scroll position on click', () => {
    render(<Product product={mockProduct} />)
    const productElement = screen.getByRole('link')
    fireEvent.click(productElement)
    expect(mockSavePosition).toHaveBeenCalled()
  })

  it('should have proper aria-label', () => {
    render(<Product product={mockProduct} />)
    const productElement = screen.getByRole('link')
    expect(productElement).toHaveAttribute('aria-label', 'Test Product - ₫100.000')
  })

  it('should be keyboard accessible', () => {
    render(<Product product={mockProduct} />)
    const productElement = screen.getByRole('link')
    expect(productElement).toHaveAttribute('tabIndex', '0')
  })

  it('should format sold count with social style', () => {
    render(<Product product={mockProduct} />)
    // 1000 sold → formatted as "1k"
    expect(screen.getByText('1k')).toBeInTheDocument()
  })
})
