/// <reference types="jest" />

const mockWishlistAggregate = jest.fn()

jest.mock('@database/models/wishlist.model', () => ({
  WishlistModel: {
    aggregate: mockWishlistAggregate,
  },
}))

jest.mock('@database/models/product.model', () => ({
  ProductModel: {},
}))

jest.mock('@utils/helper', () => ({
  HOST: 'http://localhost:4000',
}))

jest.mock('@constants/config', () => ({
  ROUTE_IMAGE: 'images',
}))

import { WishlistAnalyticsService } from '@services/wishlist-analytics.service'

describe('WishlistAnalyticsService', () => {
  let service: WishlistAnalyticsService

  beforeEach(() => {
    service = new WishlistAnalyticsService()
    jest.clearAllMocks()
  })

  describe('getTopProducts', () => {
    it('returns products and total for 7d period', async () => {
      mockWishlistAggregate
        .mockResolvedValueOnce([
          { product_id: 'p1', name: 'Phone', image: 'phone.jpg', price: 5000000, quantity: 10, sold: 5, wishlist_count: 100 },
        ])
        .mockResolvedValueOnce([{ total: 150 }])

      const result = await service.getTopProducts('7d')

      expect(result).toHaveProperty('products')
      expect(result).toHaveProperty('total', 150)
      expect(result.products).toHaveLength(1)
    })

    it('returns products and total for 30d period', async () => {
      mockWishlistAggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: 0 }])

      const result = await service.getTopProducts('30d')

      expect(result.products).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('returns products and total for 90d period', async () => {
      mockWishlistAggregate
        .mockResolvedValueOnce([
          { product_id: 'p2', name: 'Laptop', image: null, price: 20000000, quantity: 5, sold: 2, wishlist_count: 50 },
        ])
        .mockResolvedValueOnce([{ total: 50 }])

      const result = await service.getTopProducts('90d')

      expect(result.products[0].image).toBe('')
    })

    it('returns all products when period is "all" (no date filter)', async () => {
      mockWishlistAggregate
        .mockResolvedValueOnce([
          { product_id: 'p3', name: 'Tablet', image: 'tablet.jpg', price: 8000000, quantity: 20, sold: 10, wishlist_count: 200 },
        ])
        .mockResolvedValueOnce([{ total: 200 }])

      const result = await service.getTopProducts('all')

      expect(result.products).toHaveLength(1)
      expect(result.total).toBe(200)
    })

    it('returns 0 total when no wishlist entries', async () => {
      mockWishlistAggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])

      const result = await service.getTopProducts('30d')

      expect(result.total).toBe(0)
    })
  })

  describe('getConversion', () => {
    it('returns conversion items with conversion_rate calculated', async () => {
      mockWishlistAggregate.mockResolvedValue([
        { product_id: 'p1', name: 'Phone', image: 'phone.jpg', price: 5000000, sold: 10, wishlist_count: 100 },
      ])

      const result = await service.getConversion()

      expect(Array.isArray(result)).toBe(true)
      expect(result[0]).toHaveProperty('conversion_rate')
      expect(result[0].conversion_rate).toBe(10) // 10/100 * 100 = 10%
    })

    it('returns 0 conversion_rate when wishlist_count is 0', async () => {
      mockWishlistAggregate.mockResolvedValue([
        { product_id: 'p2', name: 'Laptop', image: null, price: 20000000, sold: 5, wishlist_count: 0 },
      ])

      const result = await service.getConversion()

      expect(result[0].conversion_rate).toBe(0)
    })

    it('caps conversion_rate at 100', async () => {
      mockWishlistAggregate.mockResolvedValue([
        { product_id: 'p3', name: 'Tablet', image: null, price: 8000000, sold: 200, wishlist_count: 10 },
      ])

      const result = await service.getConversion()

      expect(result[0].conversion_rate).toBe(100)
    })
  })

  describe('getTrends', () => {
    it('returns trend data points for 7d period', async () => {
      mockWishlistAggregate.mockResolvedValue([
        { date: '2026-05-05', count: 10 },
        { date: '2026-05-06', count: 15 },
      ])

      const result = await service.getTrends('7d')

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('date')
      expect(result[0]).toHaveProperty('count')
    })

    it('returns empty array when no wishlist activity', async () => {
      mockWishlistAggregate.mockResolvedValue([])

      const result = await service.getTrends('30d')

      expect(result).toHaveLength(0)
    })
  })
})
