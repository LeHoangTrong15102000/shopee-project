/// <reference types="jest" />
import {
  adminTopSellingSchema, adminTopViewedSchema, adminTopRatedSchema, adminProductByCategorySchema,
} from '@schemas/admin-product-analytics.schema'

describe('Admin Product Analytics Schemas', () => {
  describe('adminTopSellingSchema', () => {
    it('should accept valid query', () => {
      expect(adminTopSellingSchema.safeParse({ query: { period: '7d', limit: 5 } }).success).toBe(true)
    })
    it('should default period to 30d', () => {
      const r = adminTopSellingSchema.safeParse({ query: {} })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.query.period).toBe('30d')
    })
    it('should reject invalid period', () => {
      expect(adminTopSellingSchema.safeParse({ query: { period: 'invalid' } }).success).toBe(false)
    })
  })

  describe('adminTopViewedSchema', () => {
    it('should accept limit', () => {
      expect(adminTopViewedSchema.safeParse({ query: { limit: 15 } }).success).toBe(true)
    })
    it('should default limit to 10', () => {
      const r = adminTopViewedSchema.safeParse({ query: {} })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.query.limit).toBe(10)
    })
  })

  describe('adminTopRatedSchema', () => {
    it('should accept limit and min_reviews', () => {
      expect(adminTopRatedSchema.safeParse({ query: { limit: 20, min_reviews: 5 } }).success).toBe(true)
    })
    it('should default min_reviews to 1', () => {
      const r = adminTopRatedSchema.safeParse({ query: {} })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.query.min_reviews).toBe(1)
    })
  })

  describe('adminProductByCategorySchema', () => {
    it('should accept empty query', () => {
      expect(adminProductByCategorySchema.safeParse({}).success).toBe(true)
    })
  })
})
