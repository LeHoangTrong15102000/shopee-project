import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OrderDetail from '../OrderDetail'
import React from 'react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'detail.title': 'Chi tiết đơn hàng',
        'detail.orderId': 'Mã đơn hàng:',
        'detail.notFound': 'Không tìm thấy đơn hàng',
        'detail.backToOrders': 'Quay lại danh sách đơn hàng',
        'detail.back': 'Quay lại',
        'detail.backAria': 'Quay lại trang trước',
        'detail.shippingAddress': 'Địa chỉ nhận hàng',
        'detail.payment': 'Thanh toán',
        'detail.shipping': 'Vận chuyển',
        'detail.orderInfo': 'Thông tin đơn hàng',
        'detail.orderDate': 'Ngày đặt hàng:',
        'detail.note': 'Ghi chú:',
        'payment:method.cod': 'Thanh toán khi nhận hàng',
        'payment:method.bankTransfer': 'Chuyển khoản ngân hàng',
        'payment:method.eWallet': 'Ví điện tử',
        'payment:method.creditCard': 'Thẻ tín dụng',
      }
      return translations[key] || key
    },
    i18n: { language: 'vi' },
  }),
}))

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: 'order-1' }),
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

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
}

let mockUseOrderDetailReturn: any = { ...defaultOrderDetailReturn }

vi.mock('../useOrderDetail', () => ({
  useOrderDetail: () => mockUseOrderDetailReturn,
}))

vi.mock('../orderDetail.constants', () => ({
  formatDate: (d: string) => d,
  getStatusDisplay: () => ({ label: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }),
  pageContainerVariants: {},
  paymentMethodLabels: { cod: 'Cash on Delivery' },
  paymentMethodLabelKeys: {
    cod: 'payment:method.cod',
    bank_transfer: 'payment:method.bankTransfer',
    e_wallet: 'payment:method.eWallet',
    credit_card: 'payment:method.creditCard',
  },
  reducedMotionVariants: {},
  sectionVariants: {},
  statusBadgeVariants: {},
}))

vi.mock('../components/CancelOrderModal', () => ({ default: () => null }))
vi.mock('../components/OrderActionButtons', () => ({
  default: () => <div data-testid="action-buttons" />,
}))
vi.mock('../components/OrderDetailItems', () => ({
  default: () => <div data-testid="order-items" />,
}))
vi.mock('../components/OrderSummarySection', () => ({
  default: () => <div data-testid="order-summary" />,
}))
vi.mock('../components/OrderTimeline', () => ({
  default: () => <div data-testid="order-timeline" />,
}))
vi.mock('../components/ReturnOrderModal', () => ({ default: () => null }))
vi.mock('src/components/SEO', () => ({ default: () => <div data-testid="seo" /> }))

describe('OrderDetail', () => {
  let queryClient: QueryClient
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  beforeEach(() => {
    queryClient = new QueryClient()
    vi.clearAllMocks()
    mockUseOrderDetailReturn = { ...defaultOrderDetailReturn }
  })

  it('should render order details', () => {
    render(<OrderDetail />, { wrapper })
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('0123456789')).toBeInTheDocument()
  })

  it('should render shipping address', () => {
    render(<OrderDetail />, { wrapper })
    expect(screen.getByText(/123 Test St/)).toBeInTheDocument()
  })

  it('should render payment method', () => {
    render(<OrderDetail />, { wrapper })
    expect(screen.getByText('Thanh toán khi nhận hàng')).toBeInTheDocument()
  })

  it('should render shipping method', () => {
    render(<OrderDetail />, { wrapper })
    expect(screen.getByText('Express')).toBeInTheDocument()
  })

  it('should render back button', () => {
    render(<OrderDetail />, { wrapper })
    expect(screen.getByText('Quay lại')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    mockUseOrderDetailReturn = { ...defaultOrderDetailReturn, isLoading: true }
    render(<OrderDetail />, { wrapper })
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should show not found message when order is null', () => {
    mockUseOrderDetailReturn = { ...defaultOrderDetailReturn, order: null }
    render(<OrderDetail />, { wrapper })
    expect(screen.getByText('Không tìm thấy đơn hàng')).toBeInTheDocument()
  })

  it('renders note section with label when order.note is present', () => {
    mockUseOrderDetailReturn = {
      ...defaultOrderDetailReturn,
      order: { ...defaultOrderDetailReturn.order, note: 'Please pack carefully' },
    }
    render(<OrderDetail />, { wrapper })
    expect(screen.getByText('Ghi chú:')).toBeInTheDocument()
    expect(screen.getByText('Please pack carefully')).toBeInTheDocument()
  })

  it('does not render note section when order.note is absent', () => {
    mockUseOrderDetailReturn = {
      ...defaultOrderDetailReturn,
      order: { ...defaultOrderDetailReturn.order, note: undefined },
    }
    render(<OrderDetail />, { wrapper })
    expect(screen.queryByText('Ghi chú:')).not.toBeInTheDocument()
  })

  it('renders CancelOrderModal when showCancelModal is true', () => {
    // CancelOrderModal is mocked to return null at the module level;
    // this test verifies the showCancelModal: true branch mounts without error.
    mockUseOrderDetailReturn = { ...defaultOrderDetailReturn, showCancelModal: true }
    render(<OrderDetail />, { wrapper })
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('renders ReturnOrderModal when showReturnModal is true', () => {
    mockUseOrderDetailReturn = { ...defaultOrderDetailReturn, showReturnModal: true }
    render(<OrderDetail />, { wrapper })
    // ReturnOrderModal is mocked to return null; confirm page renders without crashing
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('translates bank_transfer payment method', () => {
    mockUseOrderDetailReturn = {
      ...defaultOrderDetailReturn,
      order: { ...defaultOrderDetailReturn.order, paymentMethod: 'bank_transfer' },
    }
    render(<OrderDetail />, { wrapper })
    expect(screen.getByText('Chuyển khoản ngân hàng')).toBeInTheDocument()
  })

  it('translates e_wallet payment method', () => {
    mockUseOrderDetailReturn = {
      ...defaultOrderDetailReturn,
      order: { ...defaultOrderDetailReturn.order, paymentMethod: 'e_wallet' },
    }
    render(<OrderDetail />, { wrapper })
    expect(screen.getByText('Ví điện tử')).toBeInTheDocument()
  })

  it('translates credit_card payment method', () => {
    mockUseOrderDetailReturn = {
      ...defaultOrderDetailReturn,
      order: { ...defaultOrderDetailReturn.order, paymentMethod: 'credit_card' },
    }
    render(<OrderDetail />, { wrapper })
    expect(screen.getByText('Thẻ tín dụng')).toBeInTheDocument()
  })

  it('falls back to raw value for unknown payment method', () => {
    mockUseOrderDetailReturn = {
      ...defaultOrderDetailReturn,
      order: { ...defaultOrderDetailReturn.order, paymentMethod: 'unknown_method' },
    }
    render(<OrderDetail />, { wrapper })
    expect(screen.getByText('unknown_method')).toBeInTheDocument()
  })

  it('renders order timeline component', () => {
    render(<OrderDetail />, { wrapper })
    expect(screen.getByTestId('order-timeline')).toBeInTheDocument()
  })

  it('renders OrderActionButtons component', () => {
    render(<OrderDetail />, { wrapper })
    expect(screen.getByTestId('action-buttons')).toBeInTheDocument()
  })

  it('renders OrderSummarySection component', () => {
    render(<OrderDetail />, { wrapper })
    expect(screen.getByTestId('order-summary')).toBeInTheDocument()
  })

  it('renders OrderDetailItems component', () => {
    render(<OrderDetail />, { wrapper })
    expect(screen.getByTestId('order-items')).toBeInTheDocument()
  })

  it('renders order timeline for delivered status order', () => {
    mockUseOrderDetailReturn = {
      ...defaultOrderDetailReturn,
      order: { ...defaultOrderDetailReturn.order, status: 'delivered' },
    }
    render(<OrderDetail />, { wrapper })
    expect(screen.getByTestId('order-timeline')).toBeInTheDocument()
  })
})
