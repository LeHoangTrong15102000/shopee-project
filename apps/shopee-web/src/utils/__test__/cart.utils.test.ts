import { describe, it, expect } from 'vitest'
import { getProductQuantityInCart } from '../cart.utils'
import { ExtendedPurchase } from 'src/types/purchases.type'
import { Product } from 'src/types/product.type'

const createMockProduct = (overrides: Partial<Product> = {}): Product =>
  ({
    _id: 'product-1',
    name: 'Test Product',
    price: 100000,
    price_before_discount: 120000,
    quantity: 50,
    sold: 10,
    view: 100,
    rating: 4.5,
    category: { _id: 'cat-1', name: 'Category' },
    image: 'https://example.com/image.jpg',
    images: ['https://example.com/image.jpg'],
    description: 'Test product description',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }) as Product

const createMockCartItem = (
  productId: string,
  buyCount: number,
  skuId?: string,
): ExtendedPurchase => ({
  _id: `purchase-${productId}-${skuId ?? 'no-sku'}`,
  buy_count: buyCount,
  price: 100000,
  price_before_discount: 120000,
  status: -1,
  user: 'user-1',
  product: createMockProduct({ _id: productId }),
  ...(skuId ? { sku: { _id: skuId } } : {}),
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  disabled: false,
  isChecked: false,
})

describe('getProductQuantityInCart', () => {
  it('returns 0 for an empty cart', () => {
    expect(getProductQuantityInCart('product-1', [])).toBe(0)
  })

  it('returns 0 when the product is not in the cart', () => {
    const cartItems = [createMockCartItem('product-2', 3), createMockCartItem('product-3', 1)]
    expect(getProductQuantityInCart('product-1', cartItems)).toBe(0)
  })

  it('returns the buy_count when the product is in the cart', () => {
    const cartItems = [createMockCartItem('product-1', 5), createMockCartItem('product-2', 2)]
    expect(getProductQuantityInCart('product-1', cartItems)).toBe(5)
  })

  it('returns correct quantity when product is the only item in cart', () => {
    const cartItems = [createMockCartItem('product-1', 10)]
    expect(getProductQuantityInCart('product-1', cartItems)).toBe(10)
  })

  it('returns correct quantity from a cart with many items', () => {
    const cartItems = [
      createMockCartItem('product-a', 1),
      createMockCartItem('product-b', 2),
      createMockCartItem('product-c', 7),
      createMockCartItem('product-d', 4),
    ]
    expect(getProductQuantityInCart('product-c', cartItems)).toBe(7)
  })

  it('handles buy_count of 0', () => {
    const cartItems = [createMockCartItem('product-1', 0)]
    expect(getProductQuantityInCart('product-1', cartItems)).toBe(0)
  })

  describe('sku-aware matching', () => {
    it('returns the quantity for a specific sku line when skuId is provided', () => {
      const cartItems = [
        createMockCartItem('product-1', 2, 'sku-red'),
        createMockCartItem('product-1', 5, 'sku-blue'),
      ]
      expect(getProductQuantityInCart('product-1', cartItems, 'sku-red')).toBe(2)
      expect(getProductQuantityInCart('product-1', cartItems, 'sku-blue')).toBe(5)
    })

    it('counts the same product with different skus as separate lines', () => {
      const cartItems = [
        createMockCartItem('product-1', 2, 'sku-red'),
        createMockCartItem('product-1', 3, 'sku-blue'),
      ]
      // Each variant line is independent — not summed together.
      expect(getProductQuantityInCart('product-1', cartItems, 'sku-red')).toBe(2)
      expect(getProductQuantityInCart('product-1', cartItems, 'sku-blue')).toBe(3)
    })

    it('returns 0 when the requested sku is not in the cart', () => {
      const cartItems = [createMockCartItem('product-1', 2, 'sku-red')]
      expect(getProductQuantityInCart('product-1', cartItems, 'sku-green')).toBe(0)
    })

    it('matches a null-sku line when skuId is explicitly null', () => {
      const cartItems = [
        createMockCartItem('product-1', 4),
        createMockCartItem('product-1', 7, 'sku-blue'),
      ]
      expect(getProductQuantityInCart('product-1', cartItems, null)).toBe(4)
    })

    it('does not match a sku line when skuId is null', () => {
      const cartItems = [createMockCartItem('product-1', 7, 'sku-blue')]
      expect(getProductQuantityInCart('product-1', cartItems, null)).toBe(0)
    })

    it('falls back to product-only match when skuId is undefined', () => {
      const cartItems = [createMockCartItem('product-1', 6, 'sku-red')]
      // undefined skuId → first matching product line regardless of sku.
      expect(getProductQuantityInCart('product-1', cartItems)).toBe(6)
    })
  })
})
