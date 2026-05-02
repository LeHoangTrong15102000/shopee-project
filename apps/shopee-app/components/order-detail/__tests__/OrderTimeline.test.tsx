import React from 'react'
import { render } from '@testing-library/react-native'
import OrderTimeline from '@/components/orders/OrderTimeline'
import { ORDER_STATUS } from '@/constants/order'

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'orderTimeline.step.placed': 'Order Placed',
        'orderTimeline.step.confirmed': 'Confirmed',
        'orderTimeline.step.processing': 'Processing',
        'orderTimeline.step.shipping': 'Shipping',
        'orderTimeline.step.delivered': 'Delivered',
        'orderTimeline.step.cancelled': 'Cancelled',
        'orderTimeline.step.returned': 'Returned',
      }
      return map[key] ?? key
    },
  }),
}))

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    primary: '#EE4D2D',
    primaryForeground: '#FFFFFF',
    error: '#F44336',
    warning: '#FF9800',
    foreground: '#1a1a1a',
    neutrals400: '#9e9e9e',
    neutrals800: '#424242',
  }),
}))

jest.mock('@/store/appStore', () => ({
  useAppStore: (selector: (s: { language: string }) => string) =>
    selector({ language: 'en' }),
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
