/// <reference types="jest" />
import { adminOrderListSchema, adminBulkUpdateStatusSchema } from '@schemas/admin-order-list.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('Admin Order List Schemas', () => {
  describe('adminOrderListSchema', () => {
    it('should accept valid query', () => {
      expect(adminOrderListSchema.safeParse({ query: { status: 'pending', page: 1 } }).success).toBe(true)
    })
    it('should accept payment_method filter', () => {
      expect(adminOrderListSchema.safeParse({ query: { payment_method: 'cod' } }).success).toBe(true)
    })
    it('should reject invalid status', () => {
      expect(adminOrderListSchema.safeParse({ query: { status: 'invalid' } }).success).toBe(false)
    })
    it('should reject invalid payment_method', () => {
      expect(adminOrderListSchema.safeParse({ query: { payment_method: 'bitcoin' } }).success).toBe(false)
    })
  })

  describe('adminBulkUpdateStatusSchema', () => {
    it('should accept valid input', () => {
      expect(adminBulkUpdateStatusSchema.safeParse({
        body: { order_ids: [VALID_ID], status: 'confirmed' }
      }).success).toBe(true)
    })
    it('should reject empty order_ids', () => {
      expect(adminBulkUpdateStatusSchema.safeParse({
        body: { order_ids: [], status: 'confirmed' }
      }).success).toBe(false)
    })
    it('should reject more than 50 order_ids', () => {
      const ids = Array(51).fill(VALID_ID)
      expect(adminBulkUpdateStatusSchema.safeParse({
        body: { order_ids: ids, status: 'confirmed' }
      }).success).toBe(false)
    })
    it('should reject invalid status', () => {
      expect(adminBulkUpdateStatusSchema.safeParse({
        body: { order_ids: [VALID_ID], status: 'invalid' }
      }).success).toBe(false)
    })
  })
})
