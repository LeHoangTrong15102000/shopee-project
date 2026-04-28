import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import PaymentSection from '../PaymentSection'

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    primary: '#EE4D2D',
    neutrals900: '#e0e0e0',
    neutrals400: '#9e9e9e',
  }),
}))

const mockMethods = [
  { _id: 'cod', name: 'Cash on Delivery', description: 'Pay when delivered' },
  { _id: 'bank', name: 'Bank Transfer' },
]

describe('PaymentSection', () => {
  it('renders all payment method names', () => {
    const { getByText } = render(
      <PaymentSection
        selectedPaymentMethod="cod"
        onChangePayment={jest.fn()}
        methods={mockMethods}
      />
    )
    expect(getByText('Cash on Delivery')).toBeTruthy()
    expect(getByText('Bank Transfer')).toBeTruthy()
  })

  it('calls onChangePayment with method id when a method is pressed', () => {
    const onChangePayment = jest.fn()
    const { getByText } = render(
      <PaymentSection
        selectedPaymentMethod="cod"
        onChangePayment={onChangePayment}
        methods={mockMethods}
      />
    )
    fireEvent.press(getByText('Bank Transfer'))
    expect(onChangePayment).toHaveBeenCalledWith('bank')
  })

  it('renders description when provided', () => {
    const { getByText } = render(
      <PaymentSection
        selectedPaymentMethod="cod"
        onChangePayment={jest.fn()}
        methods={mockMethods}
      />
    )
    expect(getByText('Pay when delivered')).toBeTruthy()
  })
})
