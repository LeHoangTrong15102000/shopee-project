/**
 * Unit Tests for ENV validation schema (env.schema.ts)
 *
 * Tests:
 * 6.1 - Throws on missing JWT_SECRET, on JWT_SECRET shorter than 32 chars
 */

/// <reference types="jest" />

// We test the schema module directly — do NOT mock it.
// But we must NOT import config.ts (which calls validateEnv at module load).

// Spy on process.exit to prevent actual exits during tests.
const mockExit = jest.spyOn(process, 'exit').mockImplementation((_code?: number | string | null) => {
  throw new Error(`process.exit called with code ${_code}`)
})
// Silence stderr during tests
const mockStderr = jest.spyOn(process.stderr, 'write').mockImplementation(() => true)

// Import validateEnv directly (not config.ts) to avoid side effects
import { validateEnv } from '@constants/env.schema'

afterAll(() => {
  mockExit.mockRestore()
  mockStderr.mockRestore()
})

describe('ENV validation schema', () => {
  describe('JWT_SECRET validation', () => {
    it('should throw (exit) when SECRET_KEY_JWT is missing', () => {
      const env: any = {
        MONGO_URI: 'mongodb://localhost:27017/test',
        // SECRET_KEY_JWT omitted
      }
      expect(() => validateEnv(env)).toThrow('process.exit called with code 1')
    })

    it('should throw (exit) when SECRET_KEY_JWT is shorter than 32 characters', () => {
      const env: any = {
        MONGO_URI: 'mongodb://localhost:27017/test',
        SECRET_KEY_JWT: 'too_short', // less than 32 chars
      }
      expect(() => validateEnv(env)).toThrow('process.exit called with code 1')
    })

    it('should throw (exit) when MONGO_URI is missing', () => {
      const env: any = {
        SECRET_KEY_JWT: 'a_valid_secret_that_is_exactly_32_chars_long',
        // MONGO_URI omitted
      }
      expect(() => validateEnv(env)).toThrow('process.exit called with code 1')
    })

    it('should succeed when all required vars are valid', () => {
      const env: any = {
        SECRET_KEY_JWT: 'a_valid_secret_that_is_exactly_32_chars_long',
        MONGO_URI: 'mongodb://localhost:27017/test',
        STRIPE_SECRET_KEY: 'sk_test_placeholder',
        STRIPE_PUBLISHABLE_KEY: 'pk_test_placeholder',
        STRIPE_WEBHOOK_SECRET: 'whsec_placeholder',
        TWO_FACTOR_ENCRYPTION_KEY: '0'.repeat(64),
      }
      const result = validateEnv(env)
      expect(result.SECRET_KEY_JWT).toBe('a_valid_secret_that_is_exactly_32_chars_long')
      expect(result.MONGO_URI).toBe('mongodb://localhost:27017/test')
      expect(result.JWT_ACCESS_TTL).toBe(900) // default
      expect(result.JWT_REFRESH_TTL).toBe(2_592_000) // default
    })

    it('should apply env-provided JWT_ACCESS_TTL and JWT_REFRESH_TTL', () => {
      const env: any = {
        SECRET_KEY_JWT: 'a_valid_secret_that_is_exactly_32_chars_long',
        MONGO_URI: 'mongodb://localhost:27017/test',
        STRIPE_SECRET_KEY: 'sk_test_placeholder',
        STRIPE_PUBLISHABLE_KEY: 'pk_test_placeholder',
        STRIPE_WEBHOOK_SECRET: 'whsec_placeholder',
        TWO_FACTOR_ENCRYPTION_KEY: '0'.repeat(64),
        JWT_ACCESS_TTL: '1800',
        JWT_REFRESH_TTL: '86400',
      }
      const result = validateEnv(env)
      expect(result.JWT_ACCESS_TTL).toBe(1800)
      expect(result.JWT_REFRESH_TTL).toBe(86400)
    })

    it('should write ALL validation errors to stderr (not just first)', () => {
      const env: any = {} // missing everything
      try {
        validateEnv(env)
      } catch {
        // expected
      }
      // stderr should have been called with a message listing multiple fields
      const stderrOutput = (mockStderr.mock.calls[0]?.[0] as string) || ''
      expect(stderrOutput).toContain('SECRET_KEY_JWT')
      expect(stderrOutput).toContain('MONGO_URI')
    })

    it('should parse AUTH_STRICT_MODE string to boolean', () => {
      const requiredFields = {
        SECRET_KEY_JWT: 'a_valid_secret_that_is_exactly_32_chars_long',
        MONGO_URI: 'mongodb://localhost:27017/test',
        STRIPE_SECRET_KEY: 'sk_test_placeholder',
        STRIPE_PUBLISHABLE_KEY: 'pk_test_placeholder',
        STRIPE_WEBHOOK_SECRET: 'whsec_placeholder',
        TWO_FACTOR_ENCRYPTION_KEY: '0'.repeat(64),
      }
      const envTrue: any = {
        ...requiredFields,
        AUTH_STRICT_MODE: 'true',
      }
      expect(validateEnv(envTrue).AUTH_STRICT_MODE).toBe(true)

      const envFalse: any = {
        ...requiredFields,
        AUTH_STRICT_MODE: 'false',
      }
      expect(validateEnv(envFalse).AUTH_STRICT_MODE).toBe(false)
    })
  })
})
