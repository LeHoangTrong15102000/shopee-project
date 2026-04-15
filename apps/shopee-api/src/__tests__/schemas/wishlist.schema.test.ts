/// <reference types="jest" />
import {
  getWishlistSchema,
  addToWishlistSchema,
  wishlistProductIdParamSchema,
  removeFromWishlistSchema,
  checkInWishlistSchema,
} from '@schemas/wishlist.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('addToWishlistSchema', () => {
  it('should pass with valid product_id', () => {
    const result = addToWishlistSchema.safeParse({ body: { product_id: VALID_ID } })
    expect(result.success).toBe(true)
  })

  it('should fail when product_id is missing', () => {
    const result = addToWishlistSchema.safeParse({ body: {} })
    expect(result.success).toBe(false)
  })

  it('should fail when product_id is empty', () => {
    const result = addToWishlistSchema.safeParse({ body: { product_id: '' } })
    expect(result.success).toBe(false)
  })

  it('should fail when product_id is invalid', () => {
    const result = addToWishlistSchema.safeParse({ body: { product_id: 'invalid' } })
    expect(result.success).toBe(false)
  })
})

describe('getWishlistSchema', () => {
  it('should pass with valid query', () => {
    const result = getWishlistSchema.safeParse({ query: { page: 1, limit: 10 } })
    expect(result.success).toBe(true)
  })

  it('should fail when page is 0', () => {
    const result = getWishlistSchema.safeParse({ query: { page: 0 } })
    expect(result.success).toBe(false)
  })

  it('should fail when limit is 0', () => {
    const result = getWishlistSchema.safeParse({ query: { limit: 0 } })
    expect(result.success).toBe(false)
  })

  it('should fail when limit is 51', () => {
    const result = getWishlistSchema.safeParse({ query: { limit: 51 } })
    expect(result.success).toBe(false)
  })
})

describe('wishlistProductIdParamSchema', () => {
  it('should pass with valid product_id', () => {
    const result = wishlistProductIdParamSchema.safeParse({ params: { product_id: VALID_ID } })
    expect(result.success).toBe(true)
  })

  it('should fail with invalid product_id', () => {
    const result = wishlistProductIdParamSchema.safeParse({ params: { product_id: 'invalid' } })
    expect(result.success).toBe(false)
  })
})

describe('removeFromWishlistSchema', () => {
  it('should be same reference as wishlistProductIdParamSchema', () => {
    expect(removeFromWishlistSchema).toBe(wishlistProductIdParamSchema)
  })
})

describe('checkInWishlistSchema', () => {
  it('should be same reference as wishlistProductIdParamSchema', () => {
    expect(checkInWishlistSchema).toBe(wishlistProductIdParamSchema)
  })
})
