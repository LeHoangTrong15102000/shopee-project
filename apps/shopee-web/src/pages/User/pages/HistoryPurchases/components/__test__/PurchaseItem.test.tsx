import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PurchaseItem from '../PurchaseItem';
import { Purchase } from 'src/types/purchases.type';

const mockMutate = vi.fn();
let mockIsPending = false;

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('src/components/LiveOrderTracker', () => ({
  default: ({ orderId }: any) => <div data-testid="order-tracker">{orderId}</div>,
}));

vi.mock('src/hooks/optimistic', () => ({
  useOptimisticAddToCart: () => ({
    mutate: mockMutate,
    isPending: mockIsPending,
  }),
}));

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

// purchasesStatus: inCart=-1, all=0, waitForConfirmation=1, waitForGetting=2, inProgress=3, delivered=4, cancelled=5
// formatCurrency uses Intl.NumberFormat('de-DE') → 100000 → "100.000"

describe('PurchaseItem', () => {
  const mockPurchase: Purchase = {
    _id: 'purchase1',
    buy_count: 2,
    price: 100000,
    price_before_discount: 150000,
    status: 1,
    user: 'user1',
    product: {
      _id: 'prod1',
      name: 'Test Product',
      price: 100000,
      price_before_discount: 150000,
      image: 'test.jpg',
      rating: 4.5,
      sold: 100,
      view: 500,
      description: 'Test',
      category: { _id: 'cat1', name: 'Category' },
      quantity: 10,
      images: [],
      location: 'HN',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  const mockProps = {
    purchase: mockPurchase,
    reducedMotion: false,
    isExpanded: false,
    onToggleTracking: vi.fn(),
    onReviewClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
  });

  it('should render purchase information', () => {
    render(<PurchaseItem {...mockProps} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('x2')).toBeInTheDocument();
  });

  it('should render product image', () => {
    render(<PurchaseItem {...mockProps} />);
    const image = screen.getByAltText('Test Product');
    expect(image).toHaveAttribute('src', 'test.jpg');
  });

  it('should render prices', () => {
    render(<PurchaseItem {...mockProps} />);
    // formatCurrency uses de-DE locale: 100000 → "100.000"
    expect(screen.getByText('₫100.000')).toBeInTheDocument();
    expect(screen.getByText('₫150.000')).toBeInTheDocument();
  });

  it('should render total price', () => {
    render(<PurchaseItem {...mockProps} />);
    // 100000 * 2 = 200000 → "200.000"
    expect(screen.getByText('₫200.000')).toBeInTheDocument();
  });

  // delivered = 4
  it('should render delivered status', () => {
    const deliveredPurchase = { ...mockPurchase, status: 4 as any };
    render(<PurchaseItem {...mockProps} purchase={deliveredPurchase} />);
    expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
  });

  // waitForConfirmation = 1
  it('should render waiting for confirmation status', () => {
    const waitingPurchase = { ...mockPurchase, status: 1 as any };
    render(<PurchaseItem {...mockProps} purchase={waitingPurchase} />);
    expect(screen.getByText('Chờ xác nhận')).toBeInTheDocument();
  });

  // waitForGetting = 2
  it('should render waiting for pickup status', () => {
    const pickupPurchase = { ...mockPurchase, status: 2 as any };
    render(<PurchaseItem {...mockProps} purchase={pickupPurchase} />);
    expect(screen.getByText('Chờ lấy hàng')).toBeInTheDocument();
  });

  // inProgress = 3
  it('should render in progress status', () => {
    const inProgressPurchase = { ...mockPurchase, status: 3 as any };
    render(<PurchaseItem {...mockProps} purchase={inProgressPurchase} />);
    expect(screen.getByText('Đang giao')).toBeInTheDocument();
  });

  // cancelled = 5
  it('should render cancelled status', () => {
    const cancelledPurchase = { ...mockPurchase, status: 5 as any };
    render(<PurchaseItem {...mockProps} purchase={cancelledPurchase} />);
    expect(screen.getByText('Đã hủy')).toBeInTheDocument();
  });

  // Active orders: waitForConfirmation(1), waitForGetting(2), inProgress(3)
  it('should show order tracking button for active orders', () => {
    const activePurchase = { ...mockPurchase, status: 1 as any };
    render(<PurchaseItem {...mockProps} purchase={activePurchase} />);
    expect(screen.getByText('Theo dõi đơn hàng')).toBeInTheDocument();
  });

  it('should not show order tracking button for delivered orders', () => {
    const deliveredPurchase = { ...mockPurchase, status: 4 as any };
    render(<PurchaseItem {...mockProps} purchase={deliveredPurchase} />);
    expect(screen.queryByText('Theo dõi đơn hàng')).not.toBeInTheDocument();
  });

  it('should call onToggleTracking when tracking button is clicked', () => {
    const onToggleTracking = vi.fn();
    const activePurchase = { ...mockPurchase, status: 1 as any };
    render(
      <PurchaseItem {...mockProps} purchase={activePurchase} onToggleTracking={onToggleTracking} />,
    );
    const trackingButton = screen.getByText('Theo dõi đơn hàng');
    fireEvent.click(trackingButton);
    expect(onToggleTracking).toHaveBeenCalledWith('purchase1');
  });

  it('should show order tracker when expanded', () => {
    const activePurchase = { ...mockPurchase, status: 1 as any };
    render(<PurchaseItem {...mockProps} purchase={activePurchase} isExpanded={true} />);
    expect(screen.getByTestId('order-tracker')).toBeInTheDocument();
  });

  it('should not show order tracker when not expanded', () => {
    const activePurchase = { ...mockPurchase, status: 1 as any };
    render(<PurchaseItem {...mockProps} purchase={activePurchase} isExpanded={false} />);
    expect(screen.queryByTestId('order-tracker')).not.toBeInTheDocument();
  });

  it('should show reorder button for delivered orders', () => {
    const deliveredPurchase = { ...mockPurchase, status: 4 as any };
    render(<PurchaseItem {...mockProps} purchase={deliveredPurchase} />);
    expect(screen.getByText('Mua lại')).toBeInTheDocument();
  });

  it('should show review button for delivered orders', () => {
    const deliveredPurchase = { ...mockPurchase, status: 4 as any };
    render(<PurchaseItem {...mockProps} purchase={deliveredPurchase} />);
    expect(screen.getByText('Đánh Giá Sản Phẩm')).toBeInTheDocument();
  });

  it('should call onReviewClick when review button is clicked', () => {
    const onReviewClick = vi.fn();
    const deliveredPurchase = { ...mockPurchase, status: 4 as any };
    render(
      <PurchaseItem {...mockProps} purchase={deliveredPurchase} onReviewClick={onReviewClick} />,
    );
    const reviewButton = screen.getByText('Đánh Giá Sản Phẩm');
    fireEvent.click(reviewButton);
    expect(onReviewClick).toHaveBeenCalledWith(deliveredPurchase);
  });

  it('should show view shop reviews button', () => {
    render(<PurchaseItem {...mockProps} />);
    expect(screen.getByText('Xem Đánh Giá Shop')).toBeInTheDocument();
  });

  it('should link to product detail page', () => {
    render(<PurchaseItem {...mockProps} />);
    const link = screen.getByText('Test Product').closest('a');
    expect(link).toHaveAttribute('href');
  });

  it('should handle reorder with loading state', () => {
    mockIsPending = true;
    const deliveredPurchase = { ...mockPurchase, status: 4 as any };
    render(<PurchaseItem {...mockProps} purchase={deliveredPurchase} />);
    const reorderButton = screen.getByText('Mua lại').closest('button');
    expect(reorderButton).toBeDisabled();
  });
});
