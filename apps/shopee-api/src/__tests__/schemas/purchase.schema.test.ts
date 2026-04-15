/// <reference types="jest" />
import {
  addToCartSchema,
  updatePurchaseSchema,
  buyProductsSchema,
  deletePurchasesSchema,
} from '@schemas/purchase.schema'

const VALID_ID = '507f1f77bcf86cd799439011'
const VALID_ID_2 = '507f1f77bcf86cd799439012'

describe('addToCartSchema', () => {
  it('should pass with valid data', () => {
    const result = addToCartSchema.safeParse({ body: { product_id: VALID_ID, buy_count: 1 } })
    expect(result.success).toBe(true)
  })

  it('should fail when product_id is missing', () => {
    const result = addToCartSchema.safeParse({ body: { buy_count: 1 } })
    expect(result.success).toBe(false)
  })

  it('should fail when product_id is empty', () => {
    const result = addToCartSchema.safeParse({ body: { product_id: '', buy_count: 1 } })
    expect(result.success).toBe(false)
  })

  it('should fail when product_id is invalid', () => {
    const result = addToCartSchema.safeParse({ body: { product_id: 'invalid-id', buy_count: 1 } })
    expect(result.success).toBe(false)
  })

  it('should fail when buy_count is 0', () => {
    const result = addToCartSchema.safeParse({ body: { product_id: VALID_ID, buy_count: 0 } })
    expect(result.success).toBe(false)
  })

  it('should fail when buy_count is negative', () => {
    const result = addToCartSchema.safeParse({ body: { product_id: VALID_ID, buy_count: -1 } })
    expect(result.success).toBe(false)
  })

  it('should coerce string buy_count to number', () => {
    const result = addToCartSchema.safeParse({ body: { product_id: VALID_ID, buy_count: '2' } })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.body.buy_count).toBe(2)
    }
  })
})

describe('updatePurchaseSchema', () => {
  it('should be the same reference as addToCartSchema', () => {
    expect(updatePurchaseSchema).toBe(addToCartSchema)
  })

  it('should pass with valid data', () => {
    const result = updatePurchaseSchema.safeParse({ body: { product_id: VALID_ID, buy_count: 5 } })
    expect(result.success).toBe(true)
  })

  it('should fail when product_id is invalid', () => {
    const result = updatePurchaseSchema.safeParse({ body: { product_id: 'invalid', buy_count: 1 } })
    expect(result.success).toBe(false)
  })

  it('should fail when buy_count is 0', () => {
    const result = updatePurchaseSchema.safeParse({ body: { product_id: VALID_ID, buy_count: 0 } })
    expect(result.success).toBe(false)
  })
})

describe('buyProductsSchema', () => {
  it('should pass with valid array', () => {
    const result = buyProductsSchema.safeParse({
      body: [
        { product_id: VALID_ID, buy_count: 1 },
        { product_id: VALID_ID_2, buy_count: 2 },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('should fail with empty array', () => {
    const result = buyProductsSchema.safeParse({ body: [] })
    expect(result.success).toBe(false)
  })

  it('should fail when item has invalid product_id', () => {
    const result = buyProductsSchema.safeParse({
      body: [{ product_id: 'invalid-id', buy_count: 1 }],
    })
    expect(result.success).toBe(false)
  })

  it('should fail when item has buy_count of 0', () => {
    const result = buyProductsSchema.safeParse({
      body: [{ product_id: VALID_ID, buy_count: 0 }],
    })
    expect(result.success).toBe(false)
  })
})

describe('deletePurchasesSchema', () => {
  it('should pass with valid array of IDs', () => {
    const result = deletePurchasesSchema.safeParse({ body: [VALID_ID, VALID_ID_2] })
    expect(result.success).toBe(true)
  })

  it('should fail with empty array', () => {
    const result = deletePurchasesSchema.safeParse({ body: [] })
    expect(result.success).toBe(false)
  })

  it('should fail when array contains invalid ID', () => {
    const result = deletePurchasesSchema.safeParse({ body: [VALID_ID, 'invalid-id'] })
    expect(result.success).toBe(false)
  })
})
