import React from 'react'
import { render } from '@testing-library/react-native'
import OrderDetailHeader from '../OrderDetailHeader'
import { ORDER_STATUS } from '@/constants/order'

describe('OrderDetailHeader', () => {
  it('renders order id snippet in uppercase', () => {
    const { getByText } = render(
      <OrderDetailHeader orderId="abcdef12345678" status={ORDER_STATUS.PENDING} />
    )
    expect(getByText(/12345678/i)).toBeTruthy()
  })

  it('renders warning badge for PENDING status', () => {
    const { getByText } = render(
      <OrderDetailHeader orderId="order-1" status={ORDER_STATUS.PENDING} />
    )
    expect(getByText('Pending')).toBeTruthy()
  })

  it('renders primary badge for CONFIRMED status', () => {
    const { getByText } = render(
      <OrderDetailHeader orderId="order-1" status={ORDER_STATUS.CONFIRMED} />
    )
    expect(getByText('Confirmed')).toBeTruthy()
  })

  it('renders default badge for PROCESSING status', () => {
    const { getByText } = render(
      <OrderDetailHeader orderId="order-1" status={ORDER_STATUS.PROCESSING} />
    )
    expect(getByText('Processing')).toBeTruthy()
  })

  it('renders primary badge for SHIPPING status', () => {
    const { getByText } = render(
      <OrderDetailHeader orderId="order-1" status={ORDER_STATUS.SHIPPING} />
    )
    expect(getByText('Shipping')).toBeTruthy()
  })

  it('renders success badge for DELIVERED status', () => {
    const { getByText } = render(
      <OrderDetailHeader orderId="order-1" status={ORDER_STATUS.DELIVERED} />
    )
    expect(getByText('Delivered')).toBeTruthy()
  })

  it('renders error badge for CANCELLED status', () => {
    const { getByText } = render(
      <OrderDetailHeader orderId="order-1" status={ORDER_STATUS.CANCELLED} />
    )
    expect(getByText('Cancelled')).toBeTruthy()
  })

  it('renders default badge for RETURNED status', () => {
    const { getByText } = render(
      <OrderDetailHeader orderId="order-1" status={ORDER_STATUS.RETURNED} />
    )
    expect(getByText('Returned')).toBeTruthy()
  })
})
