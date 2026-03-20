import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import OrderCard from '../OrderCard';
import type { Order } from 'src/types/checkout.type';

vi.mock('src/components/ImageWithFallback', () => ({
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}));

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('src/config/orderStatus', () => ({
  ORDER_STATUS_CONFIG: {
    pending: {
      color: { light: 'text-amber-600', dark: 'text-amber-400' },
      bgColor: { light: 'bg-amber-50', dark: 'bg-amber-900/20' },
      borderColor: { light: 'border-amber-200', dark: 'border-amber-700' },
      icon: '⏳',
      animate: false,
    },
    delivered: {
      color: { light: 'text-emerald-600', dark: 'text-emerald-400' },
      bgColor: { light: 'bg-emerald-50', dark: 'bg-emerald-900/20' },
      borderColor: { light: 'border-emerald-200', dark: 'border-emerald-700' },
      icon: '✓',
    },
    cancelled: {
      color: { light: 'text-rose-600', dark: 'text-rose-400' },
      bgColor: { light: 'bg-rose-50', dark: 'bg-rose-900/20' },
      borderColor: { light: 'border-rose-200', dark: 'border-rose-700' },
      icon: '✕',
    },
  },
  getStatusLabel: (status: string) => status,
}));

vi.mock('src/constant/order', () => ({
  orderStatusToNumber: (status: string) => {
    const map: Record<string, number> = { pending: 1, delivered: 5, cancelled: 6 };
    return map[status] ?? 0;
  },
}));

const mockOrder: Order = {
  _id: 'order-abc12345',
  userId: 'user-1',
  items: [
    {
      product: {
        _id: 'p1',
        name: 'Product One',
        image: 'p1.jpg',
        images: [],
        price: 100000,
        price_before_discount: 120000,
        rating: 4.5,
        sold: 100,
        quantity: 10,
        view: 50,
        category: { _id: 'c1', name: 'Cat' },
        description: '',
        location: 'HCM',
        createdAt: '',
        updatedAt: '',
      },
      buyCount: 2,
      price: 100000,
      priceBeforeDiscount: 120000,
    },
  ],
  shippingAddress: {} as any,
  shippingMethod: {} as any,
  paymentMethod: 'cod',
  subtotal: 200000,
  shippingFee: 15000,
  discount: 0,
  coinsUsed: 0,
  coinsDiscount: 0,
  total: 215000,
  status: 'pending',
  createdAt: '2024-06-15T10:00:00Z',
  updatedAt: '2024-06-15T10:00:00Z',
};

const renderWithRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('OrderCard', () => {
  it('renders order ID', () => {
    renderWithRouter(<OrderCard order={mockOrder} />);
    expect(screen.getByText('ABC12345')).toBeInTheDocument();
  });

  it('renders product name', () => {
    renderWithRouter(<OrderCard order={mockOrder} />);
    expect(screen.getByText('Product One')).toBeInTheDocument();
  });

  it('renders product image', () => {
    renderWithRouter(<OrderCard order={mockOrder} />);
    expect(screen.getByAltText('Product One')).toBeInTheDocument();
  });

  it('renders buy count', () => {
    renderWithRouter(<OrderCard order={mockOrder} />);
    expect(screen.getByText('x2')).toBeInTheDocument();
  });

  it('renders total price', () => {
    renderWithRouter(<OrderCard order={mockOrder} />);
    expect(screen.getByText('₫215.000')).toBeInTheDocument();
  });

  it('renders cancel button for pending orders', () => {
    const onCancel = vi.fn();
    renderWithRouter(<OrderCard order={mockOrder} onCancel={onCancel} />);
    const cancelBtn = screen.getByText('Hủy đơn');
    expect(cancelBtn).toBeInTheDocument();
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledWith('order-abc12345');
  });

  it('renders reorder button for delivered orders', () => {
    const onReorder = vi.fn();
    const delivered = { ...mockOrder, status: 'delivered' as const };
    renderWithRouter(<OrderCard order={delivered} onReorder={onReorder} />);
    const reorderBtn = screen.getByText('Mua lại');
    fireEvent.click(reorderBtn);
    expect(onReorder).toHaveBeenCalledWith(delivered);
  });

  it('does not render cancel for delivered orders', () => {
    renderWithRouter(<OrderCard order={{ ...mockOrder, status: 'delivered' as const }} />);
    expect(screen.queryByText('Hủy đơn')).not.toBeInTheDocument();
  });

  it('renders details link', () => {
    renderWithRouter(<OrderCard order={mockOrder} />);
    expect(screen.getByText('Chi tiết →')).toBeInTheDocument();
  });

  it('renders tracking button when trackable', () => {
    const onToggle = vi.fn();
    renderWithRouter(
      <OrderCard
        order={mockOrder}
        isTrackable
        isTrackingExpanded={false}
        onToggleTracking={onToggle}
      />,
    );
    const trackBtn = screen.getByText('Theo dõi');
    fireEvent.click(trackBtn);
    expect(onToggle).toHaveBeenCalledWith('order-abc12345');
  });

  it('renders tracking content when expanded', () => {
    renderWithRouter(
      <OrderCard
        order={mockOrder}
        isTrackable
        isTrackingExpanded={true}
        onToggleTracking={vi.fn()}
        trackingContent={<div>Tracking info</div>}
      />,
    );
    expect(screen.getByText('Tracking info')).toBeInTheDocument();
  });

  it('shows more products text when >2 items', () => {
    const manyItems = {
      ...mockOrder,
      items: [
        ...mockOrder.items,
        {
          ...mockOrder.items[0],
          product: { ...mockOrder.items[0].product, _id: 'p2', name: 'Product Two' },
        },
        {
          ...mockOrder.items[0],
          product: { ...mockOrder.items[0].product, _id: 'p3', name: 'Product Three' },
        },
      ],
    };
    renderWithRouter(<OrderCard order={manyItems} />);
    expect(screen.getByText(/sản phẩm khác/)).toBeInTheDocument();
  });
});
