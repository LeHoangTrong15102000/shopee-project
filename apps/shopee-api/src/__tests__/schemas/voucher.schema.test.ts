/// <reference types="jest" />
import {
  getVouchersSchema,
  getVoucherByCodeSchema,
  applyVoucherSchema,
  saveVoucherSchema,
  getAvailableVouchersSchema,
  getMyVouchersSchema,
  collectVoucherSchema,
  validateVoucherSchema,
} from '@schemas/voucher.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('applyVoucherSchema', () => {
  it('should pass with valid data', () => {
    const result = applyVoucherSchema.safeParse({
      body: { code: 'DISCOUNT10', order_value: 100, product_ids: [VALID_ID] },
    })
    expect(result.success).toBe(true)
  })

  it('should fail when code is missing', () => {
    const result = applyVoucherSchema.safeParse({ body: { order_value: 100 } })
    expect(result.success).toBe(false)
  })

  it('should fail when code is empty', () => {
    const result = applyVoucherSchema.safeParse({ body: { code: '', order_value: 100 } })
    expect(result.success).toBe(false)
  })

  it('should fail when order_value is negative', () => {
    const result = applyVoucherSchema.safeParse({ body: { code: 'CODE', order_value: -1 } })
    expect(result.success).toBe(false)
  })

  it('should fail when product_ids contains invalid ID', () => {
    const result = applyVoucherSchema.safeParse({
      body: { code: 'CODE', order_value: 100, product_ids: ['invalid'] },
    })
    expect(result.success).toBe(false)
  })
})

describe('validateVoucherSchema', () => {
  it('should pass with valid data', () => {
    const result = validateVoucherSchema.safeParse({ body: { code: 'CODE', order_total: 50 } })
    expect(result.success).toBe(true)
  })

  it('should fail when code is missing', () => {
    const result = validateVoucherSchema.safeParse({ body: { order_total: 50 } })
    expect(result.success).toBe(false)
  })

  it('should fail when order_total is negative', () => {
    const result = validateVoucherSchema.safeParse({ body: { code: 'CODE', order_total: -1 } })
    expect(result.success).toBe(false)
  })
})

describe('getVouchersSchema', () => {
  it('should pass with valid query', () => {
    const result = getVouchersSchema.safeParse({ query: { page: 1, limit: 10 } })
    expect(result.success).toBe(true)
  })

  it('should fail when page is 0', () => {
    const result = getVouchersSchema.safeParse({ query: { page: 0 } })
    expect(result.success).toBe(false)
  })

  it('should fail when limit exceeds 50', () => {
    const result = getVouchersSchema.safeParse({ query: { limit: 51 } })
    expect(result.success).toBe(false)
  })
})

describe('getAvailableVouchersSchema', () => {
  it('should pass with valid discount_type', () => {
    const result = getAvailableVouchersSchema.safeParse({ query: { discount_type: 'percentage' } })
    expect(result.success).toBe(true)
  })

  it('should fail with invalid discount_type', () => {
    const result = getAvailableVouchersSchema.safeParse({ query: { discount_type: 'invalid' } })
    expect(result.success).toBe(false)
  })
})

describe('getMyVouchersSchema', () => {
  it('should pass with valid status', () => {
    const result = getMyVouchersSchema.safeParse({ query: { status: 'available' } })
    expect(result.success).toBe(true)
  })
})

describe('saveVoucherSchema', () => {
  it('should pass with valid ID', () => {
    const result = saveVoucherSchema.safeParse({ params: { id: VALID_ID } })
    expect(result.success).toBe(true)
  })

  it('should fail with invalid ID', () => {
    const result = saveVoucherSchema.safeParse({ params: { id: 'invalid' } })
    expect(result.success).toBe(false)
  })
})

describe('collectVoucherSchema', () => {
  it('should pass with valid ID', () => {
    const result = collectVoucherSchema.safeParse({ params: { id: VALID_ID } })
    expect(result.success).toBe(true)
  })

  it('should fail with invalid ID', () => {
    const result = collectVoucherSchema.safeParse({ params: { id: 'invalid' } })
    expect(result.success).toBe(false)
  })
})

describe('getVoucherByCodeSchema', () => {
  it('should pass with valid code', () => {
    const result = getVoucherByCodeSchema.safeParse({ params: { code: 'VOUCHER123' } })
    expect(result.success).toBe(true)
  })

  it('should fail when code is empty', () => {
    const result = getVoucherByCodeSchema.safeParse({ params: { code: '' } })
    expect(result.success).toBe(false)
  })
})
