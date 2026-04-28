import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import OrderCard from '../OrderCard'
import { ORDER_STATUS, type OrderStatusType } from '@/constants/order'
import type { Order } from '@/apis/order.api'

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    primary: '#EE4D2D',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    foreground: '#1a1a1a',
    neutrals400: '#6e6e6e',
  }),
}))

jest.mock('@/utils/price', () => ({
  formatPrice: (v: number) => `₫${v.toLocaleString()}`,
}))

function makeOrder(status: OrderStatusType): Order {
  return {
    _id: 'order-abc12345',
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
        buy_count: 2,
        price: 100000,
        price_before_discount: 150000,
      },
    ],
    total_price: 200000,
    address: '123 Test Street',
    payment_method: 'cod',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('OrderCard', () => {
  const mockOnPress = jest.fn()
  const mockOnCancel = jest.fn()
  const mockOnConfirmReceived = jest.fn()
  const mockOnReturn = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  function renderCard(status: OrderStatusType) {
    return render(
      <OrderCard
        order={makeOrder(status)}
        onPress={mockOnPress}
        onCancel={mockOnCancel}
        onConfirmReceived={mockOnConfirmReceived}
        onReturn={mockOnReturn}
      />
    )
  }

  // Badge labels for all 7 statuses (using English translations from en.json)

  it('renders Pending badge for PENDING', () => {
    const { getByText } = renderCard(ORDER_STATUS.PENDING)
    expect(getByText('Pending')).toBeTruthy()
  })

  it('renders Confirmed badge for CONFIRMED', () => {
    const { getByText } = renderCard(ORDER_STATUS.CONFIRMED)
    expect(getByText('Confirmed')).toBeTruthy()
  })

  it('renders Processing badge for PROCESSING', () => {
    const { getByText } = renderCard(ORDER_STATUS.PROCESSING)
    expect(getByText('Processing')).toBeTruthy()
  })

  it('renders Shipping badge for SHIPPING', () => {
    const { getByText } = renderCard(ORDER_STATUS.SHIPPING)
    expect(getByText('Shipping')).toBeTruthy()
  })

  it('renders Delivered badge for DELIVERED', () => {
    const { getByText } = renderCard(ORDER_STATUS.DELIVERED)
    expect(getByText('Delivered')).toBeTruthy()
  })

  it('renders Cancelled badge for CANCELLED', () => {
    const { getByText } = renderCard(ORDER_STATUS.CANCELLED)
    expect(getByText('Cancelled')).toBeTruthy()
  })

  it('renders Returned badge for RETURNED', () => {
    const { getByText } = renderCard(ORDER_STATUS.RETURNED)
    expect(getByText('Returned')).toBeTruthy()
  })

  // Action buttons: cancel visible for PENDING and CONFIRMED only

  it('shows cancel button for PENDING', () => {
    const { getByText } = renderCard(ORDER_STATUS.PENDING)
    expect(getByText('Cancel')).toBeTruthy()
  })

  it('shows cancel button for CONFIRMED', () => {
    const { getByText } = renderCard(ORDER_STATUS.CONFIRMED)
    expect(getByText('Cancel')).toBeTruthy()
  })

  it.each([
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.SHIPPING,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.RETURNED,
  ] as OrderStatusType[])('hides cancel button for %s', (status) => {
    const { queryByText } = renderCard(status)
    expect(queryByText('Cancel')).toBeNull()
  })

  // Action buttons: confirm-received visible for SHIPPING only

  it('shows confirm-received button for SHIPPING', () => {
    const { getByText } = renderCard(ORDER_STATUS.SHIPPING)
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
    const { queryByText } = renderCard(status)
    expect(queryByText('Confirm Receipt')).toBeNull()
  })

  // Action buttons: return visible for DELIVERED only

  it('shows return button for DELIVERED', () => {
    const { getByText } = renderCard(ORDER_STATUS.DELIVERED)
    expect(getByText('Return')).toBeTruthy()
  })

  // Button callbacks

  it('calls onCancel with order ID when cancel is pressed', () => {
    const { getByText } = renderCard(ORDER_STATUS.PENDING)
    fireEvent.press(getByText('Cancel'))
    expect(mockOnCancel).toHaveBeenCalledWith('order-abc12345')
  })

  it('calls onConfirmReceived with order ID when confirm is pressed', () => {
    const { getByText } = renderCard(ORDER_STATUS.SHIPPING)
    fireEvent.press(getByText('Confirm Receipt'))
    expect(mockOnConfirmReceived).toHaveBeenCalledWith('order-abc12345')
  })

  it('calls onReturn with order ID when return is pressed', () => {
    const { getByText } = renderCard(ORDER_STATUS.DELIVERED)
    fireEvent.press(getByText('Return'))
    expect(mockOnReturn).toHaveBeenCalledWith('order-abc12345')
  })

  // Product info rendering

  it('renders product name and total price', () => {
    const { getByText } = renderCard(ORDER_STATUS.PENDING)
    expect(getByText('Test Product')).toBeTruthy()
    expect(getByText('₫200,000')).toBeTruthy()
  })

  it('renders order ID snippet', () => {
    const { getByText } = renderCard(ORDER_STATUS.PENDING)
    expect(getByText('#ABC12345')).toBeTruthy()
  })
})
