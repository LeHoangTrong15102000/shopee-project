import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import OrderPreview from '../OrderPreview';

vi.mock('framer-motion', () => ({
  motion: { div: 'div', p: 'p' },
}));

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

vi.mock('src/components/ImageWithFallback', () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, disabled, isLoading, className }: any) => (
    <button onClick={onClick} disabled={disabled || isLoading} className={className}>
      {isLoading ? 'Đang xử lý...' : children}
    </button>
  ),
}));

vi.mock('src/components/Icons', () => ({
  ShippingIcon: ({ type }: any) => <div data-testid="shipping-icon">{type}</div>,
  PaymentIcon: ({ type }: any) => <div data-testid="payment-icon">{type}</div>,
}));

const mockItems = [
  {
    _id: 'purchase-1',
    product: {
      _id: 'product-1',
      name: 'Test Product 1',
      image: 'test-image-1.jpg',
    },
    price: 100000,
    price_before_discount: 150000,
    buy_count: 2,
  },
];

const mockAddress = {
  fullName: 'John Doe',
  phone: '0123456789',
  street: '123 Test St',
  ward: 'Test Ward',
  district: 'Test District',
  province: 'Test Province',
  isDefault: true,
};

const mockShippingMethod = {
  name: 'Express Shipping',
  description: 'Fast delivery',
  price: 30000,
  estimatedDays: '2-3 days',
  icon: 'express',
};

describe('OrderPreview', () => {
  const defaultProps = {
    items: mockItems,
    selectedAddress: mockAddress,
    selectedShippingMethod: mockShippingMethod,
    selectedPaymentMethod: 'cod' as const,
    onPlaceOrder: vi.fn(),
    onBack: vi.fn(),
    isPlacingOrder: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render shipping address', () => {
    render(<OrderPreview {...defaultProps} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render product items', () => {
    render(<OrderPreview {...defaultProps} />);
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
  });

  it('should call onBack when back button clicked', () => {
    const onBack = vi.fn();
    render(<OrderPreview {...defaultProps} onBack={onBack} />);
    const backButton = screen.getByText('Quay lại');
    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('should call onPlaceOrder when place order button clicked', () => {
    const onPlaceOrder = vi.fn();
    render(<OrderPreview {...defaultProps} onPlaceOrder={onPlaceOrder} />);
    const placeOrderButton = screen.getByText('Đặt hàng');
    fireEvent.click(placeOrderButton);
    expect(onPlaceOrder).toHaveBeenCalledTimes(1);
  });

  it('should disable place order button when placing order', () => {
    render(<OrderPreview {...defaultProps} isPlacingOrder={true} />);
    const placeOrderButton = screen.getByText('Đang xử lý...');
    expect(placeOrderButton).toBeDisabled();
  });

  it('should show message when no address selected', () => {
    render(<OrderPreview {...defaultProps} selectedAddress={null} />);
    expect(screen.getByText('Chưa chọn địa chỉ giao hàng')).toBeInTheDocument();
  });

  it('should render note when provided', () => {
    render(<OrderPreview {...defaultProps} note="Please deliver in the morning" />);
    expect(screen.getByText('Please deliver in the morning')).toBeInTheDocument();
  });

  it('should display voucher discount when provided', () => {
    render(<OrderPreview {...defaultProps} voucherCode="SAVE10" voucherDiscount={20000} />);
    expect(screen.getByText(/SAVE10/)).toBeInTheDocument();
  });
});
