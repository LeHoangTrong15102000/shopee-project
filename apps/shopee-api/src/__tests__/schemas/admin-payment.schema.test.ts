/// <reference types="jest" />
import {
  adminPaymentIdSchema,
  adminCreatePaymentSchema,
  adminUpdatePaymentSchema,
  adminReorderPaymentSchema,
} from '@schemas/admin-payment.schema'

const VALID_ID = '507f1f77bcf86cd799439011'
const VALID_ID_2 = '507f1f77bcf86cd799439012'

describe('Admin Payment Schemas', () => {
  // ─── adminPaymentIdSchema ──────────────────────────────────────────────────

  describe('adminPaymentIdSchema', () => {
    it('accepts a valid 24-char hex ObjectId', () => {
      expect(adminPaymentIdSchema.safeParse({ params: { id: VALID_ID } }).success).toBe(true)
    })

    it('rejects a non-hex string', () => {
      expect(adminPaymentIdSchema.safeParse({ params: { id: 'not-a-valid-objectid!!' } }).success).toBe(false)
    })

    it('rejects when id is missing', () => {
      expect(adminPaymentIdSchema.safeParse({ params: {} }).success).toBe(false)
    })

    it('rejects a string shorter than 24 chars', () => {
      expect(adminPaymentIdSchema.safeParse({ params: { id: '507f1f77bcf86cd7994390' } }).success).toBe(false)
    })

    it('rejects a string longer than 24 chars', () => {
      expect(adminPaymentIdSchema.safeParse({ params: { id: '507f1f77bcf86cd7994390111' } }).success).toBe(false)
    })
  })

  // ─── adminCreatePaymentSchema ──────────────────────────────────────────────

  describe('adminCreatePaymentSchema', () => {
    const minimalValid = { name: 'Cash on Delivery', type: 'cod' as const }

    it('accepts minimal valid body (name + type)', () => {
      expect(adminCreatePaymentSchema.safeParse({ body: minimalValid }).success).toBe(true)
    })

    it('accepts full body with all optional fields', () => {
      expect(
        adminCreatePaymentSchema.safeParse({
          body: {
            name: 'Bank Transfer',
            type: 'bank_transfer',
            description: 'Pay via bank',
            icon: 'bank-icon',
            is_active: false,
            sort_order: 2,
            instructions: 'Transfer to account 123',
          },
        }).success,
      ).toBe(true)
    })

    it('rejects when name is missing', () => {
      expect(adminCreatePaymentSchema.safeParse({ body: { type: 'cod' } }).success).toBe(false)
    })

    it('rejects when name is empty string', () => {
      expect(adminCreatePaymentSchema.safeParse({ body: { ...minimalValid, name: '' } }).success).toBe(false)
    })

    it('rejects when name exceeds 100 chars', () => {
      expect(
        adminCreatePaymentSchema.safeParse({ body: { ...minimalValid, name: 'a'.repeat(101) } }).success,
      ).toBe(false)
    })

    it('rejects invalid type enum value', () => {
      expect(adminCreatePaymentSchema.safeParse({ body: { name: 'X', type: 'paypal' } }).success).toBe(false)
    })

    it('accepts all four valid enum values', () => {
      const types = ['cod', 'bank_transfer', 'e_wallet', 'credit_card'] as const
      for (const type of types) {
        expect(adminCreatePaymentSchema.safeParse({ body: { name: 'Test', type } }).success).toBe(true)
      }
    })

    it('rejects description longer than 500 chars', () => {
      expect(
        adminCreatePaymentSchema.safeParse({ body: { ...minimalValid, description: 'x'.repeat(501) } }).success,
      ).toBe(false)
    })

    it('rejects icon longer than 50 chars', () => {
      expect(
        adminCreatePaymentSchema.safeParse({ body: { ...minimalValid, icon: 'i'.repeat(51) } }).success,
      ).toBe(false)
    })

    it('rejects instructions longer than 1000 chars', () => {
      expect(
        adminCreatePaymentSchema.safeParse({ body: { ...minimalValid, instructions: 'x'.repeat(1001) } }).success,
      ).toBe(false)
    })

    it('rejects negative sort_order', () => {
      expect(
        adminCreatePaymentSchema.safeParse({ body: { ...minimalValid, sort_order: -1 } }).success,
      ).toBe(false)
    })

    it('applies default is_active: true when omitted', () => {
      const result = adminCreatePaymentSchema.safeParse({ body: minimalValid })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.body.is_active).toBe(true)
      }
    })

    it('applies default sort_order: 0 when omitted', () => {
      const result = adminCreatePaymentSchema.safeParse({ body: minimalValid })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.body.sort_order).toBe(0)
      }
    })
  })

  // ─── adminUpdatePaymentSchema ──────────────────────────────────────────────

  describe('adminUpdatePaymentSchema', () => {
    it('accepts partial body with only name', () => {
      expect(
        adminUpdatePaymentSchema.safeParse({
          params: { id: VALID_ID },
          body: { name: 'Updated Name' },
        }).success,
      ).toBe(true)
    })

    it('accepts empty body (all fields optional)', () => {
      expect(
        adminUpdatePaymentSchema.safeParse({
          params: { id: VALID_ID },
          body: {},
        }).success,
      ).toBe(true)
    })

    it('rejects invalid id in params', () => {
      expect(
        adminUpdatePaymentSchema.safeParse({
          params: { id: 'not-valid' },
          body: { name: 'X' },
        }).success,
      ).toBe(false)
    })

    it('rejects invalid type in body', () => {
      expect(
        adminUpdatePaymentSchema.safeParse({
          params: { id: VALID_ID },
          body: { type: 'paypal' },
        }).success,
      ).toBe(false)
    })
  })

  // ─── adminReorderPaymentSchema ─────────────────────────────────────────────

  describe('adminReorderPaymentSchema', () => {
    it('accepts a single valid item', () => {
      expect(
        adminReorderPaymentSchema.safeParse({
          body: { items: [{ id: VALID_ID, sort_order: 0 }] },
        }).success,
      ).toBe(true)
    })

    it('accepts multiple valid items', () => {
      expect(
        adminReorderPaymentSchema.safeParse({
          body: {
            items: [
              { id: VALID_ID, sort_order: 0 },
              { id: VALID_ID_2, sort_order: 1 },
            ],
          },
        }).success,
      ).toBe(true)
    })

    it('rejects empty items array', () => {
      expect(
        adminReorderPaymentSchema.safeParse({ body: { items: [] } }).success,
      ).toBe(false)
    })

    it('rejects item with invalid ObjectId', () => {
      expect(
        adminReorderPaymentSchema.safeParse({
          body: { items: [{ id: 'bad-id', sort_order: 0 }] },
        }).success,
      ).toBe(false)
    })

    it('rejects item with negative sort_order', () => {
      expect(
        adminReorderPaymentSchema.safeParse({
          body: { items: [{ id: VALID_ID, sort_order: -1 }] },
        }).success,
      ).toBe(false)
    })

    it('rejects item with non-integer sort_order', () => {
      expect(
        adminReorderPaymentSchema.safeParse({
          body: { items: [{ id: VALID_ID, sort_order: 1.5 }] },
        }).success,
      ).toBe(false)
    })
  })
})
