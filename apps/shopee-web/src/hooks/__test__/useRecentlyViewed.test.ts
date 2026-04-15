import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRecentlyViewed } from '../useRecentlyViewed'
import type { Product } from 'src/types/product.type'

describe('useRecentlyViewed', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const mockProduct: Product = {
    _id: 'prod-1',
    name: 'Test Product',
    image: 'https://example.com/img.jpg',
    images: [],
    price: 250000,
    price_before_discount: 350000,
    rating: 4.5,
    sold: 100,
    view: 500,
    quantity: 50,
    category: { _id: 'cat-1', name: 'Test' },
    description: 'Test product',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    location: 'Hồ Chí Minh',
  }

  it('starts with empty list', () => {
    const { result } = renderHook(() => useRecentlyViewed())
    expect(result.current.recentlyViewed).toHaveLength(0)
  })

  it('adds a product to recently viewed', () => {
    const { result } = renderHook(() => useRecentlyViewed())

    act(() => {
      result.current.addProduct(mockProduct)
    })

    expect(result.current.recentlyViewed).toHaveLength(1)
    expect(result.current.recentlyViewed[0]._id).toBe('prod-1')
    expect(result.current.recentlyViewed[0].name).toBe('Test Product')
  })

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useRecentlyViewed())

    act(() => {
      result.current.addProduct(mockProduct)
    })

    const stored = localStorage.getItem('recently_viewed_products')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!)
    expect(parsed).toHaveLength(1)
    expect(parsed[0]._id).toBe('prod-1')
  })

  it('removes duplicate when adding same product', () => {
    const { result } = renderHook(() => useRecentlyViewed())

    act(() => {
      result.current.addProduct(mockProduct)
      result.current.addProduct(mockProduct)
    })

    expect(result.current.recentlyViewed).toHaveLength(1)
  })

  it('limits list to MAX_ITEMS (20)', () => {
    const { result } = renderHook(() => useRecentlyViewed())

    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.addProduct({ ...mockProduct, _id: `prod-${i}` })
      }
    })

    expect(result.current.recentlyViewed.length).toBe(20)
  })

  it('clears all products', () => {
    const { result } = renderHook(() => useRecentlyViewed())

    act(() => {
      result.current.addProduct(mockProduct)
    })

    expect(result.current.recentlyViewed).toHaveLength(1)

    act(() => {
      result.current.clearAll()
    })

    expect(result.current.recentlyViewed).toHaveLength(0)
    expect(localStorage.getItem('recently_viewed_products')).toBeNull()
  })
})
