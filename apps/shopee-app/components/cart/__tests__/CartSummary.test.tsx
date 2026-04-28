import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import CartSummary from '../CartSummary'

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({ primary: '#EE4D2D' }),
}))

jest.mock('@/utils/price', () => ({
  formatPrice: (v: number) => `₫${v.toLocaleString()}`,
}))

describe('CartSummary', () => {
  it('renders the formatted total amount', () => {
    const { getByText } = render(
      <CartSummary
        totalSelected={2}
        totalAmount={350000}
        allSelected={false}
        onToggleAll={jest.fn()}
        onCheckout={jest.fn()}
      />
    )
    expect(getByText('₫350,000')).toBeTruthy()
  })

  it('calls onCheckout when checkout button is pressed', () => {
    const onCheckout = jest.fn()
    const { getByText } = render(
      <CartSummary
        totalSelected={2}
        totalAmount={350000}
        allSelected={false}
        onToggleAll={jest.fn()}
        onCheckout={onCheckout}
      />
    )
    fireEvent.press(getByText('Checkout'))
    expect(onCheckout).toHaveBeenCalledTimes(1)
  })

  it('disables checkout button when no items are selected', () => {
    const onCheckout = jest.fn()
    const { getByText } = render(
      <CartSummary
        totalSelected={0}
        totalAmount={0}
        allSelected={false}
        onToggleAll={jest.fn()}
        onCheckout={onCheckout}
      />
    )
    fireEvent.press(getByText('Checkout'))
    expect(onCheckout).not.toHaveBeenCalled()
  })
})
