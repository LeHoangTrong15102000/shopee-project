import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { getDiscountPercent, getBestValues, BestBadge } from '../comparisonTable.constants'
import { Product } from 'src/types/product.type'

const makeProduct = (overrides: Partial<Product> = {}): Product =>
  ({
    _id: '1',
    name: 'Test Product',
    price: 100000,
    price_before_discount: 150000,
    rating: 4.5,
    sold: 100,
    quantity: 50,
    images: [],
    image: '',
    description: '',
    category: { _id: 'cat1', name: 'Category' },
    view: 0,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  }) as Product

describe('getDiscountPercent', () => {
  it('returns discount percentage', () => {
    const product = makeProduct({ price: 100000, price_before_discount: 200000 })
    expect(getDiscountPercent(product)).toBe(50)
  })

  it('returns 0 when no discount', () => {
    const product = makeProduct({ price: 100000, price_before_discount: 100000 })
    expect(getDiscountPercent(product)).toBe(0)
  })

  it('returns 0 when price_before_discount is less than price', () => {
    const product = makeProduct({ price: 200000, price_before_discount: 100000 })
    expect(getDiscountPercent(product)).toBe(0)
  })
})

describe('getBestValues', () => {
  it('returns null for less than 2 products', () => {
    expect(getBestValues([makeProduct()])).toBeNull()
    expect(getBestValues([])).toBeNull()
  })

  it('returns best values for 2+ products', () => {
    const products = [
      makeProduct({
        _id: '1',
        price: 100000,
        rating: 4.5,
        sold: 200,
        quantity: 50,
        price_before_discount: 200000,
      }),
      makeProduct({
        _id: '2',
        price: 200000,
        rating: 3.5,
        sold: 100,
        quantity: 30,
        price_before_discount: 200000,
      }),
    ]
    const result = getBestValues(products)
    expect(result).not.toBeNull()
    expect(result!.bestPrice).toBe(100000)
    expect(result!.bestRating).toBe(4.5)
    expect(result!.bestSold).toBe(200)
    expect(result!.bestStock).toBe(50)
    expect(result!.recommendedProductId).toBeDefined()
  })

  it('handles products with zero prices', () => {
    const products = [
      makeProduct({ _id: '1', price: 0, rating: 4, sold: 0, quantity: 10 }),
      makeProduct({ _id: '2', price: 0, rating: 3, sold: 0, quantity: 5 }),
    ]
    const result = getBestValues(products)
    expect(result).not.toBeNull()
    expect(result!.bestPrice).toBe(0)
  })
})

describe('BestBadge', () => {
  it('renders with animation', () => {
    render(<BestBadge label="Best Price" reduceMotion={false} />)
    expect(screen.getByText(/Best Price/)).toBeInTheDocument()
  })

  it('renders without animation when reduceMotion is true', () => {
    render(<BestBadge label="Best Rating" reduceMotion={true} />)
    expect(screen.getByText(/Best Rating/)).toBeInTheDocument()
  })
})
