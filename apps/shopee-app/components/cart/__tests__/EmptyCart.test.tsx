import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import EmptyCart from '../EmptyCart'

describe('EmptyCart', () => {
  it('renders the shop now call-to-action', () => {
    const { getByText } = render(<EmptyCart onShopNow={jest.fn()} />)
    expect(getByText('Shop Now')).toBeTruthy()
  })

  it('calls onShopNow when the action button is pressed', () => {
    const onShopNow = jest.fn()
    const { getByText } = render(<EmptyCart onShopNow={onShopNow} />)
    fireEvent.press(getByText('Shop Now'))
    expect(onShopNow).toHaveBeenCalledTimes(1)
  })
})
