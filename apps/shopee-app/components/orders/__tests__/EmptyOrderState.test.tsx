import React from 'react'
import { render } from '@testing-library/react-native'
import EmptyOrderState from '../EmptyOrderState'

describe('EmptyOrderState', () => {
  it('renders the default empty orders message', () => {
    const { getByText } = render(<EmptyOrderState />)
    expect(getByText('No orders yet')).toBeTruthy()
  })

  it('renders a custom message when provided', () => {
    const { getByText } = render(<EmptyOrderState message="No pending orders" />)
    expect(getByText('No pending orders')).toBeTruthy()
  })

  it('renders the all tab empty message', () => {
    const { getByText } = render(<EmptyOrderState message="No orders yet" />)
    expect(getByText('No orders yet')).toBeTruthy()
  })

  it('renders the pending tab empty message', () => {
    const { getByText } = render(<EmptyOrderState message="No pending orders" />)
    expect(getByText('No pending orders')).toBeTruthy()
  })

  it('renders the shipping tab empty message', () => {
    const { getByText } = render(<EmptyOrderState message="No orders being shipped" />)
    expect(getByText('No orders being shipped')).toBeTruthy()
  })

  it('renders the delivered tab empty message', () => {
    const { getByText } = render(<EmptyOrderState message="No delivered orders" />)
    expect(getByText('No delivered orders')).toBeTruthy()
  })

  it('renders the cancelled tab empty message', () => {
    const { getByText } = render(<EmptyOrderState message="No cancelled orders" />)
    expect(getByText('No cancelled orders')).toBeTruthy()
  })
})
