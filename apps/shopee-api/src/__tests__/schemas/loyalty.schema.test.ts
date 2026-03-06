/// <reference types="jest" />
import { getPointsSchema, getTransactionsSchema, getRewardsSchema, redeemPointsSchema } from '@schemas/loyalty.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('getPointsSchema', () => {
  it('should pass with empty object', () => {
    const result = getPointsSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})

describe('getTransactionsSchema', () => {
  it('should pass with valid query', () => {
    const result = getTransactionsSchema.safeParse({ query: { page: 1, limit: 10, type: 'earn' } })
    expect(result.success).toBe(true)
  })

  it('should fail when page is 0', () => {
    const result = getTransactionsSchema.safeParse({ query: { page: 0 } })
    expect(result.success).toBe(false)
  })

  it('should fail when limit is 0', () => {
    const result = getTransactionsSchema.safeParse({ query: { limit: 0 } })
    expect(result.success).toBe(false)
  })

  it('should fail when limit is 51', () => {
    const result = getTransactionsSchema.safeParse({ query: { limit: 51 } })
    expect(result.success).toBe(false)
  })

  it('should pass with valid type earn', () => {
    const result = getTransactionsSchema.safeParse({ query: { type: 'earn' } })
    expect(result.success).toBe(true)
  })

  it('should catch invalid type and replace with default', () => {
    const result = getTransactionsSchema.safeParse({ query: { type: 'invalid_type' } })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.query.type).toBe('earn')
    }
  })
})

describe('getRewardsSchema', () => {
  it('should pass with valid query', () => {
    const result = getRewardsSchema.safeParse({ query: { page: 1, limit: 10 } })
    expect(result.success).toBe(true)
  })

  it('should pass with valid reward_type gift', () => {
    const result = getRewardsSchema.safeParse({ query: { reward_type: 'gift' } })
    expect(result.success).toBe(true)
  })

  it('should fail when limit is 51', () => {
    const result = getRewardsSchema.safeParse({ query: { limit: 51 } })
    expect(result.success).toBe(false)
  })
})

describe('redeemPointsSchema', () => {
  it('should pass with valid rewardId', () => {
    const result = redeemPointsSchema.safeParse({ params: { rewardId: VALID_ID } })
    expect(result.success).toBe(true)
  })

  it('should fail with invalid rewardId', () => {
    const result = redeemPointsSchema.safeParse({ params: { rewardId: 'invalid' } })
    expect(result.success).toBe(false)
  })
})

