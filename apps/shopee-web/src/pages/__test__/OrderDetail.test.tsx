import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import React from 'react'
import OrderDetail from '../User/pages/OrderDetail/OrderDetail'

// Mock variables for mutable state
let mockOrder: any = null
let mockIsLoading = false
let mockNavigate = vi.fn()

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}))

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'detail.title': 'Order Details',
        'detail.orderId': 'Order ID',
        'detail.back': 'Back',
        'detail.backAria': 'Go back',
        'detail.notFound': 'Order not found',
        'detail.backToOrders': 'Back to orders',
        'detail.shippingAddress': 'Shipping Address',
        'detail.payment': 'Payment Method',
        'detail.shipping': 'Shipping Method',
        'detail.orderInfo': 'Order Information',
        'detail.orderDate': 'Order Date',
        'detail.note': 'Note',
      }
      return translations[key] || key
    },
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}))

// Mock react-router
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ orderId: 'order123' }),
    Link: ({ children, to, ...props }: any) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  }
})

// Mock SEO component
vi.mock('src/components/SEO', () => ({
  default: ({ title }: { title: string }) => <div data-testid="seo">{title}</div>,
}))

// Mock child components
vi.mock('../User/pages/OrderDetail/components/CancelOrderModal', () => ({
  default: () => <div data-testid="cancel-modal">Cancel Modal</div>,
}))

vi.mock('../User/pages/OrderDetail/components/OrderActionButtons', () => ({
  default: ({
    canCancel,
    canReturn,
    isReturnExpired,
  }: {
    canCancel: boolean
    canReturn: boolean
    isReturnExpired: boolean
  }) => (
    <div data-testid="action-buttons">
      {canCancel && <button data-testid="cancel-button">Cancel Order</button>}
      {canReturn && <button data-testid="return-button">Return Order</button>}
      {isReturnExpired && <div data-testid="return-expired">Return period expired</div>}
    </div>
  ),
}))

vi.mock('../User/pages/OrderDetail/components/OrderDetailItems', () => ({
  default: () => <div data-testid="order-items">Order Items</div>,
}))

vi.mock('../User/pages/OrderDetail/components/OrderSummarySection', () => ({
  default: () => <div data-testid="order-summary">Order Summary</div>,
}))

vi.mock('../User/pages/OrderDetail/components/OrderTimeline', () => ({
  default: () => <div data-testid="order-timeline">Order Timeline</div>,
}))

vi.mock('../User/pages/OrderDetail/components/ReturnOrderModal', () => ({
  default: () => <div data-testid="return-modal">Return Modal</div>,
}))

// Mock useOrderDetail hook
vi.mock('../User/pages/OrderDetail/useOrderDetail', () => ({
  useOrderDetail: () => ({
    order: mockOrder,
    tracking: null,
    isLoading: mockIsLoading,
    navigate: mockNavigate,
    currentStatus: null,
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
    cancelMutation: { isPending: false },
    returnMutation: { isPending: false },
    handleCancelOrder: vi.fn(),
    handleReturnOrder: vi.fn(),
  }),
}))

const renderComponent = () => {
  return render(
    <MemoryRouter>
      <OrderDetail />
    </MemoryRouter>,
  )
}

describe('OrderDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOrder = null
    mockIsLoading = false
    mockNavigate = vi.fn()
  })

  describe('Loading State', () => {
    it('shows spinner when loading', () => {
      mockIsLoading = true
      const { container } = renderComponent()

      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeTruthy()
      expect(spinner?.classList.contains('border-orange')).toBe(true)
    })
  })

  describe('Not Found State', () => {
    it('shows not found message when order does not exist', () => {
      mockOrder = null
      mockIsLoading = false

      renderComponent()

      expect(screen.getByText('Order not found')).toBeTruthy()
      expect(screen.getByText('Back to orders')).toBeTruthy()
    })

    it('renders link to orders list when order not found', () => {
      mockOrder = null
      mockIsLoading = false

      const { container } = renderComponent()

      const link = container.querySelector('a[href="/user/purchase"]')
      expect(link).toBeTruthy()
      expect(link?.textContent).toBe('Back to orders')
    })
  })

  describe('Order Details Rendering', () => {
    beforeEach(() => {
      mockOrder = {
        _id: 'order123456789',
        status: 'pending',
        total: 100000,
        shippingAddress: {
          fullName: 'John Doe',
          phone: '0123456789',
          street: '123 Main St',
          ward: 'Ward 1',
          district: 'District 1',
          province: 'HCM',
        },
        items: [],
        paymentMethod: 'cod',
        shippingMethod: { name: 'Standard', estimatedDays: '3-5 days' },
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      }
      mockIsLoading = false
    })

    it('renders order ID correctly', () => {
      renderComponent()

      expect(screen.getByText(/Order ID/i)).toBeTruthy()
      expect(screen.getAllByText(/56789/i).length).toBeGreaterThan(0)
    })

    it('renders order date', () => {
      renderComponent()

      expect(screen.getByText('Order Date')).toBeTruthy()
    })

    it('renders order status badge', () => {
      renderComponent()

      const { container } = renderComponent()
      const statusBadge = container.querySelector('.rounded-full.px-4.py-2')
      expect(statusBadge).toBeTruthy()
    })

    it('renders order items component', () => {
      renderComponent()

      expect(screen.getByTestId('order-items')).toBeTruthy()
    })
  })

  describe('Shipping Address Display', () => {
    beforeEach(() => {
      mockOrder = {
        _id: 'order123',
        status: 'pending',
        total: 100000,
        shippingAddress: {
          fullName: 'Jane Smith',
          phone: '0987654321',
          street: '456 Oak Ave',
          ward: 'Ward 5',
          district: 'District 3',
          province: 'Hanoi',
        },
        items: [],
        paymentMethod: 'cod',
        shippingMethod: { name: 'Express', estimatedDays: '1-2 days' },
        createdAt: '2026-03-15T10:00:00.000Z',
        updatedAt: '2026-03-15T10:00:00.000Z',
      }
      mockIsLoading = false
    })

    it('displays shipping address section', () => {
      renderComponent()

      expect(screen.getByText('Shipping Address')).toBeTruthy()
    })

    it('displays full name in shipping address', () => {
      renderComponent()

      expect(screen.getByText('Jane Smith')).toBeTruthy()
    })

    it('displays phone number in shipping address', () => {
      renderComponent()

      expect(screen.getByText('0987654321')).toBeTruthy()
    })

    it('displays complete address', () => {
      renderComponent()

      expect(screen.getByText(/456 Oak Ave/)).toBeTruthy()
      expect(screen.getByText(/Ward 5/)).toBeTruthy()
      expect(screen.getByText(/District 3/)).toBeTruthy()
      expect(screen.getByText(/Hanoi/)).toBeTruthy()
    })
  })

  describe('Payment Method Display', () => {
    it('displays payment method section', () => {
      mockOrder = {
        _id: 'order123',
        status: 'pending',
        total: 100000,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0123456789',
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          province: 'HCM',
        },
        items: [],
        paymentMethod: 'cod',
        shippingMethod: { name: 'Standard', estimatedDays: '3-5 days' },
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      }
      mockIsLoading = false

      renderComponent()

      expect(screen.getByText('Payment Method')).toBeTruthy()
    })

    it('displays shipping method section', () => {
      mockOrder = {
        _id: 'order123',
        status: 'pending',
        total: 100000,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0123456789',
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          province: 'HCM',
        },
        items: [],
        paymentMethod: 'cod',
        shippingMethod: { name: 'Express Delivery', estimatedDays: '1-2 days' },
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      }
      mockIsLoading = false

      renderComponent()

      expect(screen.getByText('Shipping Method')).toBeTruthy()
      expect(screen.getByText('Express Delivery')).toBeTruthy()
      expect(screen.getByText('1-2 days')).toBeTruthy()
    })
  })

  describe('Note Field', () => {
    it('shows note field when order has note', () => {
      mockOrder = {
        _id: 'order123',
        status: 'pending',
        total: 100000,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0123456789',
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          province: 'HCM',
        },
        items: [],
        paymentMethod: 'cod',
        shippingMethod: { name: 'Standard', estimatedDays: '3-5 days' },
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
        note: 'Please deliver after 5 PM',
      }
      mockIsLoading = false

      renderComponent()

      expect(screen.getByText('Note')).toBeTruthy()
      expect(screen.getByText('Please deliver after 5 PM')).toBeTruthy()
    })

    it('hides note field when order has no note', () => {
      mockOrder = {
        _id: 'order123',
        status: 'pending',
        total: 100000,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0123456789',
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          province: 'HCM',
        },
        items: [],
        paymentMethod: 'cod',
        shippingMethod: { name: 'Standard', estimatedDays: '3-5 days' },
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      }
      mockIsLoading = false

      renderComponent()

      expect(screen.queryByText('Note')).toBeNull()
    })
  })

  describe('Cancel Button', () => {
    it('shows cancel button for pending orders', () => {
      mockOrder = {
        _id: 'order123',
        status: 'pending',
        total: 100000,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0123456789',
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          province: 'HCM',
        },
        items: [],
        paymentMethod: 'cod',
        shippingMethod: { name: 'Standard', estimatedDays: '3-5 days' },
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      }
      mockIsLoading = false

      renderComponent()

      expect(screen.getByTestId('cancel-button')).toBeTruthy()
    })

    it('shows cancel button for confirmed orders', () => {
      mockOrder = {
        _id: 'order123',
        status: 'confirmed',
        total: 100000,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0123456789',
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          province: 'HCM',
        },
        items: [],
        paymentMethod: 'cod',
        shippingMethod: { name: 'Standard', estimatedDays: '3-5 days' },
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      }
      mockIsLoading = false

      renderComponent()

      expect(screen.getByTestId('cancel-button')).toBeTruthy()
    })

    it('hides cancel button for shipped orders', () => {
      mockOrder = {
        _id: 'order123',
        status: 'shipped',
        total: 100000,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0123456789',
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          province: 'HCM',
        },
        items: [],
        paymentMethod: 'cod',
        shippingMethod: { name: 'Standard', estimatedDays: '3-5 days' },
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      }
      mockIsLoading = false

      renderComponent()

      expect(screen.queryByTestId('cancel-button')).toBeNull()
    })

    it('hides cancel button for delivered orders', () => {
      mockOrder = {
        _id: 'order123',
        status: 'delivered',
        total: 100000,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0123456789',
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          province: 'HCM',
        },
        items: [],
        paymentMethod: 'cod',
        shippingMethod: { name: 'Standard', estimatedDays: '3-5 days' },
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      }
      mockIsLoading = false

      renderComponent()

      expect(screen.queryByTestId('cancel-button')).toBeNull()
    })

    it('hides cancel button for cancelled orders', () => {
      mockOrder = {
        _id: 'order123',
        status: 'cancelled',
        total: 100000,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0123456789',
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          province: 'HCM',
        },
        items: [],
        paymentMethod: 'cod',
        shippingMethod: { name: 'Standard', estimatedDays: '3-5 days' },
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      }
      mockIsLoading = false

      renderComponent()

      expect(screen.queryByTestId('cancel-button')).toBeNull()
    })
  })

  describe('Return Button', () => {
    it('shows return button for delivered orders within 7 days', () => {
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 5) // 5 days ago

      mockOrder = {
        _id: 'order123',
        status: 'delivered',
        total: 100000,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0123456789',
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          province: 'HCM',
        },
        items: [],
        paymentMethod: 'cod',
        shippingMethod: { name: 'Standard', estimatedDays: '3-5 days' },
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: recentDate.toISOString(),
      }
      mockIsLoading = false

      renderComponent()

      expect(screen.getByTestId('return-button')).toBeTruthy()
    })

    it('shows return expired message for delivered orders after 7 days', () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 10) // 10 days ago

      mockOrder = {
        _id: 'order123',
        status: 'delivered',
        total: 100000,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0123456789',
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          province: 'HCM',
        },
        items: [],
        paymentMethod: 'cod',
        shippingMethod: { name: 'Standard', estimatedDays: '3-5 days' },
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: oldDate.toISOString(),
      }
      mockIsLoading = false

      renderComponent()

      expect(screen.getByTestId('return-expired')).toBeTruthy()
      expect(screen.queryByTestId('return-button')).toBeNull()
    })

    it('hides return button for non-delivered orders', () => {
      mockOrder = {
        _id: 'order123',
        status: 'pending',
        total: 100000,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0123456789',
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          province: 'HCM',
        },
        items: [],
        paymentMethod: 'cod',
        shippingMethod: { name: 'Standard', estimatedDays: '3-5 days' },
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      }
      mockIsLoading = false

      renderComponent()

      expect(screen.queryByTestId('return-button')).toBeNull()
      expect(screen.queryByTestId('return-expired')).toBeNull()
    })
  })

  describe('Order Status Badge', () => {
    it('renders status badge for pending order', () => {
      mockOrder = {
        _id: 'order123',
        status: 'pending',
        total: 100000,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0123456789',
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          province: 'HCM',
        },
        items: [],
        paymentMethod: 'cod',
        shippingMethod: { name: 'Standard', estimatedDays: '3-5 days' },
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      }
      mockIsLoading = false

      const { container } = renderComponent()

      const badge = container.querySelector('.rounded-full.px-4.py-2')
      expect(badge).toBeTruthy()
    })

    it('renders status badge for confirmed order', () => {
      mockOrder = {
        _id: 'order123',
        status: 'confirmed',
        total: 100000,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0123456789',
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          province: 'HCM',
        },
        items: [],
        paymentMethod: 'cod',
        shippingMethod: { name: 'Standard', estimatedDays: '3-5 days' },
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      }
      mockIsLoading = false

      const { container } = renderComponent()

      const badge = container.querySelector('.rounded-full.px-4.py-2')
      expect(badge).toBeTruthy()
    })

    it('renders status badge for delivered order', () => {
      mockOrder = {
        _id: 'order123',
        status: 'delivered',
        total: 100000,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0123456789',
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          province: 'HCM',
        },
        items: [],
        paymentMethod: 'cod',
        shippingMethod: { name: 'Standard', estimatedDays: '3-5 days' },
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      }
      mockIsLoading = false

      const { container } = renderComponent()

      const badge = container.querySelector('.rounded-full.px-4.py-2')
      expect(badge).toBeTruthy()
    })
  })

  describe('Back Button Navigation', () => {
    it('renders back button', () => {
      mockOrder = {
        _id: 'order123',
        status: 'pending',
        total: 100000,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0123456789',
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          province: 'HCM',
        },
        items: [],
        paymentMethod: 'cod',
        shippingMethod: { name: 'Standard', estimatedDays: '3-5 days' },
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      }
      mockIsLoading = false

      renderComponent()

      expect(screen.getByText('Back')).toBeTruthy()
    })

    it('back button has correct aria label', () => {
      mockOrder = {
        _id: 'order123',
        status: 'pending',
        total: 100000,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0123456789',
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          province: 'HCM',
        },
        items: [],
        paymentMethod: 'cod',
        shippingMethod: { name: 'Standard', estimatedDays: '3-5 days' },
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      }
      mockIsLoading = false

      const { container } = renderComponent()

      const backButton = container.querySelector('button[aria-label="Go back"]')
      expect(backButton).toBeTruthy()
    })
  })

  describe('Component Integration', () => {
    it('renders all child components when order exists', () => {
      mockOrder = {
        _id: 'order123',
        status: 'pending',
        total: 100000,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0123456789',
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          province: 'HCM',
        },
        items: [],
        paymentMethod: 'cod',
        shippingMethod: { name: 'Standard', estimatedDays: '3-5 days' },
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      }
      mockIsLoading = false

      renderComponent()

      expect(screen.getByTestId('order-timeline')).toBeTruthy()
      expect(screen.getByTestId('order-items')).toBeTruthy()
      expect(screen.getByTestId('order-summary')).toBeTruthy()
      expect(screen.getByTestId('action-buttons')).toBeTruthy()
    })

    it('renders SEO component with correct title', () => {
      mockOrder = {
        _id: 'order123456789',
        status: 'pending',
        total: 100000,
        shippingAddress: {
          fullName: 'Test User',
          phone: '0123456789',
          street: '123 Test St',
          ward: 'Ward 1',
          district: 'District 1',
          province: 'HCM',
        },
        items: [],
        paymentMethod: 'cod',
        shippingMethod: { name: 'Standard', estimatedDays: '3-5 days' },
        createdAt: '2026-03-10T10:00:00.000Z',
        updatedAt: '2026-03-10T10:00:00.000Z',
      }
      mockIsLoading = false

      renderComponent()

      const seo = screen.getByTestId('seo')
      expect(seo.textContent).toContain('Order Details')
      expect(seo.textContent).toContain('56789')
    })
  })
})
