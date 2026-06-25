import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OrderPreview from '../OrderPreview'

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

vi.mock('src/components/ImageWithFallback', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

vi.mock('src/components/Button', () => ({
  default: ({
    children,
    onClick,
    disabled,
    isLoading,
    className,
  }: {
    children: React.ReactNode
    onClick?: () => void
    disabled?: boolean
    isLoading?: boolean
    className?: string
  }) => (
    <button onClick={onClick} disabled={disabled || isLoading} className={className}>
      {isLoading ? 'Đang xử lý...' : children}
    </button>
  ),
}))

vi.mock('src/components/Icons', () => ({
  ShippingIcon: ({ type }: { type: string }) => <div data-testid="shipping-icon">{type}</div>,
  PaymentIcon: ({ type }: { type: string }) => <div data-testid="payment-icon">{type}</div>,
}))

// StripeCardForm mock: renders a button that calls onValidityChange(true) so tests
// can drive the card-complete state without touching the real Stripe integration.
vi.mock('src/components/StripeCardForm', () => ({
  StripeCardForm: ({
    onValidityChange,
  }: {
    disabled?: boolean
    onValidityChange?: (complete: boolean) => void
    onError?: (error: string | null) => void
  }) => (
    <div data-testid="stripe-card-form-mock">
      <button data-testid="stripe-complete-btn" onClick={() => onValidityChange?.(true)}>
        Mark card complete
      </button>
    </div>
  ),
}))

const mockItems = [
  {
    _id: 'purchase-1',
    product: {
      _id: 'product-1',
      name: 'Test Product 1',
      image: 'test-image-1.jpg',
      price: 100000,
      price_before_discount: 150000,
      quantity: 10,
      sold: 50,
      view: 100,
      description: 'Test product description',
      category: {
        _id: 'cat-1',
        name: 'Test Category',
      },
      rating: 4.5,
      images: ['test-image-1.jpg'],
      location: 'Test Location',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    price: 100000,
    price_before_discount: 150000,
    buy_count: 2,
    status: 1 as const,
    user: 'user-1',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    disabled: false,
    isChecked: true,
  },
]

const mockAddress = {
  _id: 'addr-1',
  userId: 'user-1',
  fullName: 'John Doe',
  phone: '0123456789',
  street: '123 Test St',
  ward: 'Test Ward',
  district: 'Test District',
  province: 'Test Province',
  isDefault: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

const mockShippingMethod = {
  _id: 'ship-1',
  name: 'Express Shipping',
  description: 'Fast delivery',
  price: 30000,
  estimatedDays: '2-3 days',
  icon: 'express',
}

describe('OrderPreview', () => {
  const defaultProps = {
    items: mockItems,
    selectedAddress: mockAddress,
    selectedShippingMethod: mockShippingMethod,
    selectedPaymentMethod: 'cod' as const,
    onPlaceOrder: vi.fn(),
    onBack: vi.fn(),
    isPlacingOrder: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render shipping address', () => {
    render(<OrderPreview {...defaultProps} />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('should render product items', () => {
    render(<OrderPreview {...defaultProps} />)
    expect(screen.getByText('Test Product 1')).toBeInTheDocument()
  })

  it('should call onBack when back button clicked', () => {
    const onBack = vi.fn()
    render(<OrderPreview {...defaultProps} onBack={onBack} />)
    const backButton = screen.getByText('Quay lại')
    fireEvent.click(backButton)
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('should call onPlaceOrder when place order button clicked', () => {
    const onPlaceOrder = vi.fn()
    render(<OrderPreview {...defaultProps} onPlaceOrder={onPlaceOrder} />)
    const placeOrderButton = screen.getByText('Đặt hàng')
    fireEvent.click(placeOrderButton)
    expect(onPlaceOrder).toHaveBeenCalledTimes(1)
  })

  it('should disable place order button when placing order', () => {
    render(<OrderPreview {...defaultProps} isPlacingOrder={true} />)
    const placeOrderButton = screen.getByText('Đang xử lý...')
    expect(placeOrderButton).toBeDisabled()
  })

  it('should show message when no address selected', () => {
    render(<OrderPreview {...defaultProps} selectedAddress={null} />)
    expect(screen.getByText('Chưa chọn địa chỉ giao hàng')).toBeInTheDocument()
  })

  it('should render note when provided', () => {
    render(<OrderPreview {...defaultProps} note="Please deliver in the morning" />)
    expect(screen.getByText('Please deliver in the morning')).toBeInTheDocument()
  })

  it('should display voucher discount when provided', () => {
    render(<OrderPreview {...defaultProps} voucherCode="SAVE10" voucherDiscount={20000} />)
    expect(screen.getByText(/SAVE10/)).toBeInTheDocument()
  })

  it('shows noShipping message when selectedShippingMethod is null', () => {
    render(<OrderPreview {...defaultProps} selectedShippingMethod={null} />)
    expect(screen.getByText('Chưa chọn phương thức vận chuyển')).toBeInTheDocument()
  })

  it('shows noPayment message when selectedPaymentMethod is null', () => {
    render(<OrderPreview {...defaultProps} selectedPaymentMethod={null} />)
    expect(screen.getByText('Chưa chọn phương thức thanh toán')).toBeInTheDocument()
  })

  it('shows default badge when address isDefault is true', () => {
    render(<OrderPreview {...defaultProps} selectedAddress={{ ...mockAddress, isDefault: true }} />)
    expect(screen.getByText('Mặc định')).toBeInTheDocument()
  })

  it('shows line-through original price when price_before_discount > price', () => {
    // mockItems[0] has price_before_discount 150000 > price 100000
    const { container } = render(<OrderPreview {...defaultProps} />)
    const lineThroughEls = container.querySelectorAll('.line-through')
    expect(lineThroughEls.length).toBeGreaterThanOrEqual(1)
  })

  it('renders coins discount row when coinsUsed > 0', () => {
    render(<OrderPreview {...defaultProps} coinsUsed={5000} />)
    expect(screen.getByText(/Shopee Xu/)).toBeInTheDocument()
    expect(screen.getByText(/5000 xu/)).toBeInTheDocument()
  })

  it('renders voucher discount row when voucherDiscount > 0', () => {
    render(<OrderPreview {...defaultProps} voucherDiscount={15000} />)
    expect(screen.getByText(/Voucher giảm giá/)).toBeInTheDocument()
  })

  it('renders savings line when totalDiscount > 0', () => {
    render(<OrderPreview {...defaultProps} voucherDiscount={10000} />)
    expect(screen.getByText(/Tiết kiệm/)).toBeInTheDocument()
  })

  it('displays multiple items correctly', () => {
    const secondItem = {
      ...mockItems[0],
      _id: 'purchase-2',
      product: {
        ...mockItems[0].product,
        _id: 'product-2',
        name: 'Test Product 2',
        image: 'test-image-2.jpg',
      },
      price: 200000,
      price_before_discount: 200000,
      buy_count: 1,
    }
    render(<OrderPreview {...defaultProps} items={[...mockItems, secondItem]} />)
    expect(screen.getByText('Test Product 1')).toBeInTheDocument()
    expect(screen.getByText('Test Product 2')).toBeInTheDocument()
  })

  it('shows processing text on place order button when isPlacingOrder is true', () => {
    render(<OrderPreview {...defaultProps} isPlacingOrder={true} />)
    // The Button mock renders 'Đang xử lý...' when isLoading is true
    expect(screen.getByText('Đang xử lý...')).toBeInTheDocument()
  })

  it('does not render note section when note is empty string', () => {
    render(<OrderPreview {...defaultProps} note="" />)
    expect(screen.queryByText('Ghi chú đơn hàng')).not.toBeInTheDocument()
  })

  // credit_card payment gating tests
  describe('credit_card payment method', () => {
    const creditCardProps = { ...defaultProps, selectedPaymentMethod: 'credit_card' as const }

    it('initial render: Place Order button is disabled and hint text is shown when card is incomplete', () => {
      render(<OrderPreview {...creditCardProps} />)
      const placeOrderButton = screen.getByText('Đặt hàng')
      expect(placeOrderButton).toBeDisabled()
      expect(
        screen.getByText('Vui lòng nhập đầy đủ thông tin thẻ để tiếp tục đặt hàng'),
      ).toBeInTheDocument()
    })

    it('Place Order button becomes enabled and hint disappears after onValidityChange(true)', () => {
      render(<OrderPreview {...creditCardProps} />)
      fireEvent.click(screen.getByTestId('stripe-complete-btn'))
      const placeOrderButton = screen.getByText('Đặt hàng')
      expect(placeOrderButton).not.toBeDisabled()
      expect(
        screen.queryByText('Vui lòng nhập đầy đủ thông tin thẻ để tiếp tục đặt hàng'),
      ).not.toBeInTheDocument()
    })

    it('clicking Place Order while card is incomplete does NOT call onPlaceOrder', () => {
      const onPlaceOrder = vi.fn()
      render(<OrderPreview {...creditCardProps} onPlaceOrder={onPlaceOrder} />)
      // Card is incomplete initially; fire click on the button directly
      const placeOrderButton = screen.getByText('Đặt hàng')
      fireEvent.click(placeOrderButton)
      expect(onPlaceOrder).not.toHaveBeenCalled()
    })

    it('clicking Place Order after card is complete DOES call onPlaceOrder', () => {
      const onPlaceOrder = vi.fn()
      render(<OrderPreview {...creditCardProps} onPlaceOrder={onPlaceOrder} />)
      fireEvent.click(screen.getByTestId('stripe-complete-btn'))
      fireEvent.click(screen.getByText('Đặt hàng'))
      expect(onPlaceOrder).toHaveBeenCalledTimes(1)
    })
  })

  // Regression: COD must not be affected by card gating
  describe('cod payment method (regression)', () => {
    it('Place Order button is enabled without any card interaction', () => {
      render(<OrderPreview {...defaultProps} selectedPaymentMethod="cod" />)
      const placeOrderButton = screen.getByText('Đặt hàng')
      expect(placeOrderButton).not.toBeDisabled()
    })

    it('clicking Place Order with cod calls onPlaceOrder', () => {
      const onPlaceOrder = vi.fn()
      render(
        <OrderPreview {...defaultProps} selectedPaymentMethod="cod" onPlaceOrder={onPlaceOrder} />,
      )
      fireEvent.click(screen.getByText('Đặt hàng'))
      expect(onPlaceOrder).toHaveBeenCalledTimes(1)
    })
  })
})
