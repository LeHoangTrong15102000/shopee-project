/// <reference types="jest" />

/**
 * Unit Tests for totp.util.ts
 * Tests: encrypt/decrypt round-trip, backup code generation, backup code verification
 */

// Must mock config before importing totp.util (which reads config at module load)
jest.mock('@constants/config', () => ({
  config: {
    TWO_FACTOR_ENCRYPTION_KEY: '0'.repeat(64), // 32-byte key as 64-char hex
  },
}))

// Mock crypt utils to control hash/compare behavior in backup code tests
jest.mock('@utils/crypt', () => ({
  hashValue: jest.fn((value) => `hashed_${value}`),
  compareValue: jest.fn((value, hash) => hash === `hashed_${value}`),
}))

import {
  encryptSecret,
  decryptSecret,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
} from '@utils/totp.util'

describe('totp.util', () => {
  describe('encryptSecret / decryptSecret', () => {
    it('round-trips a TOTP secret correctly', () => {
      const original = 'JBSWY3DPEHPK3PXP'
      const encrypted = encryptSecret(original)
      const decrypted = decryptSecret(encrypted)

      expect(decrypted).toBe(original)
    })

    it('produces a different ciphertext on each call (random IV)', () => {
      const secret = 'JBSWY3DPEHPK3PXP'
      const enc1 = encryptSecret(secret)
      const enc2 = encryptSecret(secret)

      // Same plaintext but different IVs → different ciphertexts
      expect(enc1).not.toBe(enc2)
      // Both still decrypt to the same value
      expect(decryptSecret(enc1)).toBe(secret)
      expect(decryptSecret(enc2)).toBe(secret)
    })

    it('encrypted format is iv:authTag:ciphertext (3 colon-separated hex parts)', () => {
      const encrypted = encryptSecret('TESTSECRET')
      const parts = encrypted.split(':')

      expect(parts).toHaveLength(3)
      // IV is 12 bytes → 24 hex chars
      expect(parts[0]).toHaveLength(24)
      expect(parts[0]).toMatch(/^[0-9a-f]+$/i)
      // Auth tag is 16 bytes → 32 hex chars
      expect(parts[1]).toHaveLength(32)
      expect(parts[1]).toMatch(/^[0-9a-f]+$/i)
      // Ciphertext is non-empty hex
      expect(parts[2].length).toBeGreaterThan(0)
      expect(parts[2]).toMatch(/^[0-9a-f]+$/i)
    })

    it('throws a clear error when decrypting an invalid format', () => {
      expect(() => decryptSecret('notvalid')).toThrow(
        '2FA secret decryption failed — user may need to re-enroll 2FA',
      )
    })

    it('throws a clear error when decrypting tampered ciphertext', () => {
      const encrypted = encryptSecret('MYSECRET')
      const parts = encrypted.split(':')
      // Tamper the ciphertext part
      const tampered = `${parts[0]}:${parts[1]}:deadbeef`

      expect(() => decryptSecret(tampered)).toThrow(
        '2FA secret decryption failed — user may need to re-enroll 2FA',
      )
    })

    it('throws a clear error when decrypting with wrong number of parts', () => {
      expect(() => decryptSecret('only:two')).toThrow(
        '2FA secret decryption failed — user may need to re-enroll 2FA',
      )
    })
  })

  describe('generateBackupCodes', () => {
    it('generates exactly 10 codes', () => {
      const codes = generateBackupCodes()
      expect(codes).toHaveLength(10)
    })

    it('each code is exactly 8 characters', () => {
      const codes = generateBackupCodes()
      for (const code of codes) {
        expect(code).toHaveLength(8)
      }
    })

    it('each code contains only uppercase alphanumeric characters', () => {
      const codes = generateBackupCodes()
      for (const code of codes) {
        expect(code).toMatch(/^[A-Z0-9]{8}$/)
      }
    })

    it('generates different codes on each call', () => {
      const codes1 = generateBackupCodes()
      const codes2 = generateBackupCodes()
      // Extremely unlikely to be identical
      expect(codes1.join('')).not.toBe(codes2.join(''))
    })
  })

  describe('hashBackupCodes', () => {
    it('returns an array of the same length as input', () => {
      const codes = ['CODE1234', 'CODE5678', 'CODE9012']
      const hashed = hashBackupCodes(codes)
      expect(hashed).toHaveLength(3)
    })

    it('hashes each code using hashValue', () => {
      const codes = ['AAAAAAAA', 'BBBBBBBB']
      const hashed = hashBackupCodes(codes)
      expect(hashed[0]).toBe('hashed_AAAAAAAA')
      expect(hashed[1]).toBe('hashed_BBBBBBBB')
    })
  })

  describe('verifyBackupCode', () => {
    it('returns matched=true and correct index when code matches', () => {
      const hashes = ['hashed_AAAAAAAA', 'hashed_BBBBBBBB', 'hashed_CCCCCCCC']
      const result = verifyBackupCode('BBBBBBBB', hashes)

      expect(result.matched).toBe(true)
      expect(result.index).toBe(1)
    })

    it('returns matched=false and index=-1 when code does not match', () => {
      const hashes = ['hashed_AAAAAAAA', 'hashed_BBBBBBBB']
      const result = verifyBackupCode('ZZZZZZZZ', hashes)

      expect(result.matched).toBe(false)
      expect(result.index).toBe(-1)
    })

    it('returns matched=false for empty hashes array', () => {
      const result = verifyBackupCode('AAAAAAAA', [])

      expect(result.matched).toBe(false)
      expect(result.index).toBe(-1)
    })

    it('matches the first occurrence when multiple hashes could match', () => {
      // Simulate duplicate hashes (edge case)
      const hashes = ['hashed_AAAAAAAA', 'hashed_AAAAAAAA', 'hashed_BBBBBBBB']
      const result = verifyBackupCode('AAAAAAAA', hashes)

      expect(result.matched).toBe(true)
      expect(result.index).toBe(0)
    })

    it('caller can remove the matched code to enforce single-use', () => {
      const hashes = ['hashed_AAAAAAAA', 'hashed_BBBBBBBB', 'hashed_CCCCCCCC']
      const result = verifyBackupCode('BBBBBBBB', hashes)

      // Simulate removal
      const remaining = [...hashes]
      remaining.splice(result.index, 1)

      expect(remaining).toEqual(['hashed_AAAAAAAA', 'hashed_CCCCCCCC'])

      // Code should no longer match after removal
      const secondAttempt = verifyBackupCode('BBBBBBBB', remaining)
      expect(secondAttempt.matched).toBe(false)
    })
  })
})
