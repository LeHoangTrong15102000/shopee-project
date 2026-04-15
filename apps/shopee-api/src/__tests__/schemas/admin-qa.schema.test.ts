/// <reference types="jest" />
import {
  adminQuestionListSchema,
  adminQuestionIdSchema,
  adminDeleteAnswerSchema,
} from '@schemas/admin-qa.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('Admin QA Schemas', () => {
  describe('adminQuestionListSchema', () => {
    it('should accept valid query', () => {
      expect(
        adminQuestionListSchema.safeParse({ query: { product_id: VALID_ID, unanswered: 'true' } })
          .success,
      ).toBe(true)
    })
    it('should accept empty query', () => {
      expect(adminQuestionListSchema.safeParse({ query: {} }).success).toBe(true)
    })
    it('should reject invalid unanswered value', () => {
      expect(adminQuestionListSchema.safeParse({ query: { unanswered: 'yes' } }).success).toBe(
        false,
      )
    })
  })

  describe('adminQuestionIdSchema', () => {
    it('should accept valid id', () => {
      expect(adminQuestionIdSchema.safeParse({ params: { id: VALID_ID } }).success).toBe(true)
    })
    it('should reject invalid id', () => {
      expect(adminQuestionIdSchema.safeParse({ params: { id: 'bad' } }).success).toBe(false)
    })
  })

  describe('adminDeleteAnswerSchema', () => {
    it('should accept valid params', () => {
      expect(
        adminDeleteAnswerSchema.safeParse({
          params: { question_id: VALID_ID, answer_id: VALID_ID },
        }).success,
      ).toBe(true)
    })
    it('should reject invalid question_id', () => {
      expect(
        adminDeleteAnswerSchema.safeParse({ params: { question_id: 'bad', answer_id: VALID_ID } })
          .success,
      ).toBe(false)
    })
  })
})
