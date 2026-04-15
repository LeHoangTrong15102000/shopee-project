/// <reference types="jest" />
import {
  adminReviewListSchema,
  adminReviewIdSchema,
  adminCommentIdSchema,
} from '@schemas/admin-review.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('Admin Review Schemas', () => {
  describe('adminReviewListSchema', () => {
    it('should accept valid query', () => {
      expect(
        adminReviewListSchema.safeParse({ query: { rating: 5, product_id: VALID_ID } }).success,
      ).toBe(true)
    })
    it('should reject rating > 5', () => {
      expect(adminReviewListSchema.safeParse({ query: { rating: 6 } }).success).toBe(false)
    })
    it('should reject rating < 1', () => {
      expect(adminReviewListSchema.safeParse({ query: { rating: 0 } }).success).toBe(false)
    })
    it('should accept search and sort', () => {
      expect(
        adminReviewListSchema.safeParse({
          query: { search: 'good', sort_by: 'created_at', order: 'asc' },
        }).success,
      ).toBe(true)
    })
  })

  describe('adminReviewIdSchema', () => {
    it('should accept valid id', () => {
      expect(adminReviewIdSchema.safeParse({ params: { id: VALID_ID } }).success).toBe(true)
    })
    it('should reject invalid id', () => {
      expect(adminReviewIdSchema.safeParse({ params: { id: 'bad' } }).success).toBe(false)
    })
  })

  describe('adminCommentIdSchema', () => {
    it('should accept valid id', () => {
      expect(adminCommentIdSchema.safeParse({ params: { id: VALID_ID } }).success).toBe(true)
    })
  })
})
