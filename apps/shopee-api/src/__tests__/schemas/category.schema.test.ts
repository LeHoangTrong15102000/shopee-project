/// <reference types="jest" />
import { addCategorySchema, updateCategorySchema, getCategorySchema, categoryIdParamSchema } from '@schemas/category.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('addCategorySchema', () => {
  it('should pass with valid name', () => {
    const result = addCategorySchema.safeParse({ body: { name: 'Electronics' } })
    expect(result.success).toBe(true)
  })

  it('should fail when name is missing', () => {
    const result = addCategorySchema.safeParse({ body: {} })
    expect(result.success).toBe(false)
  })

  it('should fail when name is empty', () => {
    const result = addCategorySchema.safeParse({ body: { name: '' } })
    expect(result.success).toBe(false)
  })

  it('should fail when name exceeds 160 characters', () => {
    const result = addCategorySchema.safeParse({ body: { name: 'a'.repeat(161) } })
    expect(result.success).toBe(false)
  })
})

describe('updateCategorySchema', () => {
  it('should pass with valid name', () => {
    const result = updateCategorySchema.safeParse({ body: { name: 'Updated Category' } })
    expect(result.success).toBe(true)
  })

  it('should fail when name is missing', () => {
    const result = updateCategorySchema.safeParse({ body: {} })
    expect(result.success).toBe(false)
  })

  it('should fail when name is empty', () => {
    const result = updateCategorySchema.safeParse({ body: { name: '' } })
    expect(result.success).toBe(false)
  })

  it('should fail when name exceeds 160 characters', () => {
    const result = updateCategorySchema.safeParse({ body: { name: 'a'.repeat(161) } })
    expect(result.success).toBe(false)
  })
})

describe('getCategorySchema', () => {
  it('should pass with empty query', () => {
    const result = getCategorySchema.safeParse({ query: {} })
    expect(result.success).toBe(true)
  })

  it('should pass with valid exclude ID', () => {
    const result = getCategorySchema.safeParse({ query: { exclude: VALID_ID } })
    expect(result.success).toBe(true)
  })

  it('should pass with empty string exclude', () => {
    const result = getCategorySchema.safeParse({ query: { exclude: '' } })
    expect(result.success).toBe(true)
  })
})

describe('categoryIdParamSchema', () => {
  it('should pass with valid category_id', () => {
    const result = categoryIdParamSchema.safeParse({ params: { category_id: VALID_ID } })
    expect(result.success).toBe(true)
  })

  it('should fail with invalid category_id', () => {
    const result = categoryIdParamSchema.safeParse({ params: { category_id: 'invalid-id' } })
    expect(result.success).toBe(false)
  })

  it('should fail when category_id is missing', () => {
    const result = categoryIdParamSchema.safeParse({ params: {} })
    expect(result.success).toBe(false)
  })
})

