/// <reference types="jest" />
import {
  returnOrderSchema,
  adminUpdateStatusSchema,
  adminGetOrderSchema,
} from '@schemas/order.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('Order Schemas', () => {
  describe('returnOrderSchema', () => {
    it('should accept valid input', () => {
      expect(
        returnOrderSchema.safeParse({ body: { reason: 'Defective' }, params: { id: VALID_ID } })
          .success,
      ).toBe(true)
    })
    it('should reject empty reason', () => {
      expect(
        returnOrderSchema.safeParse({ body: { reason: '' }, params: { id: VALID_ID } }).success,
      ).toBe(false)
    })
    it('should reject invalid order id', () => {
      expect(
        returnOrderSchema.safeParse({ body: { reason: 'Defective' }, params: { id: 'bad' } })
          .success,
      ).toBe(false)
    })
  })

  describe('adminUpdateStatusSchema', () => {
    it('should accept valid status', () => {
      expect(
        adminUpdateStatusSchema.safeParse({
          body: { status: 'confirmed' },
          params: { id: VALID_ID },
        }).success,
      ).toBe(true)
    })
    it('should accept optional reason', () => {
      expect(
        adminUpdateStatusSchema.safeParse({
          body: { status: 'cancelled', reason: 'Out of stock' },
          params: { id: VALID_ID },
        }).success,
      ).toBe(true)
    })
    it('should reject invalid status', () => {
      expect(
        adminUpdateStatusSchema.safeParse({ body: { status: 'invalid' }, params: { id: VALID_ID } })
          .success,
      ).toBe(false)
    })
    it('should reject pending status (not in enum)', () => {
      expect(
        adminUpdateStatusSchema.safeParse({ body: { status: 'pending' }, params: { id: VALID_ID } })
          .success,
      ).toBe(false)
    })
  })

  describe('adminGetOrderSchema', () => {
    it('should accept valid id', () => {
      expect(adminGetOrderSchema.safeParse({ params: { id: VALID_ID } }).success).toBe(true)
    })
    it('should reject invalid id', () => {
      expect(adminGetOrderSchema.safeParse({ params: { id: 'bad' } }).success).toBe(false)
    })
  })
})
