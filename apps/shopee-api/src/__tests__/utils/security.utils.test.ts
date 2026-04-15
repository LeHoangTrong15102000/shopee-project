/// <reference types="jest" />

import {
  generateSecureToken,
  maskEmail,
  maskIP,
  isValidPassword,
  isValidPasswordSimple,
  generateSessionId,
  sanitizeInput,
} from '../../utils/security.utils'

describe('security.utils', () => {
  describe('maskEmail', () => {
    it('should mask normal email correctly', () => {
      expect(maskEmail('example@gmail.com')).toBe('e*****e@gmail.com')
    })

    it('should mask short local part (<=2 chars)', () => {
      expect(maskEmail('ab@gmail.com')).toBe('a***@gmail.com')
    })

    it('should return *** for invalid email without @', () => {
      expect(maskEmail('invalidemail')).toBe('***')
    })

    it('should return *** for empty or null input', () => {
      expect(maskEmail('')).toBe('***')
      expect(maskEmail(null as unknown as string)).toBe('***')
    })
  })

  describe('maskIP', () => {
    it('should mask IPv4 address correctly', () => {
      expect(maskIP('192.168.1.100')).toBe('192.168.xxx.xxx')
    })

    it('should mask IPv6 address correctly', () => {
      expect(maskIP('2001:0db8:85a3::8a2e:0370:7334')).toBe(
        '2001:0db8:xxxx:xxxx:xxxx:xxxx:xxxx:xxxx',
      )
    })

    it('should return xxx.xxx.xxx.xxx for invalid IP', () => {
      expect(maskIP('invalid')).toBe('xxx.xxx.xxx.xxx')
    })

    it('should return xxx.xxx.xxx.xxx for empty or null input', () => {
      expect(maskIP('')).toBe('xxx.xxx.xxx.xxx')
      expect(maskIP(null as unknown as string)).toBe('xxx.xxx.xxx.xxx')
    })
  })

  describe('isValidPassword', () => {
    it('should return valid for strong password', () => {
      const result = isValidPassword('Test@123')
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should return error for too short password', () => {
      const result = isValidPassword('Te@1')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password phải có ít nhất 8 ký tự')
    })

    it('should return error for password without uppercase', () => {
      const result = isValidPassword('test@123')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password phải có ít nhất 1 chữ hoa')
    })

    it('should return error for password without special char', () => {
      const result = isValidPassword('Test1234')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password phải có ít nhất 1 ký tự đặc biệt')
    })

    it('should return error for password with spaces', () => {
      const result = isValidPassword('Test @123')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password không được chứa khoảng trắng')
    })
  })

  describe('isValidPasswordSimple', () => {
    it('should return true for valid password (>= 6 chars)', () => {
      expect(isValidPasswordSimple('123456')).toBe(true)
    })

    it('should return false for too short password', () => {
      expect(isValidPasswordSimple('12345')).toBe(false)
    })

    it('should return false for empty password', () => {
      expect(isValidPasswordSimple('')).toBe(false)
    })
  })

  describe('sanitizeInput', () => {
    it('should replace XSS characters', () => {
      expect(sanitizeInput('<script>')).toBe('&lt;script&gt;')
    })

    it('should return empty string for empty or null input', () => {
      expect(sanitizeInput('')).toBe('')
      expect(sanitizeInput(null as unknown as string)).toBe('')
    })
  })

  describe('generateSecureToken', () => {
    it('should return hex string of correct length (default 64 chars for 32 bytes)', () => {
      const token = generateSecureToken()
      expect(token).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should return hex string of specified length', () => {
      const token = generateSecureToken(16)
      expect(token).toMatch(/^[a-f0-9]{32}$/)
    })
  })

  describe('generateSessionId', () => {
    it('should return UUID format string', () => {
      const sessionId = generateSessionId()
      expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    })
  })
})
