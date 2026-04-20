/// <reference types="jest" />

// cors.config.ts imports isProduction from @utils/helper — mock it before importing the module
jest.mock('@utils/helper', () => ({
  isProduction: false,
}))

import { ALLOWED_ORIGINS, checkOriginWhitelist, corsOptions } from '@constants/cors.config'

describe('cors.config constants', () => {
  describe('ALLOWED_ORIGINS (non-production)', () => {
    it('should be an array', () => {
      expect(Array.isArray(ALLOWED_ORIGINS)).toBe(true)
    })

    it('should include localhost origins', () => {
      expect(ALLOWED_ORIGINS).toContain('http://localhost:3000')
      expect(ALLOWED_ORIGINS).toContain('http://localhost:5173')
    })

    it('should include production origins when combined in dev mode', () => {
      expect(ALLOWED_ORIGINS).toContain('https://shopee-clone.com')
    })
  })

  describe('checkOriginWhitelist', () => {
    it('should allow requests with no origin (e.g. Postman, curl)', () => {
      const callback = jest.fn()
      checkOriginWhitelist(undefined, callback)
      expect(callback).toHaveBeenCalledWith(null, true)
    })

    it('should allow a whitelisted origin', () => {
      const callback = jest.fn()
      checkOriginWhitelist('http://localhost:3000', callback)
      expect(callback).toHaveBeenCalledWith(null, true)
    })

    it('should allow http://localhost:5173', () => {
      const callback = jest.fn()
      checkOriginWhitelist('http://localhost:5173', callback)
      expect(callback).toHaveBeenCalledWith(null, true)
    })

    it('should allow http://127.0.0.1:3000', () => {
      const callback = jest.fn()
      checkOriginWhitelist('http://127.0.0.1:3000', callback)
      expect(callback).toHaveBeenCalledWith(null, true)
    })

    it('should reject an origin not in the whitelist', () => {
      const callback = jest.fn()
      checkOriginWhitelist('https://evil.com', callback)
      expect(callback).toHaveBeenCalledWith(expect.any(Error))
    })

    it('should include the disallowed origin in the error message', () => {
      const callback = jest.fn()
      checkOriginWhitelist('https://not-allowed.com', callback)
      const error: Error = callback.mock.calls[0][0]
      expect(error.message).toContain('https://not-allowed.com')
    })
  })

  describe('corsOptions', () => {
    it('should export a cors options object', () => {
      expect(corsOptions).toBeDefined()
      expect(typeof corsOptions).toBe('object')
    })

    it('should have credentials enabled', () => {
      expect(corsOptions.credentials).toBe(true)
    })

    it('should include standard HTTP methods', () => {
      expect(corsOptions.methods).toContain('GET')
      expect(corsOptions.methods).toContain('POST')
      expect(corsOptions.methods).toContain('PUT')
      expect(corsOptions.methods).toContain('DELETE')
    })

    it('should allow Content-Type and Authorization headers', () => {
      const allowed = corsOptions.allowedHeaders as string[]
      expect(allowed).toContain('Content-Type')
      expect(allowed).toContain('Authorization')
    })

    it('should set a positive maxAge', () => {
      expect(corsOptions.maxAge).toBeGreaterThan(0)
    })

    it('should expose Content-Range header', () => {
      const exposed = corsOptions.exposedHeaders as string[]
      expect(exposed).toContain('Content-Range')
    })
  })
})
