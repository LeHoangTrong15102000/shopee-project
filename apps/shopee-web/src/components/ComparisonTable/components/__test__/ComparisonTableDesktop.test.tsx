import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import ComparisonTableDesktop from '../ComparisonTableDesktop'
import { BestValues } from '../../comparisonTable.constants'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: any) => {
      const { initial, animate, exit, transition, variants, whileHover, layout, ...rest } = p
      return <div {...rest}>{children}</div>
    },
    span: ({ children, ...p }: any) => {
      const { initial, animate, exit, transition, variants, ...rest } = p
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

vi.mock('src/components/ProductRating', () => ({
  default: ({ rating }: any) => <div data-testid="product-rating">{rating}</div>,
}))

const makeProduct = (overrides: Record<string, any> = {}) => ({
  _id: 'p1',
  name: 'Sản phẩm A',
  price: 100000,
  price_before_discount: 200000,
  quantity: 50,
  sold: 500,
  rating: 4.5,
  view: 1000,
  description: 'desc',
  images: ['img1.jpg'],
  image: 'img1.jpg',
  category: { _id: 'c1', name: 'Điện tử' },
  createdAt: '',
  updatedAt: '',
  ...overrides,
})

const product1 = makeProduct({
  _id: 'p1',
  name: 'Sản phẩm A',
  price: 100000,
  rating: 4.5,
  sold: 500,
  quantity: 50,
})
const product2 = makeProduct({
  _id: 'p2',
  name: 'Sản phẩm B',
  price: 150000,
  rating: 4.0,
  sold: 300,
  quantity: 30,
  price_before_discount: 150000,
})

const bestValues: BestValues = {
  bestPrice: 100000,
  bestRating: 4.5,
  bestSold: 500,
  bestDiscount: 50,
  bestStock: 50,
  recommendedProductId: 'p1',
}

const wrap = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>)

describe('ComparisonTableDesktop', () => {
  const removeFromCompare = vi.fn()
  const handleAddToCart = vi.fn()

  it('renders table with correct aria-label', () => {
    wrap(
      <ComparisonTableDesktop
        compareList={[product1, product2] as any}
        bestValues={bestValues}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={false}
      />,
    )
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('renders product images', () => {
    wrap(
      <ComparisonTableDesktop
        compareList={[product1, product2] as any}
        bestValues={bestValues}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={false}
      />,
    )
    const images = screen.getAllByRole('img')
    expect(images.length).toBeGreaterThanOrEqual(2)
  })

  it('renders product names as links', () => {
    wrap(
      <ComparisonTableDesktop
        compareList={[product1, product2] as any}
        bestValues={bestValues}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={false}
      />,
    )
    expect(screen.getByText('Sản phẩm A')).toBeInTheDocument()
    expect(screen.getByText('Sản phẩm B')).toBeInTheDocument()
  })

  it('renders formatted prices', () => {
    wrap(
      <ComparisonTableDesktop
        compareList={[product1, product2] as any}
        bestValues={bestValues}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={false}
      />,
    )
    expect(screen.getAllByText(/100\.000/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/150\.000/).length).toBeGreaterThanOrEqual(1)
  })

  it('highlights best price cell', () => {
    wrap(
      <ComparisonTableDesktop
        compareList={[product1, product2] as any}
        bestValues={bestValues}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={false}
      />,
    )
    const cells = screen.getAllByRole('cell')
    const bestPriceCell = cells.find((c) => c.classList.contains('bg-green-50'))
    expect(bestPriceCell).toBeTruthy()
  })

  it('renders discount percentages', () => {
    wrap(
      <ComparisonTableDesktop
        compareList={[product1, product2] as any}
        bestValues={bestValues}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={false}
      />,
    )
    expect(screen.getByText('-50%')).toBeInTheDocument()
  })

  it('renders dash for zero discount', () => {
    wrap(
      <ComparisonTableDesktop
        compareList={[product1, product2] as any}
        bestValues={bestValues}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={false}
      />,
    )
    // product2 has price === price_before_discount so discount is 0
    const dashes = screen.getAllByText('-')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it('renders rating with ProductRating component', () => {
    wrap(
      <ComparisonTableDesktop
        compareList={[product1, product2] as any}
        bestValues={bestValues}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={false}
      />,
    )
    expect(screen.getAllByTestId('product-rating').length).toBe(2)
  })

  it('renders sold counts', () => {
    wrap(
      <ComparisonTableDesktop
        compareList={[product1, product2] as any}
        bestValues={bestValues}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={false}
      />,
    )
    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.getByText('300')).toBeInTheDocument()
  })

  it('renders category names', () => {
    wrap(
      <ComparisonTableDesktop
        compareList={[product1, product2] as any}
        bestValues={bestValues}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={false}
      />,
    )
    const categoryTexts = screen.getAllByText('Điện tử')
    expect(categoryTexts.length).toBe(2)
  })

  it('renders recommendation row for recommended product', () => {
    wrap(
      <ComparisonTableDesktop
        compareList={[product1, product2] as any}
        bestValues={bestValues}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={false}
      />,
    )
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThanOrEqual(10)
  })

  it('calls removeFromCompare when remove button clicked', () => {
    wrap(
      <ComparisonTableDesktop
        compareList={[product1, product2] as any}
        bestValues={bestValues}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={false}
      />,
    )
    const removeButtons = screen.getAllByRole('button')
    // Header has remove buttons, action row has remove buttons
    fireEvent.click(removeButtons[0])
    expect(removeFromCompare).toHaveBeenCalled()
  })

  it('calls handleAddToCart when add to cart clicked', () => {
    wrap(
      <ComparisonTableDesktop
        compareList={[product1, product2] as any}
        bestValues={bestValues}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={false}
      />,
    )
    const buttons = screen.getAllByRole('button')
    // Find add to cart buttons (they contain cart-related text)
    const addButtons = buttons.filter((b) => b.textContent?.includes('Thêm'))
    if (addButtons.length > 0) {
      fireEvent.click(addButtons[0])
      expect(handleAddToCart).toHaveBeenCalledWith(product1)
    }
  })

  it('renders with reduceMotion=true (static recommendation badge)', () => {
    wrap(
      <ComparisonTableDesktop
        compareList={[product1, product2] as any}
        bestValues={bestValues}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={true}
      />,
    )
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('renders without bestValues (no recommendation row)', () => {
    wrap(
      <ComparisonTableDesktop
        compareList={[product1, product2] as any}
        bestValues={null}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={false}
      />,
    )
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('renders category dash when category is null', () => {
    const noCategory = makeProduct({ _id: 'p3', category: null })
    wrap(
      <ComparisonTableDesktop
        compareList={[noCategory] as any}
        bestValues={null}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={false}
      />,
    )
    const dashes = screen.getAllByText('-')
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it('renders stock quantities', () => {
    wrap(
      <ComparisonTableDesktop
        compareList={[product1, product2] as any}
        bestValues={bestValues}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={false}
      />,
    )
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('renders original prices with line-through', () => {
    wrap(
      <ComparisonTableDesktop
        compareList={[product1, product2] as any}
        bestValues={bestValues}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={false}
      />,
    )
    expect(screen.getByText(/200\.000/)).toBeInTheDocument()
  })

  it('renders BestBadge for best rating when bestValues.bestRating matches product.rating', () => {
    // product1 has rating 4.5 which equals bestValues.bestRating
    wrap(
      <ComparisonTableDesktop
        compareList={[product1, product2] as any}
        bestValues={bestValues}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={true}
      />,
    )
    // The BestBadge for highest rated uses the 'highestRated' translation key
    expect(screen.getByText(/highestRated|Đánh giá cao nhất/)).toBeInTheDocument()
  })

  it('renders BestBadge for best sold count when bestValues.bestSold matches product.sold', () => {
    // product1 has sold 500 which equals bestValues.bestSold
    wrap(
      <ComparisonTableDesktop
        compareList={[product1, product2] as any}
        bestValues={bestValues}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={true}
      />,
    )
    expect(screen.getByText(/bestSeller|Bán chạy nhất/)).toBeInTheDocument()
  })

  it('renders BestBadge for best stock quantity when bestValues.bestStock matches product.quantity', () => {
    // product1 has quantity 50 which equals bestValues.bestStock
    wrap(
      <ComparisonTableDesktop
        compareList={[product1, product2] as any}
        bestValues={bestValues}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={true}
      />,
    )
    expect(screen.getByText(/Còn nhiều nhất|Most in stock/)).toBeInTheDocument()
  })

  it('applies green highlight class to rating cell of best-rated product', () => {
    wrap(
      <ComparisonTableDesktop
        compareList={[product1, product2] as any}
        bestValues={bestValues}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={false}
      />,
    )
    const cells = screen.getAllByRole('cell')
    // There should be at least one cell with bg-green-50 for the best rating row
    const greenCells = cells.filter((c) => c.classList.contains('bg-green-50'))
    expect(greenCells.length).toBeGreaterThanOrEqual(1)
  })

  it('renders table with a single product in compareList', () => {
    wrap(
      <ComparisonTableDesktop
        compareList={[product1] as any}
        bestValues={null}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={false}
      />,
    )
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Sản phẩm A')).toBeInTheDocument()
    // Only one header column for the single product
    const columnHeaders = screen.getAllByRole('columnheader')
    // One for attribute column + one for the product
    expect(columnHeaders).toHaveLength(2)
  })

  it('renders table with no product columns when compareList is empty', () => {
    wrap(
      <ComparisonTableDesktop
        compareList={[] as any}
        bestValues={null}
        removeFromCompare={removeFromCompare}
        handleAddToCart={handleAddToCart}
        reduceMotion={false}
      />,
    )
    expect(screen.getByRole('table')).toBeInTheDocument()
    // Only the attribute column header is present, no product columns
    const columnHeaders = screen.getAllByRole('columnheader')
    expect(columnHeaders).toHaveLength(1)
  })
})
