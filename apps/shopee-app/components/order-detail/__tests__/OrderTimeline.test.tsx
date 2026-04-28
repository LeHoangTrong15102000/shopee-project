import React from 'react'
import { render } from '@testing-library/react-native'
import OrderTimeline from '../OrderTimeline'
import { ORDER_STATUS } from '@/constants/order'

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    primary: '#EE4D2D',
    error: '#F44336',
    warning: '#FF9800',
    foreground: '#1a1a1a',
    neutrals400: '#9e9e9e',
    neutrals800: '#424242',
  }),
}))

describe('OrderTimeline', () => {
  it('renders placed step for PENDING status', () => {
    const { getByText } = render(<OrderTimeline status={ORDER_STATUS.PENDING} />)
    expect(getByText('Order Placed')).toBeTruthy()
  })

  it('renders confirmed step for CONFIRMED status', () => {
    const { getByText } = render(<OrderTimeline status={ORDER_STATUS.CONFIRMED} />)
    expect(getByText('Confirmed')).toBeTruthy()
  })

  it('renders processing step for PROCESSING status', () => {
    const { getByText } = render(<OrderTimeline status={ORDER_STATUS.PROCESSING} />)
    expect(getByText('Processing')).toBeTruthy()
  })

  it('renders shipping step for SHIPPING status', () => {
    const { getByText } = render(<OrderTimeline status={ORDER_STATUS.SHIPPING} />)
    expect(getByText('Shipping')).toBeTruthy()
  })

  it('renders delivered step for DELIVERED status', () => {
    const { getByText } = render(<OrderTimeline status={ORDER_STATUS.DELIVERED} />)
    expect(getByText('Delivered')).toBeTruthy()
  })

  it('renders cancelled step for CANCELLED status', () => {
    const { getByText } = render(<OrderTimeline status={ORDER_STATUS.CANCELLED} />)
    expect(getByText('Cancelled')).toBeTruthy()
  })

  it('renders returned step for RETURNED status', () => {
    const { getByText } = render(<OrderTimeline status={ORDER_STATUS.RETURNED} />)
    expect(getByText('Returned')).toBeTruthy()
  })
})
