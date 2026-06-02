import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProductInfo from '../ProductInfo'

vi.mock('src/components/ProductRating', () => ({
  default: ({ rating }: any) => <div data-testid="product-rating">{rating}</div>,
}))

vi.mock('src/components/ViewerCountBadge', () => ({
  default: ({ viewerCount, isPopular }: any) => (
    <div data-testid="viewer-count">
      {viewerCount} {isPopular ? 'popular' : ''}
    </div>
  ),
}))

vi.mock('src/components/LivePriceTag', () => ({
  default: ({ currentPrice }: any) => <span data-testid="live-price">{currentPrice}</span>,
}))

vi.mock('../ProductBadges', () => ({
  default: () => <div data-testid="product-badges">badges</div>,
}))

vi.mock('../VoucherRow', () => ({
  default: () => <div data-testid="voucher-row">vouchers</div>,
}))

vi.mock('../ShopeeProtection', () => ({
  default: () => <div data-testid="shopee-protection">protection</div>,
}))

vi.mock('../ShippingInfo', () => ({
  default: ({ location }: any) => <div data-testid="shipping-info">{location}</div>,
}))

vi.mock('src/styles/animations', () => ({
  staggerItem: {},
}))

const mockProduct = {
  _id: '1',
  name: 'Test Product',
  price: 100000,
  price_before_discount: 200000,
  quantity: 50,
  sold: 500,
  rating: 4.5,
  view: 1000,
  description: 'desc',
  images: [],
  image: 'img.jpg',
  category: { _id: 'c1', name: 'Điện tử' },
  createdAt: '',
  updatedAt: '',
  location: 'TP. Hồ Chí Minh',
}

const defaultProps = {
  product: mockProduct as any,
  reducedMotion: true,
  livePrice: null,
  livePriceBeforeDiscount: null,
  priceHasChanged: false,
  previousPrice: null,
  viewerCount: 10,
  isPopular: false,
  infoContainerVariants: {},
  selectedSKU: null,
}

describe('ProductInfo', () => {
  it('renders product name', () => {
    render(<ProductInfo {...defaultProps} />)
    expect(screen.getByText('Test Product')).toBeInTheDocument()
  })

  it('renders product rating', () => {
    render(<ProductInfo {...defaultProps} />)
    expect(screen.getByTestId('product-rating')).toBeInTheDocument()
  })

  it('renders viewer count badge', () => {
    render(<ProductInfo {...defaultProps} />)
    expect(screen.getByTestId('viewer-count')).toBeInTheDocument()
  })

  it('renders LivePriceTag when no SKU selected', () => {
    render(<ProductInfo {...defaultProps} />)
    expect(screen.getByTestId('live-price')).toBeInTheDocument()
  })

  it('renders SKU price when selectedSKU is provided', () => {
    const sku = { _id: 'sku1', price: 90000, stock: 10, name: 'Red', attributes: {} }
    render(<ProductInfo {...defaultProps} selectedSKU={sku as any} />)
    expect(screen.getByText(/90\.000/)).toBeInTheDocument()
  })

  it('renders low stock warning when SKU stock is low', () => {
    const sku = { _id: 'sku1', price: 90000, stock: 3, name: 'Red', attributes: {} }
    render(<ProductInfo {...defaultProps} selectedSKU={sku as any} />)
    // Low stock warning should appear (stock <= 5 and > 0)
    const warning = document.querySelector('.text-amber-700')
    expect(warning).toBeTruthy()
  })

  it('renders out of stock message when SKU stock is 0', () => {
    const sku = { _id: 'sku1', price: 90000, stock: 0, name: 'Red', attributes: {} }
    render(<ProductInfo {...defaultProps} selectedSKU={sku as any} />)
    const outOfStock = document.querySelector('.text-red-600')
    expect(outOfStock).toBeTruthy()
  })

  it('does not show low stock when no SKU selected', () => {
    render(<ProductInfo {...defaultProps} />)
    const warning = document.querySelector('.text-amber-700')
    expect(warning).toBeFalsy()
  })

  it('renders sub-components', () => {
    render(<ProductInfo {...defaultProps} />)
    expect(screen.getByTestId('product-badges')).toBeInTheDocument()
    expect(screen.getByTestId('voucher-row')).toBeInTheDocument()
    expect(screen.getByTestId('shopee-protection')).toBeInTheDocument()
    expect(screen.getByTestId('shipping-info')).toBeInTheDocument()
  })

  it('renders shipping info with product location', () => {
    render(<ProductInfo {...defaultProps} />)
    expect(screen.getByText('TP. Hồ Chí Minh')).toBeInTheDocument()
  })

  it('renders empty string for shipping when location is empty', () => {
    const product = { ...mockProduct, location: '' }
    render(<ProductInfo {...defaultProps} product={product as any} />)
    expect(screen.getByTestId('shipping-info')).toBeInTheDocument()
  })

  it('uses livePrice when available and no SKU', () => {
    render(<ProductInfo {...defaultProps} livePrice={80000} />)
    expect(screen.getByTestId('live-price')).toBeInTheDocument()
  })

  it('renders with reducedMotion=false', () => {
    render(<ProductInfo {...defaultProps} reducedMotion={false} />)
    expect(screen.getByText('Test Product')).toBeInTheDocument()
  })
})
