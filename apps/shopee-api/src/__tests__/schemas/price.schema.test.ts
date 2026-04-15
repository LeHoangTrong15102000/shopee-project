/// <reference types="jest" />
import { priceProductIdParamSchema } from '@schemas/price.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('priceProductIdParamSchema', () => {
  it('should pass with valid productId', () => {
    const result = priceProductIdParamSchema.safeParse({ params: { productId: VALID_ID } })
    expect(result.success).toBe(true)
  })

  it('should fail with invalid ID (short string)', () => {
    const result = priceProductIdParamSchema.safeParse({ params: { productId: 'abc' } })
    expect(result.success).toBe(false)
  })

  it('should fail when productId is missing', () => {
    const result = priceProductIdParamSchema.safeParse({ params: {} })
    expect(result.success).toBe(false)
  })

  it('should fail with non-hex string', () => {
    const result = priceProductIdParamSchema.safeParse({
      params: { productId: 'zzzzzzzzzzzzzzzzzzzzzzzz' },
    })
    expect(result.success).toBe(false)
  })
})
