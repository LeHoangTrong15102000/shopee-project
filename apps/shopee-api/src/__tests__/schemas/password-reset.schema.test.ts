/// <reference types="jest" />
import { forgotPasswordSchema, resetPasswordSchema } from '@schemas/password-reset.schema'

describe('Password Reset Schemas', () => {
  describe('forgotPasswordSchema', () => {
    it('should accept valid email', () => {
      expect(forgotPasswordSchema.safeParse({ body: { email: 'user@example.com' } }).success).toBe(
        true,
      )
    })
    it('should reject invalid email', () => {
      expect(forgotPasswordSchema.safeParse({ body: { email: 'invalid' } }).success).toBe(false)
    })
    it('should reject missing email', () => {
      expect(forgotPasswordSchema.safeParse({ body: {} }).success).toBe(false)
    })
  })

  describe('resetPasswordSchema', () => {
    it('should accept valid input', () => {
      expect(
        resetPasswordSchema.safeParse({
          body: { token: 'valid-token', password: 'newPass123!', confirm_password: 'newPass123!' },
        }).success,
      ).toBe(true)
    })
    it('should reject mismatched passwords', () => {
      expect(
        resetPasswordSchema.safeParse({
          body: { token: 'valid-token', password: 'newPass123!', confirm_password: 'different' },
        }).success,
      ).toBe(false)
    })
    it('should reject short password', () => {
      expect(
        resetPasswordSchema.safeParse({
          body: { token: 'valid-token', password: '12345', confirm_password: '12345' },
        }).success,
      ).toBe(false)
    })
    it('should reject empty token', () => {
      expect(
        resetPasswordSchema.safeParse({
          body: { token: '', password: 'newPass123!', confirm_password: 'newPass123!' },
        }).success,
      ).toBe(false)
    })
  })
})
