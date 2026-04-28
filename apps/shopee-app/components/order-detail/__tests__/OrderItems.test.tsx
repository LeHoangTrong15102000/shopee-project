import React from 'react'
import { render } from '@testing-library/react-native'
import OrderItems from '../OrderItems'
import type { OrderItem } from '@/apis/order.api'

jest.mock('@/utils/price', () => ({
  formatPrice: (v: number) => `₫${v.toLocaleString()}`,
}))

function makeItem(id: string, name: string, price: number, count: number): OrderItem {
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
  }
}

describe('OrderItems', () => {
  it('renders both item names when given two items', () => {
    const items = [makeItem('1', 'Widget A', 100000, 1), makeItem('2', 'Widget B', 200000, 2)]
    const { getByText } = render(<OrderItems items={items} />)
    expect(getByText('Widget A')).toBeTruthy()
    expect(getByText('Widget B')).toBeTruthy()
  })

  it('renders quantity for each item', () => {
    const items = [makeItem('1', 'Widget A', 100000, 3)]
    const { getByText } = render(<OrderItems items={items} />)
    expect(getByText('x3')).toBeTruthy()
  })

  it('renders formatted price for each item', () => {
    const items = [makeItem('1', 'Widget A', 100000, 2)]
    const { getByText } = render(<OrderItems items={items} />)
    expect(getByText('₫200,000')).toBeTruthy()
  })
})
