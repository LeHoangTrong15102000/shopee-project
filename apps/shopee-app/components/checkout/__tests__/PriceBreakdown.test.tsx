import React from 'react'
import { render } from '@testing-library/react-native'
import PriceBreakdown from '../PriceBreakdown'

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    success: '#4CAF50',
    neutrals900: '#e0e0e0',
  }),
}))

jest.mock('@/utils/price', () => ({
  formatPrice: (v: number) => `₫${v.toLocaleString()}`,
}))

describe('PriceBreakdown', () => {
  it('renders subtotal, shipping fee, and total', () => {
    const { getByText } = render(
      <PriceBreakdown subtotal={200000} shippingFee={30000} total={230000} />
    )
    expect(getByText('₫200,000')).toBeTruthy()
    expect(getByText('₫30,000')).toBeTruthy()
    expect(getByText('₫230,000')).toBeTruthy()
  })

  it('renders voucher discount when provided', () => {
    const { getByText } = render(
      <PriceBreakdown
        subtotal={200000}
        shippingFee={30000}
        voucherDiscount={20000}
        total={210000}
      />
    )
    expect(getByText('-₫20,000')).toBeTruthy()
  })

  it('renders coin discount when provided', () => {
    const { getByText } = render(
      <PriceBreakdown subtotal={200000} shippingFee={30000} coinDiscount={10000} total={220000} />
    )
    expect(getByText('-₫10,000')).toBeTruthy()
  })

  it('does not render discount rows when discounts are zero', () => {
    const { queryByText } = render(
      <PriceBreakdown
        subtotal={200000}
        shippingFee={30000}
        voucherDiscount={0}
        coinDiscount={0}
        total={230000}
      />
    )
    expect(queryByText(/-₫/)).toBeNull()
  })
})
