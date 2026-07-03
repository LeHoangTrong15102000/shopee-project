import React from 'react'
import { render } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ORDER_STATUS, type OrderStatusType } from '@/constants/order'

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockOrderData: { data: Record<string, unknown> | null } = { data: null }

jest.mock('@/hooks/useOrders', () => ({
  useOrderDetail: () => ({
    data: mockOrderData,
    isLoading: false,
  }),
  useCancelOrder: () => ({ mutate: jest.fn(), isPending: false }),
  useConfirmReceived: () => ({ mutate: jest.fn(), isPending: false }),
  useReturnOrder: () => ({ mutate: jest.fn() }),
}))

jest.mock('@/hooks/useReorder', () => ({
  useReorder: () => ({ mutate: jest.fn(), isPending: false }),
}))

jest.mock('@/hooks/useCanReview', () => ({
  useCanReview: () => ({ data: undefined, isLoading: true }),
}))

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    primary: '#EE4D2D',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    foreground: '#1a1a1a',
    background: '#ffffff',
    neutrals300: '#9e9e9e',
    neutrals400: '#6e6e6e',
    neutrals800: '#2a2a2a',
  }),
}))

jest.mock('@/utils/price', () => ({
  formatPrice: (v: number) => `₫${v.toLocaleString()}`,
}))

jest.mock('@/components/ui/DialogProvider', () => ({
  useDialog: () => ({
    showConfirm: jest.fn(),
    showAlert: jest.fn(),
  }),
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({ id: 'test-order-id' }),
  Stack: {
    Screen: ({ children }: { children?: React.ReactNode }) => children ?? null,
  },
}))

jest.mock('@/components/navigation/ScreenHeader', () => {
  const React = require('react')
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) =>
      React.createElement('View', { testID: 'screen-header', ...props }),
  }
})

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function renderWithClient(ui: React.ReactElement) {
  return render(<QueryClientProvider client={makeQueryClient()}>{ui}</QueryClientProvider>)
}

function makeOrder(status: OrderStatusType) {
  return {
    _id: 'order-test-12345',
    status,
    items: [
      {
        _id: 'item-001',
        product: {
          _id: 'p1',
          name: 'Test Product',
          image: 'https://example.com/img.jpg',
          price: 100000,
          price_before_discount: 150000,
          quantity: 10,
        },
        buy_count: 1,
        price: 100000,
        price_before_discount: 150000,
      },
    ],
    total_price: 100000,
    address: '123 Test Street, District 1',
    payment_method: 'cod',
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
  }
}

function setOrder(status: OrderStatusType) {
  mockOrderData.data = makeOrder(status)
}

// ─── Tests ──────────────────────────────────────────────────────────────────

import OrderDetailScreen from '../../app/order/[id]'

describe('OrderDetailScreen', () => {
  beforeEach(() => {
    mockOrderData.data = null
  })

  // ─── Status badge rendering ─────────────────────────────────────────────

  it.each([
    [ORDER_STATUS.PENDING, 'Pending'],
    [ORDER_STATUS.CONFIRMED, 'Confirmed'],
    [ORDER_STATUS.PROCESSING, 'Processing'],
    [ORDER_STATUS.SHIPPING, 'Shipping'],
    [ORDER_STATUS.DELIVERED, 'Delivered'],
    [ORDER_STATUS.CANCELLED, 'Cancelled'],
    [ORDER_STATUS.RETURNED, 'Returned'],
  ] as [OrderStatusType, string][])('renders badge "%s" → "%s"', (status, label) => {
    setOrder(status)
    const { getAllByText } = renderWithClient(<OrderDetailScreen />)
    expect(getAllByText(label).length).toBeGreaterThanOrEqual(1)
  })

  // ─── Cancel button: visible for PENDING and CONFIRMED only ────────────

  it.each([ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED] as OrderStatusType[])(
    'shows cancel button for %s',
    (status) => {
      setOrder(status)
      const { getByText } = renderWithClient(<OrderDetailScreen />)
      expect(getByText('Cancel Order')).toBeTruthy()
    }
  )

  it.each([
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.SHIPPING,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.RETURNED,
  ] as OrderStatusType[])('hides cancel button for %s', (status) => {
    setOrder(status)
    const { queryByText } = renderWithClient(<OrderDetailScreen />)
    expect(queryByText('Cancel Order')).toBeNull()
  })

  // ─── Confirm-received button: visible for SHIPPING only ───────────────

  it('shows confirm-received button for SHIPPING', () => {
    setOrder(ORDER_STATUS.SHIPPING)
    const { getByText } = renderWithClient(<OrderDetailScreen />)
    expect(getByText('Confirm Receipt')).toBeTruthy()
  })

  it.each([
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.RETURNED,
  ] as OrderStatusType[])('hides confirm-received button for %s', (status) => {
    setOrder(status)
    const { queryByText } = renderWithClient(<OrderDetailScreen />)
    expect(queryByText('Confirm Receipt')).toBeNull()
  })

  // ─── Return button: visible for DELIVERED only ────────────────────────

  it('shows return button for DELIVERED', () => {
    setOrder(ORDER_STATUS.DELIVERED)
    const { getByText } = renderWithClient(<OrderDetailScreen />)
    // "Return" is the action button label for DELIVERED status
    expect(getByText('Return')).toBeTruthy()
  })

  it.each([
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.SHIPPING,
    ORDER_STATUS.CANCELLED,
  ] as OrderStatusType[])('hides return button for %s', (status) => {
    setOrder(status)
    const { queryByText } = renderWithClient(<OrderDetailScreen />)
    expect(queryByText('Return')).toBeNull()
  })

  // ─── Timeline rendering ──────────────────────────────────────────────

  it('renders timeline for normal flow statuses', () => {
    setOrder(ORDER_STATUS.SHIPPING)
    const { getByText, getAllByText } = renderWithClient(<OrderDetailScreen />)
    // Timeline steps (English via global i18n mock)
    expect(getByText('Order Placed')).toBeTruthy()
    // "Confirmed", "Processing", "Shipping", "Delivered" may also appear in the status badge,
    // so use getAllByText to handle multiple occurrences
    expect(getAllByText('Confirmed').length).toBeGreaterThanOrEqual(1)
    expect(getAllByText('Processing').length).toBeGreaterThanOrEqual(1)
    expect(getAllByText('Shipping').length).toBeGreaterThanOrEqual(1)
    expect(getAllByText('Delivered').length).toBeGreaterThanOrEqual(1)
  })

  it('renders cancelled timeline for CANCELLED status', () => {
    setOrder(ORDER_STATUS.CANCELLED)
    const { getByText, getAllByText } = renderWithClient(<OrderDetailScreen />)
    expect(getByText('Order Placed')).toBeTruthy()
    expect(getAllByText('Cancelled').length).toBeGreaterThanOrEqual(1)
  })

  it('renders returned timeline for RETURNED status', () => {
    setOrder(ORDER_STATUS.RETURNED)
    const { getByText, getAllByText } = renderWithClient(<OrderDetailScreen />)
    expect(getByText('Order Placed')).toBeTruthy()
    expect(getByText('Delivered')).toBeTruthy()
    // "Returned" appears in both the badge and the timeline
    expect(getAllByText('Returned').length).toBeGreaterThanOrEqual(1)
  })

  // ─── Order info rendering ────────────────────────────────────────────

  it('renders order ID and product info', () => {
    setOrder(ORDER_STATUS.PENDING)
    const { getByText } = renderWithClient(<OrderDetailScreen />)
    expect(getByText('Test Product')).toBeTruthy()
    expect(getByText(/ST-12345/i)).toBeTruthy()
  })

  it('renders "not found" when order is null', () => {
    mockOrderData.data = null
    const { getByText } = renderWithClient(<OrderDetailScreen />)
    expect(getByText('Order not found')).toBeTruthy()
  })
})
