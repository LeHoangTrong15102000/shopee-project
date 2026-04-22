import React from 'react'
import { render } from '@testing-library/react-native'
import { ORDER_STATUS, type OrderStatusType } from '@/constants/order'

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockOrderData = { data: null as any }

jest.mock('@/hooks/useOrders', () => ({
  useOrderDetail: () => ({
    data: mockOrderData,
    isLoading: false,
  }),
  useCancelOrder: () => ({ mutate: jest.fn(), isPending: false }),
  useConfirmReceived: () => ({ mutate: jest.fn(), isPending: false }),
  useReturnOrder: () => ({ mutate: jest.fn() }),
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
    Screen: ({ children }: any) => children ?? null,
  },
}))

jest.mock('@/components/navigation/ScreenHeader', () => {
  const React = require('react')
  return {
    __esModule: true,
    default: (props: any) => React.createElement('View', { testID: 'screen-header', ...props }),
  }
})

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeOrder(status: OrderStatusType) {
  return {
    _id: 'order-test-12345',
    status,
    items: [
      {
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
    [ORDER_STATUS.PENDING, 'Chờ xác nhận'],
    [ORDER_STATUS.CONFIRMED, 'Đã xác nhận'],
    [ORDER_STATUS.PROCESSING, 'Đang xử lý'],
    [ORDER_STATUS.SHIPPING, 'Đang giao'],
    [ORDER_STATUS.DELIVERED, 'Đã giao'],
    [ORDER_STATUS.CANCELLED, 'Đã hủy'],
    [ORDER_STATUS.RETURNED, 'Trả hàng'],
  ] as [OrderStatusType, string][])('renders badge "%s" → "%s"', (status, label) => {
    setOrder(status)
    const { getAllByText } = render(<OrderDetailScreen />)
    expect(getAllByText(label).length).toBeGreaterThanOrEqual(1)
  })

  // ─── Cancel button: visible for PENDING and CONFIRMED only ────────────

  it.each([
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CONFIRMED,
  ] as OrderStatusType[])('shows cancel button for %s', (status) => {
    setOrder(status)
    const { getByText } = render(<OrderDetailScreen />)
    expect(getByText('Hủy đơn hàng')).toBeTruthy()
  })

  it.each([
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.SHIPPING,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.RETURNED,
  ] as OrderStatusType[])('hides cancel button for %s', (status) => {
    setOrder(status)
    const { queryByText } = render(<OrderDetailScreen />)
    expect(queryByText('Hủy đơn hàng')).toBeNull()
  })

  // ─── Confirm-received button: visible for SHIPPING only ───────────────

  it('shows confirm-received button for SHIPPING', () => {
    setOrder(ORDER_STATUS.SHIPPING)
    const { getByText } = render(<OrderDetailScreen />)
    expect(getByText('Đã nhận hàng')).toBeTruthy()
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
    const { queryByText } = render(<OrderDetailScreen />)
    expect(queryByText('Đã nhận hàng')).toBeNull()
  })

  // ─── Return button: visible for DELIVERED only ────────────────────────

  it('shows return button for DELIVERED', () => {
    setOrder(ORDER_STATUS.DELIVERED)
    const { getByText } = render(<OrderDetailScreen />)
    // "Trả hàng" appears as action button for DELIVERED
    expect(getByText('Trả hàng')).toBeTruthy()
  })

  it.each([
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.SHIPPING,
    ORDER_STATUS.CANCELLED,
  ] as OrderStatusType[])('hides return button for %s', (status) => {
    setOrder(status)
    const { queryByText } = render(<OrderDetailScreen />)
    expect(queryByText('Trả hàng')).toBeNull()
  })

  // ─── Timeline rendering ──────────────────────────────────────────────

  it('renders timeline for normal flow statuses', () => {
    setOrder(ORDER_STATUS.SHIPPING)
    const { getByText } = render(<OrderDetailScreen />)
    // Timeline should show these steps
    expect(getByText('Đặt hàng')).toBeTruthy()
    expect(getByText('Đã xác nhận')).toBeTruthy()
    expect(getByText('Đang xử lý')).toBeTruthy()
    expect(getByText('Đang vận chuyển')).toBeTruthy()
    expect(getByText('Đã giao hàng')).toBeTruthy()
  })

  it('renders cancelled timeline for CANCELLED status', () => {
    setOrder(ORDER_STATUS.CANCELLED)
    const { getByText, getAllByText } = render(<OrderDetailScreen />)
    expect(getByText('Đặt hàng')).toBeTruthy()
    expect(getAllByText('Đã hủy').length).toBeGreaterThanOrEqual(1)
  })

  it('renders returned timeline for RETURNED status', () => {
    setOrder(ORDER_STATUS.RETURNED)
    const { getByText, getAllByText } = render(<OrderDetailScreen />)
    expect(getByText('Đặt hàng')).toBeTruthy()
    expect(getByText('Đã giao hàng')).toBeTruthy()
    // "Trả hàng" appears in both the badge and the timeline
    expect(getAllByText('Trả hàng').length).toBeGreaterThanOrEqual(1)
  })

  // ─── Order info rendering ────────────────────────────────────────────

  it('renders order ID and product info', () => {
    setOrder(ORDER_STATUS.PENDING)
    const { getByText } = render(<OrderDetailScreen />)
    expect(getByText('Test Product')).toBeTruthy()
    expect(getByText(/ST-12345/i)).toBeTruthy()
  })

  it('renders "not found" when order is null', () => {
    mockOrderData.data = null
    const { getByText } = render(<OrderDetailScreen />)
    expect(getByText('Không tìm thấy đơn hàng')).toBeTruthy()
  })
})
