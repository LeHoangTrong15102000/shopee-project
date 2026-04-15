/**
 * Unit Tests cho Request Logger Middleware
 * Test chức năng logging requests và responses
 */

/// <reference types="jest" />
import { Request, Response, NextFunction } from 'express'

jest.mock('../../utils/logger', () => ({
  Logger: {
    request: jest.fn(),
    apiInfo: jest.fn(),
    apiError: jest.fn(),
  },
}))

import { Logger } from '../../utils/logger'
import { requestLoggerMiddleware } from '../../middleware/request-logger.middleware'

const createMockRequest = (overrides: any = {}): Partial<Request> => ({
  method: 'GET',
  path: '/api/products',
  originalUrl: '/api/products',
  url: '/api/products',
  headers: { 'user-agent': 'test-agent' },
  ip: '127.0.0.1',
  socket: { remoteAddress: '127.0.0.1' } as any,
  query: {},
  body: {},
  jwtDecoded: undefined as any,
  ...overrides,
})

const createMockResponse = (): any => {
  const res: any = {
    statusCode: 200,
    end: jest.fn(),
    get: jest.fn().mockReturnValue('0'),
  }
  return res
}

const createMockNext = (): NextFunction => jest.fn()

describe('Request Logger Middleware', () => {
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  describe('Request logging', () => {
    it('should call Logger.request with method and URL', () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)

      expect(Logger.request).toHaveBeenCalledWith(
        'GET',
        '/api/products',
        undefined,
        expect.objectContaining({ ip: '127.0.0.1' }),
      )
      expect(next).toHaveBeenCalled()
    })

    it('should include userId when jwtDecoded is present', () => {
      const req = createMockRequest({
        jwtDecoded: { id: 'user123' },
      })
      const res = createMockResponse()
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)

      expect(Logger.request).toHaveBeenCalledWith(
        'GET',
        '/api/products',
        'user123',
        expect.any(Object),
      )
    })
  })

  describe('Sensitive data redaction', () => {
    it('should redact password field in body', () => {
      const req = createMockRequest({
        method: 'POST',
        body: { email: 'test@test.com', password: 'secret123' },
      })
      const res = createMockResponse()
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
    })

    it('should redact token field in body', () => {
      const req = createMockRequest({
        method: 'POST',
        body: { data: 'test', access_token: 'my-secret-token' },
      })
      const res = createMockResponse()
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
    })

    it('should redact authorization header', () => {
      const req = createMockRequest({
        headers: {
          'user-agent': 'test-agent',
          authorization: 'Bearer secret-token',
        },
      })
      const res = createMockResponse()
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('Skip excluded paths', () => {
    it('should skip /health endpoint without logging', () => {
      const req = createMockRequest({ path: '/health' })
      const res = createMockResponse()
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)

      expect(Logger.request).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })

    it('should skip /favicon.ico without logging', () => {
      const req = createMockRequest({ path: '/favicon.ico' })
      const res = createMockResponse()
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)

      expect(Logger.request).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })

    it('should skip /api-docs paths without logging', () => {
      const req = createMockRequest({ path: '/api-docs' })
      const res = createMockResponse()
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)

      expect(Logger.request).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })
  })

  describe('POST/PUT/PATCH body logging in non-production', () => {
    it('should log body for POST requests in development', () => {
      process.env.NODE_ENV = 'development'
      const req = createMockRequest({
        method: 'POST',
        body: { name: 'test product', price: 100 },
      })
      const res = createMockResponse()
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)

      expect(Logger.request).toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })

    it('should log body for PUT requests in development', () => {
      process.env.NODE_ENV = 'development'
      const req = createMockRequest({
        method: 'PUT',
        body: { name: 'updated product' },
      })
      const res = createMockResponse()
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)

      expect(Logger.request).toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })

    it('should log body for PATCH requests in development', () => {
      process.env.NODE_ENV = 'development'
      const req = createMockRequest({
        method: 'PATCH',
        body: { status: 'active' },
      })
      const res = createMockResponse()
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)

      expect(Logger.request).toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })
  })

  describe('Response logging', () => {
    it('should override res.end and log status code and response time', () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const originalEnd = res.end
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)

      expect(res.end).not.toBe(originalEnd)

      res.end()

      expect(Logger.apiInfo).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/products - 200'),
      )
    })

    it('should log response time in milliseconds', () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)
      res.end()

      expect(Logger.apiInfo).toHaveBeenCalledWith(expect.stringMatching(/\(\d+ms\)/))
    })
  })

  describe('Error response logging', () => {
    it('should use Logger.apiError for status >= 400', () => {
      const req = createMockRequest()
      const res = createMockResponse()
      res.statusCode = 400
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)
      res.end()

      expect(Logger.apiError).toHaveBeenCalledWith(
        expect.stringContaining('400'),
        expect.any(Object),
      )
    })

    it('should use Logger.apiError for 500 status', () => {
      const req = createMockRequest()
      const res = createMockResponse()
      res.statusCode = 500
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)
      res.end()

      expect(Logger.apiError).toHaveBeenCalledWith(
        expect.stringContaining('500'),
        expect.any(Object),
      )
    })

    it('should use Logger.apiInfo for successful responses', () => {
      const req = createMockRequest()
      const res = createMockResponse()
      res.statusCode = 200
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)
      res.end()

      expect(Logger.apiInfo).toHaveBeenCalled()
      expect(Logger.apiError).not.toHaveBeenCalled()
    })
  })
})
