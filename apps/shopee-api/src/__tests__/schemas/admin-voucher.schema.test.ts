/// <reference types="jest" />
import {
  adminVoucherListSchema, adminCreateVoucherSchema, adminUpdateVoucherSchema,
  adminVoucherIdSchema, adminVoucherUsageSchema,
} from '@schemas/admin-voucher.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('Admin Voucher Schemas', () => {
  describe('adminVoucherListSchema', () => {
    it('should accept valid query', () => {
      expect(adminVoucherListSchema.safeParse({ query: { discount_type: 'percentage', is_active: 'true' } }).success).toBe(true)
    })
    it('should reject invalid discount_type', () => {
      expect(adminVoucherListSchema.safeParse({ query: { discount_type: 'invalid' } }).success).toBe(false)
    })
    it('should accept status filter', () => {
      expect(adminVoucherListSchema.safeParse({ query: { status: 'active' } }).success).toBe(true)
    })
  })

  describe('adminCreateVoucherSchema', () => {
    const validBody = {
      code: 'SAVE20', discount_type: 'percentage' as const, discount_value: 20,
      start_date: '2024-01-01', end_date: '2024-12-31',
    }
    it('should accept valid input', () => {
      expect(adminCreateVoucherSchema.safeParse({ body: validBody }).success).toBe(true)
    })
    it('should reject short code', () => {
      expect(adminCreateVoucherSchema.safeParse({ body: { ...validBody, code: 'AB' } }).success).toBe(false)
    })
    it('should reject lowercase code', () => {
      expect(adminCreateVoucherSchema.safeParse({ body: { ...validBody, code: 'save20' } }).success).toBe(false)
    })
    it('should reject negative discount_value', () => {
      expect(adminCreateVoucherSchema.safeParse({ body: { ...validBody, discount_value: -1 } }).success).toBe(false)
    })
    it('should reject invalid date format', () => {
      expect(adminCreateVoucherSchema.safeParse({ body: { ...validBody, start_date: '01-01-2024' } }).success).toBe(false)
    })
  })

  describe('adminUpdateVoucherSchema', () => {
    it('should accept partial update', () => {
      expect(adminUpdateVoucherSchema.safeParse({ params: { id: VALID_ID }, body: { discount_value: 30 } }).success).toBe(true)
    })
    it('should accept null max_discount', () => {
      expect(adminUpdateVoucherSchema.safeParse({ params: { id: VALID_ID }, body: { max_discount: null } }).success).toBe(true)
    })
  })

  describe('adminVoucherIdSchema', () => {
    it('should accept valid id', () => {
      expect(adminVoucherIdSchema.safeParse({ params: { id: VALID_ID } }).success).toBe(true)
    })
  })

  describe('adminVoucherUsageSchema', () => {
    it('should accept valid params and query', () => {
      expect(adminVoucherUsageSchema.safeParse({ params: { id: VALID_ID }, query: { page: 1, limit: 10 } }).success).toBe(true)
    })
  })
})
