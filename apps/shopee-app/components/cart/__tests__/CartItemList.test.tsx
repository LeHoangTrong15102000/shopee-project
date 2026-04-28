import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import CartItemList from '../CartItemList'
import type { CartItem } from '@/apis/cart.api'

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({ primary: '#EE4D2D' }),
}))

// Mock CartItem to a simple pressable that calls onDelete
jest.mock('../CartItem', () => {
  const React = require('react')
  const { Text, TouchableOpacity } = require('react-native')
  function MockCartItem({
    item,
    onDelete,
  }: {
    item: CartItem
    onDelete: (id: string) => void
  }) {
    return (
      <TouchableOpacity onPress={() => onDelete(item._id)}>
        <Text>{item.product.name}</Text>
      </TouchableOpacity>
    )
  }
  MockCartItem.displayName = 'CartItem'
  return { __esModule: true, default: MockCartItem }
})

function makeItem(id: string, name: string): CartItem {
  return {
    _id: id,
    product: {
      _id: `prod-${id}`,
      name,
      image: 'https://example.com/img.jpg',
      price: 100000,
      price_before_discount: 120000,
      quantity: 10,
    },
    buy_count: 1,
    price: 100000,
    price_before_discount: 120000,
  }
}

describe('CartItemList', () => {
  it('renders both item names when given two items', () => {
    const items = [makeItem('1', 'Item One'), makeItem('2', 'Item Two')]
    const { getByText } = render(
      <CartItemList
        items={items}
        selectedIds={new Set()}
        onToggleSelect={jest.fn()}
        onQuantityChange={jest.fn()}
        onRemove={jest.fn()}
      />
    )
    expect(getByText('Item One')).toBeTruthy()
    expect(getByText('Item Two')).toBeTruthy()
  })

  it('calls onRemove with the item id when remove is triggered', () => {
    const onRemove = jest.fn()
    const items = [makeItem('1', 'Item One'), makeItem('2', 'Item Two')]
    const { getByText } = render(
      <CartItemList
        items={items}
        selectedIds={new Set()}
        onToggleSelect={jest.fn()}
        onQuantityChange={jest.fn()}
        onRemove={onRemove}
      />
    )
    fireEvent.press(getByText('Item One'))
    expect(onRemove).toHaveBeenCalledWith('1')
  })
})
