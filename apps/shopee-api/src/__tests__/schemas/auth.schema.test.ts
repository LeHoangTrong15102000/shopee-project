/// <reference types="jest" />
import { registerSchema, loginSchema } from '@schemas/auth.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('Auth Schemas', () => {
  describe('registerSchema', () => {
    const validInput = { body: { email: 'test@example.com', password: 'password123' } }

    it('should pass with valid input', () => {
      const result = registerSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should fail when email is missing', () => {
      const result = registerSchema.safeParse({ body: { password: 'password123' } })
      expect(result.success).toBe(false)
    })

    it('should fail when password is missing', () => {
      const result = registerSchema.safeParse({ body: { email: 'test@example.com' } })
      expect(result.success).toBe(false)
    })

    it('should fail when password is empty', () => {
      const result = registerSchema.safeParse({ body: { email: 'test@example.com', password: '' } })
      expect(result.success).toBe(false)
    })

    it('should fail when password is too short (<6 chars)', () => {
      const result = registerSchema.safeParse({ body: { email: 'test@example.com', password: '12345' } })
      expect(result.success).toBe(false)
    })

    it('should fail when password is too long (>160 chars)', () => {
      const result = registerSchema.safeParse({ body: { email: 'test@example.com', password: 'a'.repeat(161) } })
      expect(result.success).toBe(false)
    })

    it('should fail with invalid email format', () => {
      const result = registerSchema.safeParse({ body: { email: 'invalid-email', password: 'password123' } })
      expect(result.success).toBe(false)
    })

    it('should fail when email is too short (<5 chars)', () => {
      const result = registerSchema.safeParse({ body: { email: 'a@b', password: 'password123' } })
      expect(result.success).toBe(false)
    })

    it('should fail when email is too long (>160 chars)', () => {
      const longEmail = 'a'.repeat(150) + '@example.com'
      const result = registerSchema.safeParse({ body: { email: longEmail, password: 'password123' } })
      expect(result.success).toBe(false)
    })

    it('should strip extra fields', () => {
      const result = registerSchema.safeParse({ body: { email: 'test@example.com', password: 'password123', extra: 'field' } })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.body).not.toHaveProperty('extra')
      }
    })
  })

  describe('loginSchema', () => {
    const validInput = { body: { email: 'test@example.com', password: 'password123' } }

    it('should pass with valid credentials', () => {
      const result = loginSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should fail when email is missing', () => {
      const result = loginSchema.safeParse({ body: { password: 'password123' } })
      expect(result.success).toBe(false)
    })

    it('should fail when password is missing', () => {
      const result = loginSchema.safeParse({ body: { email: 'test@example.com' } })
      expect(result.success).toBe(false)
    })

    it('should fail when password is too short', () => {
      const result = loginSchema.safeParse({ body: { email: 'test@example.com', password: '12345' } })
      expect(result.success).toBe(false)
    })

    it('should fail with invalid email format', () => {
      const result = loginSchema.safeParse({ body: { email: 'not-an-email', password: 'password123' } })
      expect(result.success).toBe(false)
    })
  })

  describe('Edge cases', () => {
    it('should fail SQL injection string in email field', () => {
      const result = registerSchema.safeParse({
        body: { email: "'; DROP TABLE users; --", password: 'password123' },
      })
      expect(result.success).toBe(false)
    })

    it('should pass with very long valid email (within 160 chars)', () => {
      const longEmail = 'a'.repeat(140) + '@test.com'
      const result = registerSchema.safeParse({ body: { email: longEmail, password: 'password123' } })
      expect(result.success).toBe(true)
    })
  })
})

