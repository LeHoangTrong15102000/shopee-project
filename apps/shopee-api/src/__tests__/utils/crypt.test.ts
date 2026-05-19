/// <reference types="jest" />

import { hashValue, compareValue, hashToken, generateSecureToken } from '@utils/crypt'
import { createHash } from 'crypto'

describe('crypt utils', () => {
  describe('hashValue', () => {
    it('returns string in format $13$salt$hash with correct lengths', () => {
      const result = hashValue('password123')

      const parts = result.split('$').filter(Boolean)
      expect(parts).toHaveLength(3)
      expect(parts[0]).toBe('13')
      expect(parts[1]).toHaveLength(22)
      expect(parts[2]).toHaveLength(128)
      expect(parts[2]).toMatch(/^[a-f0-9]+$/)
    })
  })

  describe('compareValue', () => {
    it('returns true for correct password', () => {
      const password = 'mySecretPassword'
      const hash = hashValue(password)

      expect(compareValue(password, hash)).toBe(true)
    })

    it('returns false for wrong password', () => {
      const hash = hashValue('correctPassword')

      expect(compareValue('wrongPassword', hash)).toBe(false)
    })

    it('handles old SHA-256 hash format', () => {
      const plainText = 'legacyPassword'
      const oldHash = createHash('sha256').update(plainText).digest('hex')

      expect(compareValue(plainText, oldHash)).toBe(true)
      expect(compareValue('wrongPassword', oldHash)).toBe(false)
    })

    it('handles invalid/malformed hash gracefully', () => {
      expect(compareValue('password', '')).toBe(false)
      expect(compareValue('password', '$invalid$format')).toBe(false)
      expect(compareValue('password', '$12$short$hash')).toBe(false)
      expect(compareValue('password', 'notahash')).toBe(false)
    })
  })

  describe('hashToken', () => {
    it('returns 64-char hex string', () => {
      const result = hashToken('some-token-value')

      expect(result).toHaveLength(64)
      expect(result).toMatch(/^[a-f0-9]+$/)
    })
  })

  describe('generateSecureToken', () => {
    it('returns 64-char hex string by default', () => {
      const result = generateSecureToken()

      expect(result).toHaveLength(64)
      expect(result).toMatch(/^[a-f0-9]+$/)
    })

    it('returns correct length hex string for custom length', () => {
      const result16 = generateSecureToken(16)
      const result64 = generateSecureToken(64)

      expect(result16).toHaveLength(32)
      expect(result64).toHaveLength(128)
      expect(result16).toMatch(/^[a-f0-9]+$/)
      expect(result64).toMatch(/^[a-f0-9]+$/)
    })
  })
})
