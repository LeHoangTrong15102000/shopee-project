import { describe, it, expect } from 'vitest'
import { productSearchParsers, normalizeProductQueryKey, ProductQueryConfig } from '../productSearchParams'

describe('productSearchParams', () => {
  describe('productSearchParsers', () => {
    it('has correct default value for page', () => {
      expect(productSearchParsers.page.defaultValue).toBe(1)
    })

    it('has correct default value for limit', () => {
      expect(productSearchParsers.limit.defaultValue).toBe(20)
    })

    it('has correct default value for sort_by', () => {
      expect(productSearchParsers.sort_by.defaultValue).toBe('createdAt')
    })
  })

  describe('normalizeProductQueryKey', () => {
    it('converts numbers to strings', () => {
      const filters: ProductQueryConfig = {
        page: 5,
        limit: 10,
        sort_by: 'price',
        order: null,
        exclude: null,
        name: null,
        price_min: 100,
        price_max: 500,
        rating_filter: 4,
        category: null
      }

      const result = normalizeProductQueryKey(filters)

      expect(result.page).toBe('5')
      expect(result.limit).toBe('10')
      expect(result.price_min).toBe('100')
      expect(result.price_max).toBe('500')
      expect(result.rating_filter).toBe('4')
    })

    it('handles null values as undefined', () => {
      const filters: ProductQueryConfig = {
        page: 1,
        limit: 20,
        sort_by: 'createdAt',
        order: null,
        exclude: null,
        name: null,
        price_min: null,
        price_max: null,
        rating_filter: null,
        category: null
      }

      const result = normalizeProductQueryKey(filters)

      expect(result.order).toBeUndefined()
      expect(result.exclude).toBeUndefined()
      expect(result.name).toBeUndefined()
      expect(result.price_min).toBeUndefined()
      expect(result.price_max).toBeUndefined()
      expect(result.rating_filter).toBeUndefined()
      expect(result.category).toBeUndefined()
    })

    it('preserves string values', () => {
      const filters: ProductQueryConfig = {
        page: 1,
        limit: 20,
        sort_by: 'sold',
        order: 'desc',
        exclude: 'product-123',
        name: 'iphone',
        price_min: null,
        price_max: null,
        rating_filter: null,
        category: 'electronics'
      }

      const result = normalizeProductQueryKey(filters)

      expect(result.sort_by).toBe('sold')
      expect(result.order).toBe('desc')
      expect(result.exclude).toBe('product-123')
      expect(result.name).toBe('iphone')
      expect(result.category).toBe('electronics')
    })
  })
})
