/// <reference types="jest" />

/**
 * Unit Tests for session.util.ts
 * Tests: JTI hashing determinism, user agent parsing (mobile/desktop/unknown)
 */

import { hashJti, parseUserAgent } from '@utils/session.util'

describe('session.util', () => {
  describe('hashJti', () => {
    it('returns a 64-character hex string (SHA-256)', () => {
      const result = hashJti('some-jti-value')

      expect(result).toHaveLength(64)
      expect(result).toMatch(/^[a-f0-9]+$/)
    })

    it('is deterministic — same input always produces same hash', () => {
      const jti = 'abc123-uuid-value'
      const hash1 = hashJti(jti)
      const hash2 = hashJti(jti)

      expect(hash1).toBe(hash2)
    })

    it('produces different hashes for different JTIs', () => {
      const hash1 = hashJti('jti-one')
      const hash2 = hashJti('jti-two')

      expect(hash1).not.toBe(hash2)
    })

    it('handles empty string input', () => {
      const result = hashJti('')

      expect(result).toHaveLength(64)
      expect(result).toMatch(/^[a-f0-9]+$/)
    })
  })

  describe('parseUserAgent', () => {
    it('returns Unknown for empty string', () => {
      const result = parseUserAgent('')

      expect(result).toEqual({ browser: 'Unknown', os: 'Unknown', device: 'Unknown' })
    })

    it('returns Unknown for whitespace-only string', () => {
      const result = parseUserAgent('   ')

      expect(result).toEqual({ browser: 'Unknown', os: 'Unknown', device: 'Unknown' })
    })

    it('parses a Chrome on Windows 10 desktop UA', () => {
      const ua =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      const result = parseUserAgent(ua)

      expect(result.browser).toBe('Chrome')
      expect(result.os).toBe('Windows 10')
      expect(result.device).toBe('Desktop')
    })

    it('parses a Firefox on macOS desktop UA', () => {
      const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/109.0'
      const result = parseUserAgent(ua)

      expect(result.browser).toBe('Firefox')
      expect(result.os).toBe('macOS')
      expect(result.device).toBe('Desktop')
    })

    it('parses a Safari on iOS mobile UA', () => {
      const ua =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
      const result = parseUserAgent(ua)

      expect(result.browser).toBe('Safari')
      expect(result.os).toBe('iOS')
      expect(result.device).toBe('Mobile')
    })

    it('parses a Chrome on Android mobile UA', () => {
      const ua =
        'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36'
      const result = parseUserAgent(ua)

      expect(result.browser).toBe('Chrome')
      expect(result.os).toBe('Android')
      expect(result.device).toBe('Mobile')
    })

    it('parses Edge browser UA', () => {
      const ua =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
      const result = parseUserAgent(ua)

      expect(result.browser).toBe('Edge')
      expect(result.os).toBe('Windows 10')
      expect(result.device).toBe('Desktop')
    })

    it('parses Postman UA', () => {
      const ua = 'PostmanRuntime/7.36.0'
      const result = parseUserAgent(ua)

      expect(result.browser).toBe('Postman')
    })

    it('parses curl UA', () => {
      const ua = 'curl/7.88.1'
      const result = parseUserAgent(ua)

      expect(result.browser).toBe('curl')
    })

    it('detects tablet device type', () => {
      const ua =
        'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
      const result = parseUserAgent(ua)

      expect(result.device).toBe('Tablet')
    })

    it('detects bot device type', () => {
      const ua = 'Googlebot/2.1 (+http://www.google.com/bot.html)'
      const result = parseUserAgent(ua)

      expect(result.device).toBe('Bot')
    })

    it('returns Unknown browser for unrecognized UA', () => {
      const ua = 'SomeUnknownClient/1.0'
      const result = parseUserAgent(ua)

      expect(result.browser).toBe('Unknown')
    })

    it('parses Linux desktop UA', () => {
      const ua =
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      const result = parseUserAgent(ua)

      expect(result.os).toBe('Linux')
      expect(result.browser).toBe('Chrome')
      expect(result.device).toBe('Desktop')
    })
  })
})
