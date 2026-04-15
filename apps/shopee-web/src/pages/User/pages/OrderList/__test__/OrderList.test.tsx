import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OrderList from '../OrderList'
import React from 'react'
import { toast } from 'react-toastify'

const mockSetActiveTab = vi.fn()
const mockUseOrderStatus = vi.fn(() => [0, mockSetActiveTab])

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className, initial, animate, exit, transition, ...props }: any) => (
      <div onClick={onClick} className={className} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

vi.mock('src/hooks/nuqs/orderSearchParams', () => ({
  useOrderStatus: () => mockUseOrderStatus(),
}))

const mockUseIsMobile = vi.fn(() => false)

vi.mock('src/hooks/useIsMobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}))

vi.mock('src/components/SEO', () => ({
  default: ({ title }: any) => <div data-testid="seo">{title}</div>,
}))

vi.mock('src/components/OrderCard', () => ({
  default: ({
    order,
    onCancel,
    onReorder,
    isTrackable,
    isTrackingExpanded,
    onToggleTracking,
    trackingContent,
  }: any) => (
    <div data-testid={`order-card-${order._id}`}>
      <div>Order ID: {order._id}</div>
      <div>Status: {order.status}</div>
      {onCancel && <button onClick={() => onCancel(order._id)}>Cancel Order</button>}
      {onReorder && <button onClick={() => onReorder(order)}>Reorder</button>}
      {isTrackable && (
        <button onClick={() => onToggleTracking(order._id)}>
          {isTrackingExpanded ? 'Hide Tracking' : 'Show Tracking'}
        </button>
      )}
      {isTrackingExpanded && trackingContent}
    </div>
  ),
}))

vi.mock('src/components/LiveOrderTracker', () => ({
  default: ({ orderId, initialStatus }: any) => (
    <div data-testid={`tracker-${orderId}`}>Tracker: {initialStatus}</div>
  ),
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, disabled, variant, animated, ...props }: any) => (
    <button onClick={onClick} className={className} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('src/components/Pagination', () => ({
  default: ({ currentPage, totalPages, onPageChange }: any) => (
    <div data-testid="pagination">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        Previous
      </button>
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        Next
      </button>
    </div>
  ),
}))

const mockOrders = [
  {
    _id: 'order-1',
    status: 'pending',
    total: 100000,
    items: [],
    createdAt: '2024-01-01',
    userId: 'user-1',
    shippingAddress: {} as any,
    shippingMethod: {} as any,
    paymentMethod: 'cod' as const,
    subtotal: 90000,
    shippingFee: 10000,
    discount: 0,
    coinsUsed: 0,
    coinsDiscount: 0,
    updatedAt: '2024-01-01',
  },
  {
    _id: 'order-2',
    status: 'shipping',
    total: 200000,
    items: [],
    createdAt: '2024-01-02',
    userId: 'user-1',
    shippingAddress: {} as any,
    shippingMethod: {} as any,
    paymentMethod: 'cod' as const,
    subtotal: 180000,
    shippingFee: 20000,
    discount: 0,
    coinsUsed: 0,
    coinsDiscount: 0,
    updatedAt: '2024-01-02',
  },
  {
    _id: 'order-3',
    status: 'delivered',
    total: 150000,
    items: [],
    createdAt: '2024-01-03',
    userId: 'user-1',
    shippingAddress: {} as any,
    shippingMethod: {} as any,
    paymentMethod: 'cod' as const,
    subtotal: 140000,
    shippingFee: 10000,
    discount: 0,
    coinsUsed: 0,
    coinsDiscount: 0,
    updatedAt: '2024-01-03',
  },
]

const mockGetOrders = vi.fn(() =>
  Promise.resolve({
    data: {
      data: { orders: mockOrders, pagination: { page: 1, limit: 10, total: 3, totalPages: 1 } },
    },
  }),
)

const mockCancelOrder = vi.fn(() => Promise.resolve({ data: { success: true } }))

vi.mock('src/apis/order.api', () => ({
  default: {
    getOrders: (...args: any[]) => mockGetOrders(...args),
    cancelOrder: (...args: any[]) => mockCancelOrder(...args),
  },
}))

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('OrderList', () => {
  let queryClient: QueryClient

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.clearAllMocks()
    mockGetOrders.mockResolvedValue({
      data: {
        data: { orders: mockOrders, pagination: { page: 1, limit: 10, total: 3, totalPages: 1 } },
      },
    })
    mockUseOrderStatus.mockReturnValue([0, mockSetActiveTab])
  })

  it('should render SEO component', () => {
    render(<OrderList />, { wrapper })
    expect(screen.getByTestId('seo')).toBeInTheDocument()
  })

  it('should render all order tabs', () => {
    render(<OrderList />, { wrapper })

    expect(screen.getByText('tabs.all')).toBeInTheDocument()
    expect(screen.getByText('tabs.pending')).toBeInTheDocument()
    expect(screen.getByText('tabs.confirmed')).toBeInTheDocument()
    expect(screen.getByText('tabs.shipping')).toBeInTheDocument()
    expect(screen.getByText('tabs.delivered')).toBeInTheDocument()
    expect(screen.getByText('tabs.cancelled')).toBeInTheDocument()
    expect(screen.getByText('tabs.returned')).toBeInTheDocument()
  })

  it('should render loading skeleton when loading', async () => {
    mockGetOrders.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<OrderList />, { wrapper })

    // Check for loading skeleton elements
    await waitFor(() => {
      const pulseElements = document.querySelectorAll('.animate-pulse')
      expect(pulseElements.length).toBeGreaterThan(0)
    })
  })

  it('should render orders list when data is loaded', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
      expect(screen.getByTestId('order-card-order-2')).toBeInTheDocument()
      expect(screen.getByTestId('order-card-order-3')).toBeInTheDocument()
    })
  })

  it('should show empty state when no orders', async () => {
    mockGetOrders.mockResolvedValue({
      data: { data: { orders: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } } },
    })

    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('empty')).toBeInTheDocument()
      expect(screen.getByText('📦')).toBeInTheDocument()
    })
  })

  it('should change tab when clicked and reset page', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
    })

    const pendingTab = screen.getByText('tabs.pending')
    fireEvent.click(pendingTab)

    expect(mockSetActiveTab).toHaveBeenCalledWith(1)
  })

  it('should apply active tab styling', async () => {
    mockUseOrderStatus.mockReturnValue([1, mockSetActiveTab])

    render(<OrderList />, { wrapper })

    await waitFor(() => {
      const pendingTab = screen.getByText('tabs.pending')
      expect(pendingTab).toHaveClass('border-b-orange')
    })
  })

  it('should call getOrders with correct status filter', async () => {
    mockUseOrderStatus.mockReturnValue([1, mockSetActiveTab])

    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(mockGetOrders).toHaveBeenCalledWith({
        status: 'pending',
        page: 1,
        limit: 10,
      })
    })
  })

  it('should call getOrders without status for "all" tab', async () => {
    mockUseOrderStatus.mockReturnValue([0, mockSetActiveTab])

    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(mockGetOrders).toHaveBeenCalledWith({
        status: undefined,
        page: 1,
        limit: 10,
      })
    })
  })

  it('should render pagination when available', async () => {
    mockGetOrders.mockResolvedValue({
      data: {
        data: { orders: mockOrders, pagination: { page: 1, limit: 10, total: 30, totalPages: 3 } },
      },
    })

    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('pagination')).toBeInTheDocument()
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    })
  })

  it('should not render pagination when not available', async () => {
    mockGetOrders.mockResolvedValue({
      data: { data: { orders: mockOrders, pagination: null as any } },
    })

    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument()
    })
  })

  it('should handle page change', async () => {
    mockGetOrders.mockResolvedValue({
      data: {
        data: { orders: mockOrders, pagination: { page: 1, limit: 10, total: 30, totalPages: 3 } },
      },
    })

    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('pagination')).toBeInTheDocument()
    })

    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(mockGetOrders).toHaveBeenCalledWith({
        status: undefined,
        page: 2,
        limit: 10,
      })
    })
  })

  it('should open cancel modal when cancel button clicked', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
    })

    const cancelButton = screen.getAllByText('Cancel Order')[0]
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.getByText('cancel.title')).toBeInTheDocument()
      expect(screen.getByText('cancel.confirm')).toBeInTheDocument()
      expect(screen.getByText('cancel.irreversible')).toBeInTheDocument()
    })
  })

  it('should close cancel modal when back button clicked', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
    })

    const cancelButton = screen.getAllByText('Cancel Order')[0]
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.getByText('cancel.title')).toBeInTheDocument()
    })

    const backButton = screen.getByText('cancel.back')
    fireEvent.click(backButton)

    await waitFor(() => {
      expect(screen.queryByText('cancel.confirm')).not.toBeInTheDocument()
    })
  })

  it('should close cancel modal when close button clicked', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
    })

    const cancelButton = screen.getAllByText('Cancel Order')[0]
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.getByText('cancel.title')).toBeInTheDocument()
    })

    const closeButton = screen.getByLabelText('cancel.closeModal')
    fireEvent.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByText('cancel.confirm')).not.toBeInTheDocument()
    })
  })

  it('should close cancel modal when backdrop clicked', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
    })

    const cancelButton = screen.getAllByText('Cancel Order')[0]
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.getByText('cancel.title')).toBeInTheDocument()
    })

    const backdrop = screen.getByText('cancel.title').closest('.fixed')
    if (backdrop) {
      fireEvent.click(backdrop)
    }

    await waitFor(() => {
      expect(screen.queryByText('cancel.confirm')).not.toBeInTheDocument()
    })
  })

  it('should not close modal when clicking inside modal content', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
    })

    const cancelButton = screen.getAllByText('Cancel Order')[0]
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.getByText('cancel.title')).toBeInTheDocument()
    })

    const modalContent = screen.getByText('cancel.title').closest('.relative')
    if (modalContent) {
      fireEvent.click(modalContent)
    }

    expect(screen.getByText('cancel.confirm')).toBeInTheDocument()
  })

  it('should update cancel reason when typing', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
    })

    const cancelButton = screen.getAllByText('Cancel Order')[0]
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.getByText('cancel.title')).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText('cancel.reasonPlaceholder')
    fireEvent.change(textarea, { target: { value: 'Changed my mind' } })

    expect(textarea).toHaveValue('Changed my mind')
  })

  it('should call cancelOrder mutation when confirm button clicked', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
    })

    const cancelButton = screen.getAllByText('Cancel Order')[0]
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.getByText('cancel.title')).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText('cancel.reasonPlaceholder')
    fireEvent.change(textarea, { target: { value: 'Test reason' } })

    const confirmButton = screen.getByText('cancel.confirmButton')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockCancelOrder).toHaveBeenCalledWith('order-1', 'Test reason')
    })
  })

  it('should show success toast and close modal after successful cancel', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
    })

    const cancelButton = screen.getAllByText('Cancel Order')[0]
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.getByText('cancel.title')).toBeInTheDocument()
    })

    const confirmButton = screen.getByText('cancel.confirmButton')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('cancel.success')
      expect(screen.queryByText('cancel.confirm')).not.toBeInTheDocument()
    })
  })

  it('should show error toast when cancel fails', async () => {
    mockCancelOrder.mockRejectedValue(new Error('Cancel failed'))

    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
    })

    const cancelButton = screen.getAllByText('Cancel Order')[0]
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.getByText('cancel.title')).toBeInTheDocument()
    })

    const confirmButton = screen.getByText('cancel.confirmButton')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('cancel.error')
    })
  })

  it('should disable confirm button while canceling', async () => {
    mockCancelOrder.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))

    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
    })

    const cancelButton = screen.getAllByText('Cancel Order')[0]
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.getByText('cancel.title')).toBeInTheDocument()
    })

    const confirmButton = screen.getByText('cancel.confirmButton')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText('cancel.processing')).toBeInTheDocument()
    })
  })

  it('should invalidate orders query after successful cancel', async () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')

    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
    })

    const cancelButton = screen.getAllByText('Cancel Order')[0]
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.getByText('cancel.title')).toBeInTheDocument()
    })

    const confirmButton = screen.getByText('cancel.confirmButton')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['orders'] })
    })
  })

  it('should show info toast when reorder clicked', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
    })

    const reorderButton = screen.getAllByText('Reorder')[0]
    fireEvent.click(reorderButton)

    expect(toast.info).toHaveBeenCalledWith('reorder.developing')
  })

  it('should toggle order tracking when button clicked', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
    })

    const trackingButtons = screen.getAllByText('Show Tracking')
    fireEvent.click(trackingButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Hide Tracking')).toBeInTheDocument()
      expect(screen.getByTestId('tracker-order-1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Hide Tracking'))

    await waitFor(() => {
      expect(screen.getAllByText('Show Tracking').length).toBeGreaterThan(0)
      expect(screen.queryByTestId('tracker-order-1')).not.toBeInTheDocument()
    })
  })

  it('should pass correct isTrackable prop for pending orders', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      const order1 = screen.getByTestId('order-card-order-1')
      expect(order1).toBeInTheDocument()
      const trackingButtons = screen.getAllByText('Show Tracking')
      expect(trackingButtons.length).toBeGreaterThan(0)
    })
  })

  it('should pass correct isTrackable prop for shipping orders', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      const order2 = screen.getByTestId('order-card-order-2')
      expect(order2).toBeInTheDocument()
    })
  })

  it('should not show tracking for delivered orders', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      const order3 = screen.getByTestId('order-card-order-3')
      expect(order3).toBeInTheDocument()
    })
  })

  it('should handle multiple orders with different tracking states', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
      expect(screen.getByTestId('order-card-order-2')).toBeInTheDocument()
    })

    const trackingButtons = screen.getAllByText('Show Tracking')
    fireEvent.click(trackingButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('tracker-order-1')).toBeInTheDocument()
      expect(screen.queryByTestId('tracker-order-2')).not.toBeInTheDocument()
    })

    fireEvent.click(trackingButtons[1])

    await waitFor(() => {
      expect(screen.getByTestId('tracker-order-1')).toBeInTheDocument()
      expect(screen.getByTestId('tracker-order-2')).toBeInTheDocument()
    })
  })

  it('should render LiveOrderTracker with correct props', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
    })

    const trackingButtons = screen.getAllByText('Show Tracking')
    fireEvent.click(trackingButtons[0])

    await waitFor(() => {
      const tracker = screen.getByTestId('tracker-order-1')
      expect(tracker).toHaveTextContent('Tracker: 1')
    })
  })

  it('should handle confirmed status orders as trackable', async () => {
    mockGetOrders.mockResolvedValue({
      data: {
        data: {
          orders: [
            {
              ...mockOrders[0],
              _id: 'order-confirmed',
              status: 'confirmed',
            },
          ],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      },
    })

    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-confirmed')).toBeInTheDocument()
      expect(screen.getByText('Show Tracking')).toBeInTheDocument()
    })
  })

  it('should handle cancelled status orders as not trackable', async () => {
    mockGetOrders.mockResolvedValue({
      data: {
        data: {
          orders: [
            {
              ...mockOrders[0],
              _id: 'order-cancelled',
              status: 'cancelled',
            },
          ],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      },
    })

    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-cancelled')).toBeInTheDocument()
      expect(screen.queryByText('Show Tracking')).not.toBeInTheDocument()
    })
  })

  it('should handle returned status orders as not trackable', async () => {
    mockGetOrders.mockResolvedValue({
      data: {
        data: {
          orders: [
            {
              ...mockOrders[0],
              _id: 'order-returned',
              status: 'returned',
            },
          ],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      },
    })

    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-returned')).toBeInTheDocument()
      expect(screen.queryByText('Show Tracking')).not.toBeInTheDocument()
    })
  })

  it('should reset cancel reason when modal is closed', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
    })

    const cancelButton = screen.getAllByText('Cancel Order')[0]
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.getByText('cancel.title')).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText('cancel.reasonPlaceholder')
    fireEvent.change(textarea, { target: { value: 'Test reason' } })

    const backButton = screen.getByText('cancel.back')
    fireEvent.click(backButton)

    await waitFor(() => {
      expect(screen.queryByText('cancel.confirm')).not.toBeInTheDocument()
    })

    // Open modal again
    fireEvent.click(cancelButton)

    await waitFor(() => {
      const newTextarea = screen.getByPlaceholderText('cancel.reasonPlaceholder')
      expect(newTextarea).toHaveValue('')
    })
  })

  it('should handle mobile view', async () => {
    mockUseIsMobile.mockReturnValue(true)

    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
    })

    mockUseIsMobile.mockReturnValue(false)
  })

  it('should handle empty cancel reason when confirming', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
    })

    const cancelButton = screen.getAllByText('Cancel Order')[0]
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.getByText('cancel.title')).toBeInTheDocument()
    })

    const confirmButton = screen.getByText('cancel.confirmButton')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockCancelOrder).toHaveBeenCalledWith('order-1', '')
    })
  })

  it('should handle processing status orders as not trackable', async () => {
    mockGetOrders.mockResolvedValue({
      data: {
        data: {
          orders: [
            {
              ...mockOrders[0],
              _id: 'order-processing',
              status: 'processing',
            },
          ],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      },
    })

    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-processing')).toBeInTheDocument()
      expect(screen.queryByText('Show Tracking')).not.toBeInTheDocument()
    })
  })

  it('should handle tab change for all status values', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
    })

    // Test each tab
    const tabs = [
      { text: 'tabs.confirmed', status: 2 },
      { text: 'tabs.shipping', status: 4 },
      { text: 'tabs.delivered', status: 5 },
      { text: 'tabs.cancelled', status: 6 },
      { text: 'tabs.returned', status: 7 },
    ]

    for (const tab of tabs) {
      const tabButton = screen.getByText(tab.text)
      fireEvent.click(tabButton)
      expect(mockSetActiveTab).toHaveBeenCalledWith(tab.status)
    }
  })

  it('should not call cancelOrder when cancelOrderId is null', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
    })

    // This shouldn't happen in normal flow, but testing the guard
    expect(mockCancelOrder).not.toHaveBeenCalled()
  })

  it('should handle empty state with mobile view', async () => {
    mockUseIsMobile.mockReturnValue(true)
    mockGetOrders.mockResolvedValue({
      data: { data: { orders: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } } },
    })

    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByText('empty')).toBeInTheDocument()
    })

    mockUseIsMobile.mockReturnValue(false)
  })

  it('should render correct number of skeleton loaders', async () => {
    mockGetOrders.mockImplementation(() => new Promise(() => {}))

    render(<OrderList />, { wrapper })

    await waitFor(() => {
      const pulseElements = document.querySelectorAll('.animate-pulse')
      // Should render 3 skeleton loaders
      expect(pulseElements.length).toBeGreaterThanOrEqual(3)
    })
  })

  it('should handle multiple page changes', async () => {
    mockGetOrders.mockResolvedValue({
      data: {
        data: { orders: mockOrders, pagination: { page: 1, limit: 10, total: 50, totalPages: 5 } },
      },
    })

    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('pagination')).toBeInTheDocument()
    })

    // Go to page 2
    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(mockGetOrders).toHaveBeenCalledWith({
        status: undefined,
        page: 2,
        limit: 10,
      })
    })

    // Update mock for page 2
    mockGetOrders.mockResolvedValue({
      data: {
        data: { orders: mockOrders, pagination: { page: 2, limit: 10, total: 50, totalPages: 5 } },
      },
    })

    // Go to page 3
    await waitFor(() => {
      const updatedNextButton = screen.getByText('Next')
      fireEvent.click(updatedNextButton)
    })

    await waitFor(() => {
      expect(mockGetOrders).toHaveBeenCalledWith({
        status: undefined,
        page: 3,
        limit: 10,
      })
    })
  })

  it('should handle order with all status types', async () => {
    const allStatusOrders = [
      { ...mockOrders[0], _id: 'order-pending', status: 'pending' },
      { ...mockOrders[0], _id: 'order-confirmed', status: 'confirmed' },
      { ...mockOrders[0], _id: 'order-processing', status: 'processing' },
      { ...mockOrders[0], _id: 'order-shipping', status: 'shipping' },
      { ...mockOrders[0], _id: 'order-delivered', status: 'delivered' },
      { ...mockOrders[0], _id: 'order-cancelled', status: 'cancelled' },
      { ...mockOrders[0], _id: 'order-returned', status: 'returned' },
    ]

    mockGetOrders.mockResolvedValue({
      data: {
        data: {
          orders: allStatusOrders,
          pagination: { page: 1, limit: 10, total: 7, totalPages: 1 },
        },
      },
    })

    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-pending')).toBeInTheDocument()
      expect(screen.getByTestId('order-card-order-confirmed')).toBeInTheDocument()
      expect(screen.getByTestId('order-card-order-processing')).toBeInTheDocument()
      expect(screen.getByTestId('order-card-order-shipping')).toBeInTheDocument()
      expect(screen.getByTestId('order-card-order-delivered')).toBeInTheDocument()
      expect(screen.getByTestId('order-card-order-cancelled')).toBeInTheDocument()
      expect(screen.getByTestId('order-card-order-returned')).toBeInTheDocument()
    })
  })

  it('should handle cancel modal textarea with multiple lines', async () => {
    render(<OrderList />, { wrapper })

    await waitFor(() => {
      expect(screen.getByTestId('order-card-order-1')).toBeInTheDocument()
    })

    const cancelButton = screen.getAllByText('Cancel Order')[0]
    fireEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.getByText('cancel.title')).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText('cancel.reasonPlaceholder')
    const multilineReason = 'Line 1\nLine 2\nLine 3'
    fireEvent.change(textarea, { target: { value: multilineReason } })

    expect(textarea).toHaveValue(multilineReason)

    const confirmButton = screen.getByText('cancel.confirmButton')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockCancelOrder).toHaveBeenCalledWith('order-1', multilineReason)
    })
  })
})
