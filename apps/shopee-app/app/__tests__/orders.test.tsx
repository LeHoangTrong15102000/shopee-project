import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { ORDER_STATUS } from '@/constants/order'

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockUseOrders = jest.fn()
const mockUseCancelOrder = jest.fn(() => ({ mutate: jest.fn() }))
const mockUseConfirmReceived = jest.fn(() => ({ mutate: jest.fn() }))
const mockUseReturnOrder = jest.fn(() => ({ mutate: jest.fn() }))

jest.mock('@/hooks/useOrders', () => ({
  useOrders: (...args: any[]) => mockUseOrders(...args),
  useCancelOrder: () => mockUseCancelOrder(),
  useConfirmReceived: () => mockUseConfirmReceived(),
  useReturnOrder: () => mockUseReturnOrder(),
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
  useLocalSearchParams: () => ({}),
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

jest.mock('@/components/orders/OrderSkeleton', () => {
  const React = require('react')
  return {
    __esModule: true,
    default: () => React.createElement('View', { testID: 'order-skeleton' }),
  }
})

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeEmptyResult() {
  return {
    data: {
      pages: [{ data: { orders: [], pagination: { page: 1, limit: 10, total: 0, total_pages: 0 } } }],
    },
    isLoading: false,
    isRefetching: false,
    refetch: jest.fn(),
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  }
}

function makeLoadingResult() {
  return {
    data: undefined,
    isLoading: true,
    isRefetching: false,
    refetch: jest.fn(),
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

import OrdersScreen from '../../app/orders'

describe('OrdersScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseOrders.mockReturnValue(makeEmptyResult())
  })

  // ─── Tab → API status mapping ───────────────────────────────────────────

  it('calls useOrders with undefined for "Tất cả" tab (default)', () => {
    render(<OrdersScreen />)
    expect(mockUseOrders).toHaveBeenCalledWith(undefined)
  })

  it('calls useOrders with ORDER_STATUS.PENDING when "Chờ xác nhận" tab is pressed', () => {
    const { getByText } = render(<OrdersScreen />)
    fireEvent.press(getByText('Chờ xác nhận'))
    expect(mockUseOrders).toHaveBeenCalledWith(ORDER_STATUS.PENDING)
  })

  it('calls useOrders with ORDER_STATUS.SHIPPING when "Đang giao" tab is pressed', () => {
    const { getByText } = render(<OrdersScreen />)
    fireEvent.press(getByText('Đang giao'))
    expect(mockUseOrders).toHaveBeenCalledWith(ORDER_STATUS.SHIPPING)
  })

  it('calls useOrders with ORDER_STATUS.DELIVERED when "Đã giao" tab is pressed', () => {
    const { getByText } = render(<OrdersScreen />)
    fireEvent.press(getByText('Đã giao'))
    expect(mockUseOrders).toHaveBeenCalledWith(ORDER_STATUS.DELIVERED)
  })

  it('calls useOrders with ORDER_STATUS.CANCELLED when "Đã hủy" tab is pressed', () => {
    const { getByText } = render(<OrdersScreen />)
    fireEvent.press(getByText('Đã hủy'))
    expect(mockUseOrders).toHaveBeenCalledWith(ORDER_STATUS.CANCELLED)
  })

  // ─── Empty state ──────────────────────────────────────────────────────────

  it('renders empty state when no orders exist for the active tab', () => {
    mockUseOrders.mockReturnValue(makeEmptyResult())
    const { getByText } = render(<OrdersScreen />)
    expect(getByText('Không có đơn hàng nào')).toBeTruthy()
  })

  // ─── Loading state ────────────────────────────────────────────────────────

  it('renders skeleton loader while loading', () => {
    mockUseOrders.mockReturnValue(makeLoadingResult())
    const { getByTestId } = render(<OrdersScreen />)
    expect(getByTestId('order-skeleton')).toBeTruthy()
  })
})
