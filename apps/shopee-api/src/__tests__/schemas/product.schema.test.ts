/// <reference types="jest" />
import {
  addProductSchema,
  updateProductSchema,
  getProductsSchema,
  getAllProductsSchema,
  getPagesSchema,
  productIdParamSchema,
} from '@schemas/product.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('addProductSchema', () => {
  const validBody = {
    name: 'Test Product',
    price: 100,
    quantity: 10,
    category: VALID_ID,
    image: 'https://example.com/image.jpg',
  }

  it('should pass with valid data', () => {
    const result = addProductSchema.safeParse({ body: validBody })
    expect(result.success).toBe(true)
  })

  it('should fail when name is missing', () => {
    const { name, ...bodyWithoutName } = validBody
    const result = addProductSchema.safeParse({ body: bodyWithoutName })
    expect(result.success).toBe(false)
  })

  it('should fail when price is negative', () => {
    const result = addProductSchema.safeParse({ body: { ...validBody, price: -1 } })
    expect(result.success).toBe(false)
  })

  it('should fail when quantity is negative', () => {
    const result = addProductSchema.safeParse({ body: { ...validBody, quantity: -1 } })
    expect(result.success).toBe(false)
  })

  it('should fail when quantity is not an integer', () => {
    const result = addProductSchema.safeParse({ body: { ...validBody, quantity: 1.5 } })
    expect(result.success).toBe(false)
  })

  it('should fail when category ID is invalid', () => {
    const result = addProductSchema.safeParse({ body: { ...validBody, category: 'invalid-id' } })
    expect(result.success).toBe(false)
  })

  it('should fail when image is missing', () => {
    const { image, ...bodyWithoutImage } = validBody
    const result = addProductSchema.safeParse({ body: bodyWithoutImage })
    expect(result.success).toBe(false)
  })
})

describe('updateProductSchema', () => {
  it('should pass with empty body (all fields optional)', () => {
    const result = updateProductSchema.safeParse({ body: {} })
    expect(result.success).toBe(true)
  })

  it('should pass with partial update', () => {
    const result = updateProductSchema.safeParse({ body: { name: 'Updated Name', price: 200 } })
    expect(result.success).toBe(true)
  })
})

describe('getProductsSchema', () => {
  it('should pass with valid query', () => {
    const result = getProductsSchema.safeParse({
      query: { page: 1, limit: 10, sort_by: 'price', order: 'asc', category: VALID_ID },
    })
    expect(result.success).toBe(true)
  })

  it('should fail when page is 0', () => {
    const result = getProductsSchema.safeParse({ query: { page: 0 } })
    expect(result.success).toBe(false)
  })

  it('should fail when limit is 0', () => {
    const result = getProductsSchema.safeParse({ query: { limit: 0 } })
    expect(result.success).toBe(false)
  })

  it('should fail when limit exceeds 100', () => {
    const result = getProductsSchema.safeParse({ query: { limit: 101 } })
    expect(result.success).toBe(false)
  })

  it('should fail when category is invalid', () => {
    const result = getProductsSchema.safeParse({ query: { category: 'invalid-id' } })
    expect(result.success).toBe(false)
  })

  it('should fail when rating_filter is 0', () => {
    const result = getProductsSchema.safeParse({ query: { rating_filter: 0 } })
    expect(result.success).toBe(false)
  })

  it('should fail when rating_filter exceeds 5', () => {
    const result = getProductsSchema.safeParse({ query: { rating_filter: 6 } })
    expect(result.success).toBe(false)
  })

  it('should use default for invalid sort_by (catch behavior)', () => {
    const result = getProductsSchema.safeParse({ query: { sort_by: 'invalid' } })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.query.sort_by).toBe('createdAt')
    }
  })

  it('should use default for invalid order (catch behavior)', () => {
    const result = getProductsSchema.safeParse({ query: { order: 'invalid' } })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.query.order).toBe('desc')
    }
  })
})

describe('productIdParamSchema', () => {
  it('should pass with valid MongoDB ID', () => {
    const result = productIdParamSchema.safeParse({ params: { product_id: VALID_ID } })
    expect(result.success).toBe(true)
  })

  it('should fail with invalid MongoDB ID', () => {
    const result = productIdParamSchema.safeParse({ params: { product_id: 'invalid-id' } })
    expect(result.success).toBe(false)
  })
})
