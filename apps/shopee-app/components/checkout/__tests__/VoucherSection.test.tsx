import React from 'react'
import { render } from '@testing-library/react-native'
import VoucherSection from '../VoucherSection'

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    primary: '#EE4D2D',
    neutrals900: '#e0e0e0',
    neutrals600: '#757575',
    error: '#F44336',
    success: '#4CAF50',
  }),
}))

jest.mock('@/utils/price', () => ({
  formatPrice: (v: number) => `₫${v.toLocaleString()}`,
}))

describe('VoucherSection', () => {
  it('renders apply button when no voucher is applied', () => {
    const { getByText } = render(<VoucherSection onApplyVoucher={jest.fn()} />)
    expect(getByText('Apply')).toBeTruthy()
  })

  it('shows applied discount message when voucher is applied', () => {
    const { getByText, getByDisplayValue } = render(
      <VoucherSection appliedVoucher="SAVE10" appliedDiscount={50000} onApplyVoucher={jest.fn()} />
    )
    expect(getByText(/₫50,000/)).toBeTruthy()
    expect(getByDisplayValue('SAVE10')).toBeTruthy()
  })

  it('shows error message when errorMessage is provided', () => {
    const { getByText } = render(
      <VoucherSection onApplyVoucher={jest.fn()} errorMessage="Invalid voucher code" />
    )
    expect(getByText('Invalid voucher code')).toBeTruthy()
  })
})
