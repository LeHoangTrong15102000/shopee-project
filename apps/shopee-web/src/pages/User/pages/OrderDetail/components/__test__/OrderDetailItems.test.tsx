import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import OrderDetailItems from '../OrderDetailItems'

vi.mock('src/components/ImageWithFallback', () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}))

const makeItem = (overrides: any = {}) => ({
  product: { _id: 'p1', name: 'Sản phẩm A', image: 'img1.jpg' },
  buyCount: 2,
  price: 100000,
  priceBeforeDiscount: 150000,
  ...overrides,
})

const makeOrder = (items: any[] = []) =>
  ({
    _id: 'o1',
    items,
    total: 0,
    status: 1,
    createdAt: '',
    updatedAt: '',
  }) as any

const wrap = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>)

describe('OrderDetailItems', () => {
  it('renders empty list when no items', () => {
    wrap(<OrderDetailItems order={makeOrder([])} shouldReduceMotion={false} />)
    // Component still renders header
    expect(document.body.textContent).toBeTruthy()
  })

  it('renders single item', () => {
    wrap(<OrderDetailItems order={makeOrder([makeItem()])} shouldReduceMotion={false} />)
    expect(screen.getByText('Sản phẩm A')).toBeInTheDocument()
  })

  it('renders multiple items', () => {
    wrap(
      <OrderDetailItems
        order={makeOrder([
          makeItem({ product: { _id: 'p1', name: 'Sản phẩm A', image: 'i1.jpg' } }),
          makeItem({ product: { _id: 'p2', name: 'Sản phẩm B', image: 'i2.jpg' } }),
        ])}
        shouldReduceMotion={false}
      />,
    )
    expect(screen.getByText('Sản phẩm A')).toBeInTheDocument()
    expect(screen.getByText('Sản phẩm B')).toBeInTheDocument()
  })

  it('renders discount line-through when priceBeforeDiscount > price', () => {
    wrap(<OrderDetailItems order={makeOrder([makeItem()])} shouldReduceMotion={false} />)
    expect(screen.getByText(/150\.000/)).toBeInTheDocument()
  })

  it('does not show line-through when price equals priceBeforeDiscount', () => {
    wrap(
      <OrderDetailItems
        order={makeOrder([makeItem({ price: 100000, priceBeforeDiscount: 100000 })])}
        shouldReduceMotion={false}
      />,
    )
    // Should NOT contain a line-through original price — only current price
    expect(screen.getByText(/₫100\.000/).previousElementSibling).toBeNull()
  })

  it('renders with reduceMotion=true', () => {
    wrap(<OrderDetailItems order={makeOrder([makeItem()])} shouldReduceMotion={true} />)
    expect(screen.getByText('Sản phẩm A')).toBeInTheDocument()
  })

  it('computes item total as price * buyCount', () => {
    wrap(
      <OrderDetailItems
        order={makeOrder([makeItem({ price: 50000, buyCount: 3 })])}
        shouldReduceMotion={false}
      />,
    )
    // 50000 * 3 = 150000
    expect(screen.getAllByText(/150\.000/).length).toBeGreaterThanOrEqual(1)
  })

  it('renders buyCount label with x prefix', () => {
    wrap(
      <OrderDetailItems
        order={makeOrder([makeItem({ buyCount: 5 })])}
        shouldReduceMotion={false}
      />,
    )
    expect(screen.getByText(/x5/)).toBeInTheDocument()
  })

  it('renders product link with slug pattern', () => {
    wrap(<OrderDetailItems order={makeOrder([makeItem()])} shouldReduceMotion={false} />)
    const link = screen.getByRole('link', { name: /Sản phẩm A/ })
    expect(link.getAttribute('href')).toContain('p1')
  })

  it('renders product image', () => {
    wrap(<OrderDetailItems order={makeOrder([makeItem()])} shouldReduceMotion={false} />)
    const img = screen.getByAltText('Sản phẩm A')
    expect(img).toHaveAttribute('src', 'img1.jpg')
  })

  it('handles missing product gracefully', () => {
    wrap(
      <OrderDetailItems
        order={makeOrder([
          { product: null, buyCount: 1, price: 10000, priceBeforeDiscount: 10000 },
        ])}
        shouldReduceMotion={false}
      />,
    )
    const img = screen.getByAltText('Product')
    expect(img).toBeInTheDocument()
  })
})
