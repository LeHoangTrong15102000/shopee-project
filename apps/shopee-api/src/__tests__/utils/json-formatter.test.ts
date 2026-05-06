/// <reference types="jest" />

import { JsonFormatter } from '@utils/logger/json-formatter'

describe('JsonFormatter', () => {
  let formatter: JsonFormatter

  beforeEach(() => {
    formatter = new JsonFormatter()
  })

  describe('output shape', () => {
    it('produces valid single-line JSON', () => {
      const output = formatter.format('info', 'API', 'test message')
      expect(() => JSON.parse(output)).not.toThrow()
      expect(output).not.toContain('\n')
    })

    it('contains required fields: timestamp, level, category, message', () => {
      const output = formatter.format('info', 'API', 'test message')
      const parsed = JSON.parse(output)
      expect(parsed).toHaveProperty('timestamp')
      expect(parsed).toHaveProperty('level', 'info')
      expect(parsed).toHaveProperty('category', 'API')
      expect(parsed).toHaveProperty('message', 'test message')
    })

    it('timestamp is ISO 8601 format', () => {
      const output = formatter.format('info', 'API', 'test message')
      const parsed = JSON.parse(output)
      expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('does not include requestId when not in meta', () => {
      const output = formatter.format('info', 'API', 'test message')
      const parsed = JSON.parse(output)
      expect(parsed).not.toHaveProperty('requestId')
    })
  })

  describe('meta fields', () => {
    it('includes meta fields when provided', () => {
      const output = formatter.format('info', 'API', 'test message', { userId: 'u1', action: 'login' })
      const parsed = JSON.parse(output)
      expect(parsed).toHaveProperty('userId', 'u1')
      expect(parsed).toHaveProperty('action', 'login')
    })

    it('includes requestId from meta', () => {
      const output = formatter.format('info', 'API', 'test message', { requestId: 'req-123' })
      const parsed = JSON.parse(output)
      expect(parsed).toHaveProperty('requestId', 'req-123')
    })

    it('handles empty meta object (no extra fields)', () => {
      const output = formatter.format('info', 'API', 'test message', {})
      const parsed = JSON.parse(output)
      expect(Object.keys(parsed)).toEqual(['timestamp', 'level', 'category', 'message'])
    })
  })

  describe('sensitive field redaction', () => {
    it('redacts password field', () => {
      const output = formatter.format('info', 'API', 'login', { password: 'secret123' })
      const parsed = JSON.parse(output)
      expect(parsed.password).toBe('[REDACTED]')
    })

    it('redacts token field', () => {
      const output = formatter.format('info', 'API', 'auth', { token: 'abc.def.ghi' })
      const parsed = JSON.parse(output)
      expect(parsed.token).toBe('[REDACTED]')
    })

    it('redacts secret field', () => {
      const output = formatter.format('info', 'API', 'config', { secret: 'my-secret' })
      const parsed = JSON.parse(output)
      expect(parsed.secret).toBe('[REDACTED]')
    })

    it('redacts apiKey field', () => {
      const output = formatter.format('info', 'API', 'request', { apiKey: 'key-123' })
      const parsed = JSON.parse(output)
      expect(parsed.apiKey).toBe('[REDACTED]')
    })

    it('redacts creditCard field', () => {
      const output = formatter.format('info', 'API', 'payment', { creditCard: '4111111111111111' })
      const parsed = JSON.parse(output)
      expect(parsed.creditCard).toBe('[REDACTED]')
    })

    it('redacts cvv field', () => {
      const output = formatter.format('info', 'API', 'payment', { cvv: '123' })
      const parsed = JSON.parse(output)
      expect(parsed.cvv).toBe('[REDACTED]')
    })

    it('redacts ssn field', () => {
      const output = formatter.format('info', 'API', 'user', { ssn: '123-45-6789' })
      const parsed = JSON.parse(output)
      expect(parsed.ssn).toBe('[REDACTED]')
    })

    it('redacts nested sensitive fields recursively', () => {
      const output = formatter.format('info', 'API', 'nested', {
        user: { name: 'Alice', password: 'hunter2' },
      })
      const parsed = JSON.parse(output)
      expect(parsed.user.name).toBe('Alice')
      expect(parsed.user.password).toBe('[REDACTED]')
    })

    it('does not redact non-sensitive fields', () => {
      const output = formatter.format('info', 'API', 'test', { userId: 'u1', email: 'a@b.com' })
      const parsed = JSON.parse(output)
      expect(parsed.userId).toBe('u1')
      expect(parsed.email).toBe('a@b.com')
    })
  })

  describe('Error serialization', () => {
    it('serializes Error objects with name, message, stack', () => {
      const err = new Error('something went wrong')
      const output = formatter.format('error', 'API', 'error occurred', { err })
      const parsed = JSON.parse(output)
      expect(parsed.err).toHaveProperty('name', 'Error')
      expect(parsed.err).toHaveProperty('message', 'something went wrong')
      expect(typeof parsed.err.stack).toBe('string')
    })

    it('handles Error passed directly as meta value', () => {
      const err = new TypeError('bad type')
      const output = formatter.format('error', 'API', 'type error', { error: err })
      const parsed = JSON.parse(output)
      expect(parsed.error.name).toBe('TypeError')
      expect(parsed.error.message).toBe('bad type')
    })

    it('handles custom Error subclass', () => {
      class CustomError extends Error {
        constructor(msg: string) {
          super(msg)
          this.name = 'CustomError'
        }
      }
      const err = new CustomError('custom problem')
      const output = formatter.format('error', 'API', 'custom error', { err })
      const parsed = JSON.parse(output)
      expect(parsed.err.name).toBe('CustomError')
      expect(parsed.err.message).toBe('custom problem')
    })
  })

  describe('non-serializable values', () => {
    it('falls back gracefully when JSON.stringify throws (e.g. BigInt value)', () => {
      // BigInt cannot be serialized by JSON.stringify — triggers the catch fallback
      const meta: Record<string, unknown> = { count: BigInt(42) }
      let output: string
      expect(() => {
        output = formatter.format('info', 'API', 'bigint test', meta)
      }).not.toThrow()
      const parsed = JSON.parse(output!)
      expect(parsed).toHaveProperty('timestamp')
      expect(parsed).toHaveProperty('level', 'info')
      expect(parsed).toHaveProperty('category', 'API')
      expect(parsed).toHaveProperty('message', 'bigint test')
    })
  })

  describe('log levels', () => {
    it('preserves error level in output', () => {
      const output = formatter.format('error', 'API', 'err msg')
      expect(JSON.parse(output).level).toBe('error')
    })

    it('preserves warn level in output', () => {
      const output = formatter.format('warn', 'API', 'warn msg')
      expect(JSON.parse(output).level).toBe('warn')
    })

    it('preserves debug level in output', () => {
      const output = formatter.format('debug', 'API', 'debug msg')
      expect(JSON.parse(output).level).toBe('debug')
    })
  })
})
