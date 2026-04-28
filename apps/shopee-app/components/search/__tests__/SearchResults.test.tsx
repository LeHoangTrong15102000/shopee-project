import React from 'react'
import { render } from '@testing-library/react-native'
import SearchResults from '../SearchResults'
import type { Product } from '@/types/product.type'

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({ primary: '#EE4D2D' }),
}))

jest.mock('@/components/home/ProductCard', () => {
  const React = require('react')
  const { Text } = require('react-native')
  function MockProductCard({ product }: { product: Product }) {
    return <Text>{product.name}</Text>
  }
  MockProductCard.displayName = 'ProductCard'
  return { __esModule: true, default: MockProductCard, CARD_GAP: 8 }
})

function makeProduct(id: string, name: string): Product {
  return {
    _id: id,
    name,
    images: [],
    image: 'https://example.com/img.jpg',
    price: 100000,
    price_before_discount: 120000,
    quantity: 10,
    sold: 5,
    view: 100,
    rating: 4.5,
    category: { _id: 'cat-1', name: 'Electronics' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('SearchResults', () => {
  it('renders both product names when given two products', () => {
    const products = [makeProduct('1', 'Product Alpha'), makeProduct('2', 'Product Beta')]
    const { getByText } = render(<SearchResults products={products} />)
    expect(getByText('Product Alpha')).toBeTruthy()
    expect(getByText('Product Beta')).toBeTruthy()
  })

  it('renders empty state when products list is empty', () => {
    const { getByText } = render(<SearchResults products={[]} />)
    expect(getByText('No products found')).toBeTruthy()
  })
})
