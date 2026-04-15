import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWishlist } from 'src/pages/Wishlist/useWishlist'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('react-toastify', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const mockProducts = [
  {
    _id: 'p1',
    name: 'Product 1',
    price: 100000,
    price_before_discount: 200000,
    sold: 5000,
    rating: 4.8,
    quantity: 50,
    image: 'img1.jpg',
    category: { _id: 'c1', name: 'Electronics' },
  },
  {
    _id: 'p2',
    name: 'Product 2',
    price: 50000,
    price_before_discount: 50000,
    sold: 100,
    rating: 3.5,
    quantity: 0,
    image: 'img2.jpg',
    category: { _id: 'c2', name: 'Fashion' },
  },
  {
    _id: 'p3',
    name: 'Product 3',
    price: 250000,
    price_before_discount: 400000,
    sold: 3500,
    rating: 4.6,
    quantity: 10,
    image: 'img3.jpg',
    category: { _id: 'c1', name: 'Electronics' },
  },
  {
    _id: 'p4',
    name: 'Product 4',
    price: 500000,
    price_before_discount: 500000,
    sold: 2500,
    rating: 4.2,
    quantity: 100,
    image: 'img4.jpg',
    category: { _id: 'c3', name: 'Home' },
  },
]

let mockProductsResponse: any = { data: { data: { products: mockProducts } } }
let mockWishlistResponse: any = { data: { data: { wishlist: [] } } }

vi.mock('src/apis/product.api', () => ({
  default: { getProducts: vi.fn(() => Promise.resolve(mockProductsResponse)) },
}))

vi.mock('src/apis/wishlist.api', () => ({
  default: {
    getWishlist: vi.fn(() => Promise.resolve(mockWishlistResponse)),
    removeFromWishlist: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

vi.mock('src/apis/purchases.api', () => ({
  default: { addToCart: vi.fn(() => Promise.resolve({ data: {} })) },
}))

vi.mock('src/constant/purchase', () => ({
  purchasesStatus: { inCart: -1 },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useWishlist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProductsResponse = { data: { data: { products: mockProducts } } }
    mockWishlistResponse = { data: { data: { wishlist: [] } } }
  })

  it('returns helper functions', () => {
    const { result } = renderHook(() => useWishlist('all', 'default'), {
      wrapper: createWrapper(),
    })
    expect(result.current.isRecentlyAdded).toBeDefined()
    expect(result.current.isTrending).toBeDefined()
    expect(result.current.getStockStatus).toBeDefined()
    expect(result.current.getDiscountPercent).toBeDefined()
  })

  describe('isRecentlyAdded', () => {
    it('returns true for items added within 3 days', () => {
      const { result } = renderHook(() => useWishlist('all', 'default'), {
        wrapper: createWrapper(),
      })
      const recentDate = new Date(Date.now() - 1000 * 60 * 60).toISOString()
      expect(result.current.isRecentlyAdded(recentDate)).toBe(true)
    })

    it('returns false for items added more than 3 days ago', () => {
      const { result } = renderHook(() => useWishlist('all', 'default'), {
        wrapper: createWrapper(),
      })
      const oldDate = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      expect(result.current.isRecentlyAdded(oldDate)).toBe(false)
    })
  })

  describe('isTrending', () => {
    it('returns true for high sold + high rating', () => {
      const { result } = renderHook(() => useWishlist('all', 'default'), {
        wrapper: createWrapper(),
      })
      expect(result.current.isTrending(mockProducts[0] as any)).toBe(true)
    })

    it('returns false for low sold', () => {
      const { result } = renderHook(() => useWishlist('all', 'default'), {
        wrapper: createWrapper(),
      })
      expect(result.current.isTrending(mockProducts[1] as any)).toBe(false)
    })
  })

  describe('getStockStatus', () => {
    it('returns out of stock for quantity 0', () => {
      const { result } = renderHook(() => useWishlist('all', 'default'), {
        wrapper: createWrapper(),
      })
      const status = result.current.getStockStatus(mockProducts[1] as any)
      expect(status).toEqual({ label: 'stock.outOfStock', color: 'bg-red-500' })
    })

    it('returns running low for quantity <= 20', () => {
      const { result } = renderHook(() => useWishlist('all', 'default'), {
        wrapper: createWrapper(),
      })
      const status = result.current.getStockStatus(mockProducts[2] as any)
      expect(status).toEqual({ label: 'stock.runningLow', color: 'bg-amber-500' })
    })

    it('returns null for normal stock', () => {
      const { result } = renderHook(() => useWishlist('all', 'default'), {
        wrapper: createWrapper(),
      })
      expect(result.current.getStockStatus(mockProducts[0] as any)).toBeNull()
    })
  })

  describe('getDiscountPercent', () => {
    it('returns discount percentage for discounted product', () => {
      const { result } = renderHook(() => useWishlist('all', 'default'), {
        wrapper: createWrapper(),
      })
      expect(result.current.getDiscountPercent(mockProducts[0] as any)).toBe(50)
    })

    it('returns 0 for non-discounted product', () => {
      const { result } = renderHook(() => useWishlist('all', 'default'), {
        wrapper: createWrapper(),
      })
      expect(result.current.getDiscountPercent(mockProducts[1] as any)).toBe(0)
    })
  })
})
