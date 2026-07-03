import React from 'react'
import { render } from '@testing-library/react-native'
import CheckoutSummary from '../CheckoutSummary'
import type { CartItem } from '@/apis/cart.api'

jest.mock('@/utils/price', () => ({
  formatPrice: (v: number) => `₫${v.toLocaleString()}`,
}))

function makeItem(id: string, name: string, price: number, count: number): CartItem {
  return {
    _id: id,
    product: {
      _id: `prod-${id}`,
      name,
      image: 'https://example.com/img.jpg',
      price,
      price_before_discount: price,
      quantity: 10,
    },
    buy_count: count,
    price,
    price_before_discount: price,
    status: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }
}

describe('CheckoutSummary', () => {
  it('renders both item names when given two items', () => {
    const items = [
      makeItem('1', 'Product Alpha', 100000, 1),
      makeItem('2', 'Product Beta', 200000, 2),
    ]
    const { getByText } = render(<CheckoutSummary items={items} />)
    expect(getByText('Product Alpha')).toBeTruthy()
    expect(getByText('Product Beta')).toBeTruthy()
  })

  it('renders quantities for each item', () => {
    const items = [makeItem('1', 'Product Alpha', 100000, 3)]
    const { getByText } = render(<CheckoutSummary items={items} />)
    expect(getByText('x3')).toBeTruthy()
  })

  it('renders nothing when items list is empty', () => {
    const { toJSON } = render(<CheckoutSummary items={[]} />)
    expect(toJSON()).toBeNull()
  })
})
