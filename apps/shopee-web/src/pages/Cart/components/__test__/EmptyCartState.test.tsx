import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import EmptyCartState from '../EmptyCartState'
import type { SavedItem } from 'src/hooks/useSaveForLater'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, whileHover, whileTap, style, ...rest } =
        props
      return <div {...rest}>{children}</div>
    },
    img: ({ src, alt, className, ...props }: any) => {
      const { animate, transition, ...rest } = props
      return <img src={src} alt={alt} className={className} {...rest} />
    },
    span: ({ children, ...props }: any) => {
      const { initial, animate, transition, ...rest } = props
      return <span {...rest}>{children}</span>
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
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

vi.mock('src/components/SaveForLaterSection', () => ({
  default: ({ savedItems, onMoveToCart, onRemove, onClear }: any) => (
    <div data-testid="save-for-later">
      {savedItems.map((item: any) => (
        <div key={item.product._id}>
          <span>{item.product.name}</span>
          <button onClick={() => onMoveToCart(item)}>Move to cart</button>
          <button onClick={() => onRemove(item.product._id)}>Remove</button>
        </div>
      ))}
      <button onClick={onClear}>Clear all</button>
    </div>
  ),
}))

const mockSavedItem: SavedItem = {
  product: {
    _id: 'p1',
    name: 'Sản phẩm đã lưu',
    price: 100000,
    price_before_discount: 150000,
    quantity: 10,
    sold: 50,
    view: 200,
    rating: 4.5,
    image: 'img.jpg',
    images: ['img.jpg'],
    description: 'desc',
    category: { _id: 'c1', name: 'Test' },
    location: 'HCM',
    createdAt: '',
    updatedAt: '',
  },
  addedAt: Date.now(),
}

const defaultProps = {
  savedItems: [],
  handleMoveToCart: vi.fn(),
  removeFromSaved: vi.fn(),
  handleClearSaved: vi.fn(),
  noproduct: '/noproduct.png',
  path: { home: '/' },
}

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>)

describe('EmptyCartState', () => {
  it('renders empty cart message', () => {
    renderWithRouter(<EmptyCartState {...defaultProps} />)
    expect(screen.getByText('Giỏ hàng của bạn còn trống')).toBeInTheDocument()
  })

  it('renders shop now CTA button', () => {
    renderWithRouter(<EmptyCartState {...defaultProps} />)
    expect(screen.getByText('Mua ngay')).toBeInTheDocument()
  })

  it('shop now button links to home path', () => {
    renderWithRouter(<EmptyCartState {...defaultProps} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/')
  })

  it('renders noproduct image', () => {
    renderWithRouter(<EmptyCartState {...defaultProps} />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', '/noproduct.png')
    expect(img).toHaveAttribute('alt', 'noproduct')
  })

  it('does not render SaveForLaterSection when savedItems is empty', () => {
    renderWithRouter(<EmptyCartState {...defaultProps} savedItems={[]} />)
    expect(screen.queryByTestId('save-for-later')).not.toBeInTheDocument()
  })

  it('renders SaveForLaterSection when savedItems has items', () => {
    renderWithRouter(<EmptyCartState {...defaultProps} savedItems={[mockSavedItem]} />)
    expect(screen.getByTestId('save-for-later')).toBeInTheDocument()
    expect(screen.getByText('Sản phẩm đã lưu')).toBeInTheDocument()
  })

  it('calls handleMoveToCart when move to cart is clicked', () => {
    const handleMoveToCart = vi.fn()
    renderWithRouter(
      <EmptyCartState
        {...defaultProps}
        savedItems={[mockSavedItem]}
        handleMoveToCart={handleMoveToCart}
      />,
    )
    fireEvent.click(screen.getByText('Move to cart'))
    expect(handleMoveToCart).toHaveBeenCalledWith(mockSavedItem)
  })

  it('calls removeFromSaved when remove is clicked', () => {
    const removeFromSaved = vi.fn()
    renderWithRouter(
      <EmptyCartState
        {...defaultProps}
        savedItems={[mockSavedItem]}
        removeFromSaved={removeFromSaved}
      />,
    )
    fireEvent.click(screen.getByText('Remove'))
    expect(removeFromSaved).toHaveBeenCalledWith('p1')
  })

  it('calls handleClearSaved when clear all is clicked', () => {
    const handleClearSaved = vi.fn()
    renderWithRouter(
      <EmptyCartState
        {...defaultProps}
        savedItems={[mockSavedItem]}
        handleClearSaved={handleClearSaved}
      />,
    )
    fireEvent.click(screen.getByText('Clear all'))
    expect(handleClearSaved).toHaveBeenCalled()
  })

  it('renders correctly with custom home path', () => {
    renderWithRouter(<EmptyCartState {...defaultProps} path={{ home: '/home-page' }} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/home-page')
  })
})
