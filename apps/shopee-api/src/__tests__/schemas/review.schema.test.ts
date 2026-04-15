/// <reference types="jest" />
import {
  createReviewSchema,
  getProductReviewsSchema,
  reviewIdParamSchema,
  createReviewCommentSchema,
  getReviewCommentsSchema,
  canReviewPurchaseSchema,
} from '@schemas/review.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('createReviewSchema', () => {
  it('should pass with valid data', () => {
    const result = createReviewSchema.safeParse({
      body: { purchase_id: VALID_ID, rating: 5, comment: 'Great product!' },
    })
    expect(result.success).toBe(true)
  })

  it('should fail when rating is 0', () => {
    const result = createReviewSchema.safeParse({
      body: { purchase_id: VALID_ID, rating: 0, comment: 'Great product!' },
    })
    expect(result.success).toBe(false)
  })

  it('should fail when rating is 6', () => {
    const result = createReviewSchema.safeParse({
      body: { purchase_id: VALID_ID, rating: 6, comment: 'Great product!' },
    })
    expect(result.success).toBe(false)
  })

  it('should fail when rating is -1', () => {
    const result = createReviewSchema.safeParse({
      body: { purchase_id: VALID_ID, rating: -1, comment: 'Great product!' },
    })
    expect(result.success).toBe(false)
  })

  it('should fail when comment is too short', () => {
    const result = createReviewSchema.safeParse({
      body: { purchase_id: VALID_ID, rating: 5, comment: 'Short' },
    })
    expect(result.success).toBe(false)
  })

  it('should fail when comment is too long', () => {
    const result = createReviewSchema.safeParse({
      body: { purchase_id: VALID_ID, rating: 5, comment: 'a'.repeat(2001) },
    })
    expect(result.success).toBe(false)
  })

  it('should fail when images has more than 10 items', () => {
    const result = createReviewSchema.safeParse({
      body: {
        purchase_id: VALID_ID,
        rating: 5,
        comment: 'Great product!',
        images: Array(11).fill('url'),
      },
    })
    expect(result.success).toBe(false)
  })

  it('should fail when purchase_id is missing', () => {
    const result = createReviewSchema.safeParse({
      body: { rating: 5, comment: 'Great product!' },
    })
    expect(result.success).toBe(false)
  })
})

describe('getProductReviewsSchema', () => {
  it('should pass with valid data', () => {
    const result = getProductReviewsSchema.safeParse({
      params: { product_id: VALID_ID },
      query: { page: 1, limit: 10 },
    })
    expect(result.success).toBe(true)
  })

  it('should fail with invalid product_id', () => {
    const result = getProductReviewsSchema.safeParse({
      params: { product_id: 'invalid' },
      query: {},
    })
    expect(result.success).toBe(false)
  })

  it('should fail when limit is 51', () => {
    const result = getProductReviewsSchema.safeParse({
      params: { product_id: VALID_ID },
      query: { limit: 51 },
    })
    expect(result.success).toBe(false)
  })
})

describe('createReviewCommentSchema', () => {
  it('should pass with valid data', () => {
    const result = createReviewCommentSchema.safeParse({
      body: { review_id: VALID_ID, content: 'Nice review!' },
    })
    expect(result.success).toBe(true)
  })

  it('should fail when content is missing', () => {
    const result = createReviewCommentSchema.safeParse({
      body: { review_id: VALID_ID },
    })
    expect(result.success).toBe(false)
  })

  it('should fail when content is empty', () => {
    const result = createReviewCommentSchema.safeParse({
      body: { review_id: VALID_ID, content: '' },
    })
    expect(result.success).toBe(false)
  })

  it('should fail when content is too long', () => {
    const result = createReviewCommentSchema.safeParse({
      body: { review_id: VALID_ID, content: 'a'.repeat(1001) },
    })
    expect(result.success).toBe(false)
  })

  it('should pass with optional parent_comment_id', () => {
    const result = createReviewCommentSchema.safeParse({
      body: { review_id: VALID_ID, content: 'Nice review!', parent_comment_id: VALID_ID },
    })
    expect(result.success).toBe(true)
  })
})

describe('reviewIdParamSchema', () => {
  it('should pass with valid review_id', () => {
    const result = reviewIdParamSchema.safeParse({ params: { review_id: VALID_ID } })
    expect(result.success).toBe(true)
  })

  it('should fail with invalid review_id', () => {
    const result = reviewIdParamSchema.safeParse({ params: { review_id: 'invalid' } })
    expect(result.success).toBe(false)
  })
})

describe('canReviewPurchaseSchema', () => {
  it('should pass with valid purchase_id', () => {
    const result = canReviewPurchaseSchema.safeParse({ params: { purchase_id: VALID_ID } })
    expect(result.success).toBe(true)
  })

  it('should fail with invalid purchase_id', () => {
    const result = canReviewPurchaseSchema.safeParse({ params: { purchase_id: 'invalid' } })
    expect(result.success).toBe(false)
  })
})
