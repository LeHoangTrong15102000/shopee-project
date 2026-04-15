/// <reference types="jest" />
import {
  mongoIdSchema,
  mongoIdParamSchema,
  paginationQuerySchema,
  paginationSchema,
} from '@schemas/common.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('Common Schemas', () => {
  describe('mongoIdSchema', () => {
    it('should pass with valid 24-char hex', () => {
      expect(mongoIdSchema.safeParse(VALID_ID).success).toBe(true)
    })
    it('should fail with short string', () => {
      expect(mongoIdSchema.safeParse('507f1f77bcf86cd79943901').success).toBe(false)
    })
    it('should fail with non-hex characters', () => {
      expect(mongoIdSchema.safeParse('507f1f77bcf86cd79943901g').success).toBe(false)
    })
    it('should fail with empty string', () => {
      expect(mongoIdSchema.safeParse('').success).toBe(false)
    })
    it('should fail with 25-char string', () => {
      expect(mongoIdSchema.safeParse('507f1f77bcf86cd7994390111').success).toBe(false)
    })
  })

  describe('mongoIdParamSchema', () => {
    it('should create schema with custom param name', () => {
      const schema = mongoIdParamSchema('productId')
      expect(schema.safeParse({ params: { productId: VALID_ID } }).success).toBe(true)
    })
    it('should pass with valid ID', () => {
      const schema = mongoIdParamSchema('userId')
      expect(schema.safeParse({ params: { userId: VALID_ID } }).success).toBe(true)
    })
    it('should fail with invalid ID', () => {
      const schema = mongoIdParamSchema('orderId')
      expect(schema.safeParse({ params: { orderId: 'invalid' } }).success).toBe(false)
    })
  })

  describe('paginationQuerySchema', () => {
    it('should pass with empty object (all optional)', () => {
      expect(paginationQuerySchema.safeParse({}).success).toBe(true)
    })
    it('should pass with valid page and limit', () => {
      expect(paginationQuerySchema.safeParse({ page: 1, limit: 10 }).success).toBe(true)
    })
    it('should fail when page is 0', () => {
      expect(paginationQuerySchema.safeParse({ page: 0 }).success).toBe(false)
    })
    it('should fail when page is -1', () => {
      expect(paginationQuerySchema.safeParse({ page: -1 }).success).toBe(false)
    })
    it('should fail when limit is 0', () => {
      expect(paginationQuerySchema.safeParse({ limit: 0 }).success).toBe(false)
    })
    it('should fail when limit is 101', () => {
      expect(paginationQuerySchema.safeParse({ limit: 101 }).success).toBe(false)
    })
    it('should fail with non-integer page', () => {
      expect(paginationQuerySchema.safeParse({ page: 1.5 }).success).toBe(false)
    })
  })

  describe('paginationSchema', () => {
    it('should wrap paginationQuerySchema in query object', () => {
      expect(paginationSchema.safeParse({ query: { page: 1, limit: 20 } }).success).toBe(true)
    })
    it('should pass with valid query', () => {
      expect(paginationSchema.safeParse({ query: {} }).success).toBe(true)
    })
  })
})
