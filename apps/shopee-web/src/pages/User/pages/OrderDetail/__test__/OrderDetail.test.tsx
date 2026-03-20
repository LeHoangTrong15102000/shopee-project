import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OrderDetail from '../OrderDetail';
import React from 'react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => false,
}));

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: 'order-1' }),
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

const defaultOrderDetailReturn = {
  order: {
    _id: 'order-1',
    status: 'pending',
    total: 100000,
    shippingAddress: {
      fullName: 'John Doe',
      phone: '0123456789',
      street: '123 Test St',
      ward: 'Ward',
      district: 'District',
      province: 'Province',
    },
    paymentMethod: 'cod',
    shippingMethod: { name: 'Express', estimatedDays: '2-3 days' },
    items: [],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  tracking: null,
  isLoading: false,
  navigate: vi.fn(),
  currentStatus: 1,
  isSubscribed: false,
  stepTimestamps: {},
  showCancelModal: false,
  setShowCancelModal: vi.fn(),
  cancelReason: '',
  setCancelReason: vi.fn(),
  showReturnModal: false,
  setShowReturnModal: vi.fn(),
  returnReason: '',
  setReturnReason: vi.fn(),
  returnReasonError: '',
  setReturnReasonError: vi.fn(),
  cancelMutation: { isPending: false, mutate: vi.fn() },
  returnMutation: { isPending: false, mutate: vi.fn() },
  handleCancelOrder: vi.fn(),
  handleReturnOrder: vi.fn(),
};

let mockUseOrderDetailReturn: any = { ...defaultOrderDetailReturn };

vi.mock('../useOrderDetail', () => ({
  useOrderDetail: () => mockUseOrderDetailReturn,
}));

vi.mock('../orderDetail.constants', () => ({
  formatDate: (d: string) => d,
  getStatusDisplay: () => ({ label: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }),
  pageContainerVariants: {},
  paymentMethodLabels: { cod: 'Cash on Delivery' },
  reducedMotionVariants: {},
  sectionVariants: {},
  statusBadgeVariants: {},
}));

vi.mock('../components/CancelOrderModal', () => ({ default: () => null }));
vi.mock('../components/OrderActionButtons', () => ({
  default: () => <div data-testid="action-buttons" />,
}));
vi.mock('../components/OrderDetailItems', () => ({
  default: () => <div data-testid="order-items" />,
}));
vi.mock('../components/OrderSummarySection', () => ({
  default: () => <div data-testid="order-summary" />,
}));
vi.mock('../components/OrderTimeline', () => ({
  default: () => <div data-testid="order-timeline" />,
}));
vi.mock('../components/ReturnOrderModal', () => ({ default: () => null }));
vi.mock('src/components/SEO', () => ({ default: () => <div data-testid="seo" /> }));

describe('OrderDetail', () => {
  let queryClient: QueryClient;
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient();
    vi.clearAllMocks();
    mockUseOrderDetailReturn = { ...defaultOrderDetailReturn };
  });

  it('should render order details', () => {
    render(<OrderDetail />, { wrapper });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('0123456789')).toBeInTheDocument();
  });

  it('should render shipping address', () => {
    render(<OrderDetail />, { wrapper });
    expect(screen.getByText(/123 Test St/)).toBeInTheDocument();
  });

  it('should render payment method', () => {
    render(<OrderDetail />, { wrapper });
    expect(screen.getByText(/detail.payment/)).toBeInTheDocument();
  });

  it('should render shipping method', () => {
    render(<OrderDetail />, { wrapper });
    expect(screen.getByText('Express')).toBeInTheDocument();
  });

  it('should render back button', () => {
    render(<OrderDetail />, { wrapper });
    expect(screen.getByText('detail.back')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    mockUseOrderDetailReturn = { ...defaultOrderDetailReturn, isLoading: true };
    render(<OrderDetail />, { wrapper });
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should show not found message when order is null', () => {
    mockUseOrderDetailReturn = { ...defaultOrderDetailReturn, order: null };
    render(<OrderDetail />, { wrapper });
    expect(screen.getByText('detail.notFound')).toBeInTheDocument();
  });
});
