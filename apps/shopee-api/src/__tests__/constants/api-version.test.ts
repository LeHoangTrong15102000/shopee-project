/// <reference types="jest" />

import {
  API_VERSION,
  API_PREFIX,
  SUPPORTED_VERSIONS,
  DEPRECATED_ENDPOINTS,
  getDeprecationInfo,
  getDeprecationHeaders,
  isVersionSupported,
  getLatestVersion,
} from '@constants/api-version'

describe('api-version constants', () => {
  describe('API_VERSION', () => {
    it('should export API_VERSION as v1', () => {
      expect(API_VERSION).toBe('v1')
    })
  })

  describe('API_PREFIX', () => {
    it('should export API_PREFIX as /api/v1', () => {
      expect(API_PREFIX).toBe('/api/v1')
    })
  })

  describe('SUPPORTED_VERSIONS', () => {
    it('should export SUPPORTED_VERSIONS array containing v1', () => {
      expect(SUPPORTED_VERSIONS).toContain('v1')
    })

    it('should be a readonly tuple', () => {
      expect(Array.isArray(SUPPORTED_VERSIONS)).toBe(true)
      expect(SUPPORTED_VERSIONS.length).toBeGreaterThan(0)
    })
  })

  describe('DEPRECATED_ENDPOINTS', () => {
    it('should export DEPRECATED_ENDPOINTS as an array', () => {
      expect(Array.isArray(DEPRECATED_ENDPOINTS)).toBe(true)
    })

    it('should be empty by default (no deprecated endpoints yet)', () => {
      expect(DEPRECATED_ENDPOINTS).toHaveLength(0)
    })
  })

  describe('getDeprecationInfo', () => {
    it('should return undefined when no deprecated endpoints exist', () => {
      const result = getDeprecationInfo('/api/products')
      expect(result).toBeUndefined()
    })

    it('should return undefined for any path when list is empty', () => {
      expect(getDeprecationInfo('/api/v1/users')).toBeUndefined()
      expect(getDeprecationInfo('')).toBeUndefined()
    })
  })

  describe('getDeprecationHeaders', () => {
    it('should return headers object with required fields', () => {
      const endpoint = {
        path: '/api/products',
        deprecatedAt: '2025-01-01',
        removeAt: '2025-07-01',
        replacement: '/api/v1/products',
        message: 'Use /api/v1/products instead',
      }
      const headers = getDeprecationHeaders(endpoint)
      expect(headers).toHaveProperty('Deprecation', '2025-01-01')
      expect(headers).toHaveProperty('Sunset', '2025-07-01')
      expect(headers).toHaveProperty('Link', '</api/v1/products>; rel="successor-version"')
      expect(headers).toHaveProperty('X-Deprecation-Notice', 'Use /api/v1/products instead')
    })

    it('should produce a plain object (Record<string, string>)', () => {
      const endpoint = {
        path: '/old',
        deprecatedAt: '2024-06-01',
        removeAt: '2025-01-01',
        replacement: '/new',
        message: 'deprecated',
      }
      const headers = getDeprecationHeaders(endpoint)
      expect(typeof headers).toBe('object')
      for (const value of Object.values(headers)) {
        expect(typeof value).toBe('string')
      }
    })
  })

  describe('isVersionSupported', () => {
    it('should return true for v1', () => {
      expect(isVersionSupported('v1')).toBe(true)
    })

    it('should return false for unsupported versions', () => {
      expect(isVersionSupported('v2')).toBe(false)
      expect(isVersionSupported('v0')).toBe(false)
      expect(isVersionSupported('')).toBe(false)
    })
  })

  describe('getLatestVersion', () => {
    it('should return the latest supported version', () => {
      const latest = getLatestVersion()
      expect(latest).toBe('v1')
      expect(SUPPORTED_VERSIONS).toContain(latest)
    })
  })
})
