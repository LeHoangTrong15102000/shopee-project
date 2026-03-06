import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema, baseUserSchema, inputNumberSchema, baseSchema } from '../rules'

describe('loginSchema', () => {
  it('passes with valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '123456' })
    expect(result.success).toBe(true)
  })

  it('fails with empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: '123456' })
    expect(result.success).toBe(false)
  })

  it('fails with invalid email format', () => {
    const result = loginSchema.safeParse({ email: 'invalid', password: '123456' })
    expect(result.success).toBe(false)
  })

  it('fails with short password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '12345' })
    expect(result.success).toBe(false)
  })

  it('fails with empty password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '' })
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  it('passes with valid data and matching passwords', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: '123456',
      confirm_password: '123456'
    })
    expect(result.success).toBe(true)
  })

  it('fails with mismatched passwords', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: '123456',
      confirm_password: '654321'
    })
    expect(result.success).toBe(false)
  })

  it('fails with empty confirm_password', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: '123456',
      confirm_password: ''
    })
    expect(result.success).toBe(false)
  })
})

describe('baseUserSchema', () => {
  it('passes with valid optional fields', () => {
    const result = baseUserSchema.safeParse({
      name: 'Nguyễn Văn A',
      phone: '0901234567',
      address: 'Quận 1, HCM'
    })
    expect(result.success).toBe(true)
  })

  it('passes with empty object (all optional)', () => {
    const result = baseUserSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('fails with name exceeding 160 chars', () => {
    const result = baseUserSchema.safeParse({ name: 'a'.repeat(161) })
    expect(result.success).toBe(false)
  })

  it('fails with phone exceeding 20 chars', () => {
    const result = baseUserSchema.safeParse({ phone: '0'.repeat(21) })
    expect(result.success).toBe(false)
  })

  it('fails with future date_of_birth', () => {
    const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    const result = baseUserSchema.safeParse({ date_of_birth: futureDate })
    expect(result.success).toBe(false)
  })
})

describe('inputNumberSchema (priceSchema)', () => {
  it('fails when price_max < price_min', () => {
    const result = inputNumberSchema.safeParse({ price_min: '100', price_max: '50' })
    expect(result.success).toBe(false)
  })

  it('passes when price_min < price_max', () => {
    const result = inputNumberSchema.safeParse({ price_min: '50', price_max: '100' })
    expect(result.success).toBe(true)
  })

  it('fails when both are empty', () => {
    const result = inputNumberSchema.safeParse({ price_min: '', price_max: '' })
    expect(result.success).toBe(false)
  })
})

describe('baseSchema', () => {
  it('validates email field', () => {
    const emailOnly = baseSchema.pick({ email: true })
    expect(emailOnly.safeParse({ email: 'valid@email.com' }).success).toBe(true)
    expect(emailOnly.safeParse({ email: 'invalid' }).success).toBe(false)
  })

  it('validates password field', () => {
    const pwOnly = baseSchema.pick({ password: true })
    expect(pwOnly.safeParse({ password: '123456' }).success).toBe(true)
    expect(pwOnly.safeParse({ password: '12345' }).success).toBe(false)
  })
})
