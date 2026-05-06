/**
 * Unit Tests cho Request Logger Middleware
 * Test chức năng logging requests và responses
 */

/// <reference types="jest" />
import { Request, Response, NextFunction } from 'express'

// mockChildLogger must be declared with a "mock" prefix so Jest's hoisting
// allows the variable to be referenced inside the jest.mock factory.
const mockChildLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}

jest.mock('../../utils/logger', () => ({
  Logger: {
    request: jest.fn(),
    apiInfo: jest.fn(),
    apiError: jest.fn(),
    child: jest.fn().mockReturnValue(mockChildLogger),
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
    // Re-wire child() to return the shared mockChildLogger after clearAllMocks resets it
    ;(Logger.child as jest.Mock).mockReturnValue(mockChildLogger)
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
  })

  describe('Request logging', () => {
    it('should call Logger.child and log request with method and URL', () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)

      expect(Logger.child).toHaveBeenCalled()
      expect(mockChildLogger.info).toHaveBeenCalledWith(
        'GET /api/products',
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

      expect(mockChildLogger.info).toHaveBeenCalledWith(
        'GET /api/products',
        expect.objectContaining({ userId: 'user123' }),
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

      expect(Logger.child).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })

    it('should skip /favicon.ico without logging', () => {
      const req = createMockRequest({ path: '/favicon.ico' })
      const res = createMockResponse()
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)

      expect(Logger.child).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })

    it('should skip /api-docs paths without logging', () => {
      const req = createMockRequest({ path: '/api-docs' })
      const res = createMockResponse()
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)

      expect(Logger.child).not.toHaveBeenCalled()
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

      expect(mockChildLogger.info).toHaveBeenCalled()
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

      expect(mockChildLogger.info).toHaveBeenCalled()
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

      expect(mockChildLogger.info).toHaveBeenCalled()
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

      expect(mockChildLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('GET /api/products - 200'),
        expect.any(Object),
      )
    })

    it('should log response time in milliseconds', () => {
      const req = createMockRequest()
      const res = createMockResponse()
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)
      res.end()

      expect(mockChildLogger.info).toHaveBeenCalledWith(
        expect.stringMatching(/\(\d+ms\)/),
        expect.any(Object),
      )
    })
  })

  describe('Error response logging', () => {
    it('should use child logger error for status >= 400', () => {
      const req = createMockRequest()
      const res = createMockResponse()
      res.statusCode = 400
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)
      res.end()

      expect(mockChildLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('400'),
        expect.any(Object),
      )
    })

    it('should use child logger error for 500 status', () => {
      const req = createMockRequest()
      const res = createMockResponse()
      res.statusCode = 500
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)
      res.end()

      expect(mockChildLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('500'),
        expect.any(Object),
      )
    })

    it('should use child logger info for successful responses', () => {
      const req = createMockRequest()
      const res = createMockResponse()
      res.statusCode = 200
      const next = createMockNext()

      requestLoggerMiddleware(req as Request, res as Response, next)
      res.end()

      // The second call to info is the response log
      expect(mockChildLogger.info).toHaveBeenCalled()
      expect(mockChildLogger.error).not.toHaveBeenCalled()
    })
  })
})
