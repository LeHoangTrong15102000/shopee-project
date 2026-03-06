/// <reference types="jest" />
import { getNotificationsSchema, markAsReadSchema } from '@schemas/notification.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('getNotificationsSchema', () => {
  it('should pass with valid data', () => {
    const result = getNotificationsSchema.safeParse({
      query: { page: 1, limit: 10 },
    })
    expect(result.success).toBe(true)
  })

  it('should fail when page is 0', () => {
    const result = getNotificationsSchema.safeParse({
      query: { page: 0 },
    })
    expect(result.success).toBe(false)
  })

  it('should fail when limit is 0', () => {
    const result = getNotificationsSchema.safeParse({
      query: { limit: 0 },
    })
    expect(result.success).toBe(false)
  })

  it('should fail when limit is 51', () => {
    const result = getNotificationsSchema.safeParse({
      query: { limit: 51 },
    })
    expect(result.success).toBe(false)
  })

  it('should pass with valid type order', () => {
    const result = getNotificationsSchema.safeParse({
      query: { type: 'order' },
    })
    expect(result.success).toBe(true)
  })

  it('should pass with valid is_read true', () => {
    const result = getNotificationsSchema.safeParse({
      query: { is_read: 'true' },
    })
    expect(result.success).toBe(true)
  })

  it('should fail with invalid is_read value', () => {
    const result = getNotificationsSchema.safeParse({
      query: { is_read: 'invalid' },
    })
    expect(result.success).toBe(false)
  })
})

describe('markAsReadSchema', () => {
  it('should pass with valid ID', () => {
    const result = markAsReadSchema.safeParse({
      params: { id: VALID_ID },
    })
    expect(result.success).toBe(true)
  })

  it('should fail with invalid ID', () => {
    const result = markAsReadSchema.safeParse({
      params: { id: 'invalid' },
    })
    expect(result.success).toBe(false)
  })
})

