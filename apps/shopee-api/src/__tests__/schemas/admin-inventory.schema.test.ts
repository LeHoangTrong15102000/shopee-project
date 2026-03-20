/// <reference types="jest" />
import {
  adminLowStockSchema, adminOutOfStockSchema, adminUpdateStockSchema, adminBulkStockUpdateSchema,
} from '@schemas/admin-inventory.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('Admin Inventory Schemas', () => {
  describe('adminLowStockSchema', () => {
    it('should accept valid query with threshold', () => {
      expect(adminLowStockSchema.safeParse({ query: { threshold: 5 } }).success).toBe(true)
    })
    it('should default threshold to 10', () => {
      const r = adminLowStockSchema.safeParse({ query: {} })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.query.threshold).toBe(10)
    })
  })

  describe('adminOutOfStockSchema', () => {
    it('should accept pagination', () => {
      expect(adminOutOfStockSchema.safeParse({ query: { page: 1, limit: 20 } }).success).toBe(true)
    })
  })

  describe('adminUpdateStockSchema', () => {
    it('should accept valid input', () => {
      expect(adminUpdateStockSchema.safeParse({ params: { product_id: VALID_ID }, body: { quantity: 50 } }).success).toBe(true)
    })
    it('should reject negative quantity', () => {
      expect(adminUpdateStockSchema.safeParse({ params: { product_id: VALID_ID }, body: { quantity: -1 } }).success).toBe(false)
    })
    it('should reject invalid product_id', () => {
      expect(adminUpdateStockSchema.safeParse({ params: { product_id: 'bad' }, body: { quantity: 10 } }).success).toBe(false)
    })
  })

  describe('adminBulkStockUpdateSchema', () => {
    it('should accept valid items', () => {
      expect(adminBulkStockUpdateSchema.safeParse({
        body: { items: [{ product_id: VALID_ID, quantity: 10 }] }
      }).success).toBe(true)
    })
    it('should reject empty items', () => {
      expect(adminBulkStockUpdateSchema.safeParse({ body: { items: [] } }).success).toBe(false)
    })
  })
})
