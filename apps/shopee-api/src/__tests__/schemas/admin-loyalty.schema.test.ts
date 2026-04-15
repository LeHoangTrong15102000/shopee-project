/// <reference types="jest" />
import {
  adminRewardListSchema,
  adminCreateRewardSchema,
  adminUpdateRewardSchema,
  adminRewardIdSchema,
  adminAdjustPointsSchema,
  adminTransactionListSchema,
} from '@schemas/admin-loyalty.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('Admin Loyalty Schemas', () => {
  describe('adminRewardListSchema', () => {
    it('should accept valid query', () => {
      expect(adminRewardListSchema.safeParse({ query: { reward_type: 'voucher' } }).success).toBe(
        true,
      )
    })
    it('should reject invalid reward_type', () => {
      expect(adminRewardListSchema.safeParse({ query: { reward_type: 'invalid' } }).success).toBe(
        false,
      )
    })
  })

  describe('adminCreateRewardSchema', () => {
    const validBody = {
      name: 'Test Reward',
      points_required: 100,
      reward_type: 'voucher' as const,
      reward_value: 50,
      stock: 10,
    }
    it('should accept valid input', () => {
      expect(adminCreateRewardSchema.safeParse({ body: validBody }).success).toBe(true)
    })
    it('should reject empty name', () => {
      expect(adminCreateRewardSchema.safeParse({ body: { ...validBody, name: '' } }).success).toBe(
        false,
      )
    })
    it('should reject negative points', () => {
      expect(
        adminCreateRewardSchema.safeParse({ body: { ...validBody, points_required: -1 } }).success,
      ).toBe(false)
    })
  })

  describe('adminUpdateRewardSchema', () => {
    it('should accept partial update', () => {
      expect(
        adminUpdateRewardSchema.safeParse({ params: { id: VALID_ID }, body: { stock: 5 } }).success,
      ).toBe(true)
    })
  })

  describe('adminRewardIdSchema', () => {
    it('should accept valid id', () => {
      expect(adminRewardIdSchema.safeParse({ params: { id: VALID_ID } }).success).toBe(true)
    })
    it('should reject invalid id', () => {
      expect(adminRewardIdSchema.safeParse({ params: { id: 'bad' } }).success).toBe(false)
    })
  })

  describe('adminAdjustPointsSchema', () => {
    it('should accept valid adjustment', () => {
      expect(
        adminAdjustPointsSchema.safeParse({
          body: { user_id: VALID_ID, points: 100, type: 'earn', description: 'Bonus' },
        }).success,
      ).toBe(true)
    })
    it('should reject zero points', () => {
      expect(
        adminAdjustPointsSchema.safeParse({
          body: { user_id: VALID_ID, points: 0, type: 'earn', description: 'Bonus' },
        }).success,
      ).toBe(false)
    })
    it('should reject invalid type', () => {
      expect(
        adminAdjustPointsSchema.safeParse({
          body: { user_id: VALID_ID, points: 10, type: 'invalid', description: 'Bonus' },
        }).success,
      ).toBe(false)
    })
  })

  describe('adminTransactionListSchema', () => {
    it('should accept valid query', () => {
      expect(adminTransactionListSchema.safeParse({ query: { type: 'earn' } }).success).toBe(true)
    })
  })
})
