import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWishlist } from '../useWishlist'
import React from 'react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('src/apis/product.api', () => ({
  default: {
    getProducts: vi.fn(() =>
      Promise.resolve({
        data: {
          data: {
            products: [
              {
                _id: '1',
                name: 'Product 1',
                price: 100,
                price_before_discount: 150,
                sold: 2500,
                rating: 4.5,
                quantity: 10,
                category: { name: 'Electronics' },
              },
              {
                _id: '2',
                name: 'Product 2',
                price: 200,
                price_before_discount: 200,
                sold: 1000,
                rating: 4.0,
                quantity: 5,
                category: { name: 'Fashion' },
              },
            ],
          },
        },
      }),
    ),
  },
}))

vi.mock('src/apis/wishlist.api', () => ({
  default: {
    getWishlist: vi.fn(() => Promise.resolve({ data: { data: { wishlist: [] } } })),
    removeFromWishlist: vi.fn(() => Promise.resolve()),
  },
}))

vi.mock('src/apis/purchases.api', () => ({
  default: {
    addToCart: vi.fn(() => Promise.resolve()),
  },
}))

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
  },
}))

describe('useWishlist', () => {
  let queryClient: QueryClient

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    vi.clearAllMocks()
  })

  it('should return wishlist items', async () => {
    const { result } = renderHook(() => useWishlist('all', 'recent'), { wrapper })

    await waitFor(() => {
      expect(result.current.allWishlistItems.length).toBeGreaterThan(0)
    })
  })

  it('should filter by sale', async () => {
    const { result } = renderHook(() => useWishlist('sale', 'recent'), { wrapper })

    await waitFor(() => {
      const items = result.current.wishlistItems
      items.forEach((item) => {
        expect(item.product.price_before_discount).toBeGreaterThan(item.product.price)
      })
    })
  })

  it('should filter by bestseller', async () => {
    const { result } = renderHook(() => useWishlist('bestseller', 'recent'), { wrapper })

    await waitFor(() => {
      const items = result.current.wishlistItems
      items.forEach((item) => {
        expect(item.product.sold).toBeGreaterThanOrEqual(2000)
      })
    })
  })

  it('should filter by lowprice', async () => {
    const { result } = renderHook(() => useWishlist('lowprice', 'recent'), { wrapper })

    await waitFor(() => {
      const items = result.current.wishlistItems
      items.forEach((item) => {
        expect(item.product.price).toBeLessThan(300000)
      })
    })
  })

  it('should filter by highrating', async () => {
    const { result } = renderHook(() => useWishlist('highrating', 'recent'), { wrapper })

    await waitFor(() => {
      const items = result.current.wishlistItems
      items.forEach((item) => {
        expect(item.product.rating).toBeGreaterThanOrEqual(4.5)
      })
    })
  })

  it('should sort by price ascending', async () => {
    const { result } = renderHook(() => useWishlist('all', 'price-asc'), { wrapper })

    await waitFor(() => {
      const items = result.current.wishlistItems
      for (let i = 1; i < items.length; i++) {
        expect(items[i].product.price).toBeGreaterThanOrEqual(items[i - 1].product.price)
      }
    })
  })

  it('should sort by price descending', async () => {
    const { result } = renderHook(() => useWishlist('all', 'price-desc'), { wrapper })

    await waitFor(() => {
      const items = result.current.wishlistItems
      for (let i = 1; i < items.length; i++) {
        expect(items[i].product.price).toBeLessThanOrEqual(items[i - 1].product.price)
      }
    })
  })

  it('should calculate total value', async () => {
    const { result } = renderHook(() => useWishlist('all', 'recent'), { wrapper })

    await waitFor(() => {
      expect(result.current.totalValue).toBeGreaterThan(0)
    })
  })

  it('should calculate total savings', async () => {
    const { result } = renderHook(() => useWishlist('all', 'recent'), { wrapper })

    await waitFor(() => {
      expect(result.current.totalSavings).toBeGreaterThanOrEqual(0)
    })
  })

  it('should provide insights', async () => {
    const { result } = renderHook(() => useWishlist('all', 'recent'), { wrapper })

    await waitFor(() => {
      expect(result.current.insights).toBeDefined()
      if (result.current.insights) {
        expect(result.current.insights.topCategory).toBeDefined()
        expect(result.current.insights.avgDiscount).toBeGreaterThanOrEqual(0)
      }
    })
  })

  it('should check if recently added', () => {
    const { result } = renderHook(() => useWishlist('all', 'recent'), { wrapper })

    const recentDate = new Date().toISOString()
    const oldDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()

    expect(result.current.isRecentlyAdded(recentDate)).toBe(true)
    expect(result.current.isRecentlyAdded(oldDate)).toBe(false)
  })

  it('should check if trending', () => {
    const { result } = renderHook(() => useWishlist('all', 'recent'), { wrapper })

    const trendingProduct = { sold: 3500, rating: 4.8 } as any
    const notTrendingProduct = { sold: 1000, rating: 4.0 } as any

    expect(result.current.isTrending(trendingProduct)).toBe(true)
    expect(result.current.isTrending(notTrendingProduct)).toBe(false)
  })

  it('should get stock status', () => {
    const { result } = renderHook(() => useWishlist('all', 'recent'), { wrapper })

    const outOfStock = { quantity: 0 } as any
    const lowStock = { quantity: 10 } as any
    const inStock = { quantity: 100 } as any

    expect(result.current.getStockStatus(outOfStock)?.label).toBe('stock.outOfStock')
    expect(result.current.getStockStatus(lowStock)?.label).toBe('stock.runningLow')
    expect(result.current.getStockStatus(inStock)).toBeNull()
  })

  it('should sort by discount', async () => {
    const { result } = renderHook(() => useWishlist('all', 'discount'), { wrapper })

    await waitFor(() => {
      const items = result.current.wishlistItems
      for (let i = 1; i < items.length; i++) {
        const dA = items[i - 1].product.price_before_discount - items[i - 1].product.price
        const dB = items[i].product.price_before_discount - items[i].product.price
        expect(dA).toBeGreaterThanOrEqual(dB)
      }
    })
  })

  it('should sort by bestseller', async () => {
    const { result } = renderHook(() => useWishlist('all', 'bestseller'), { wrapper })

    await waitFor(() => {
      const items = result.current.wishlistItems
      for (let i = 1; i < items.length; i++) {
        expect(items[i - 1].product.sold).toBeGreaterThanOrEqual(items[i].product.sold)
      }
    })
  })

  it('should filter by new (recently added)', async () => {
    const { result } = renderHook(() => useWishlist('new', 'recent'), { wrapper })

    await waitFor(() => {
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000
      const items = result.current.wishlistItems
      items.forEach((item) => {
        expect(new Date(item.addedAt).getTime()).toBeGreaterThan(threeDaysAgo)
      })
    })
  })

  it('should calculate discount percent', () => {
    const { result } = renderHook(() => useWishlist('all', 'recent'), { wrapper })

    const discountedProduct = { price: 80, price_before_discount: 100 } as any
    const noDiscountProduct = { price: 100, price_before_discount: 100 } as any

    expect(result.current.getDiscountPercent(discountedProduct)).toBe(20)
    expect(result.current.getDiscountPercent(noDiscountProduct)).toBe(0)
  })
})
