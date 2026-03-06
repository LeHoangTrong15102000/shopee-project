/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: {
    chatbotDebug: jest.fn(),
    chatbotWarn: jest.fn(),
    chatbotError: jest.fn(),
    apiInfo: jest.fn(),
    apiWarn: jest.fn(),
    apiError: jest.fn(),
  },
}))

const createMockReq = (overrides = {}) =>
  ({
    jwtDecoded: undefined,
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' },
    ...overrides,
  }) as any

const createMockRes = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.set = jest.fn().mockReturnValue(res)
  return res
}

describe('rateLimiter.middleware', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  describe('createChatbotRateLimit', () => {
    const getModule = () => {
      let module: typeof import('@middleware/rateLimiter.middleware')
      jest.isolateModules(() => {
        module = require('@middleware/rateLimiter.middleware')
      })
      return module!
    }

    it('first request passes and calls next()', () => {
      const { createChatbotRateLimit } = getModule()
      const middleware = createChatbotRateLimit({ windowMs: 60000, maxRequests: 5 })
      const req = createMockReq()
      const res = createMockRes()
      const next = jest.fn()

      middleware(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.status).not.toHaveBeenCalled()
    })

    it('sets rate limit headers on subsequent requests', () => {
      const { createChatbotRateLimit } = getModule()
      const middleware = createChatbotRateLimit({ windowMs: 60000, maxRequests: 5 })
      const req = createMockReq()
      const res = createMockRes()
      const next = jest.fn()

      middleware(req, res, next)
      middleware(req, res, next)

      expect(res.set).toHaveBeenCalledWith({
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '3',
        'X-RateLimit-Reset': expect.any(String),
      })
    })

    it('blocks after maxRequests exceeded and returns 429', () => {
      const { createChatbotRateLimit } = getModule()
      const middleware = createChatbotRateLimit({ windowMs: 60000, maxRequests: 2 })
      const req = createMockReq()
      const res = createMockRes()
      const next = jest.fn()

      middleware(req, res, next)
      middleware(req, res, next)
      middleware(req, res, next)

      expect(next).toHaveBeenCalledTimes(2)
      expect(res.status).toHaveBeenCalledWith(429)
      expect(res.json).toHaveBeenCalledWith({
        message: expect.any(String),
        error: 'Rate limit exceeded',
        retryAfter: expect.any(Number),
        limit: 2,
        remaining: 0,
      })
    })

    it('resets counter after window expires', () => {
      const { createChatbotRateLimit } = getModule()
      const middleware = createChatbotRateLimit({ windowMs: 60000, maxRequests: 2 })
      const req = createMockReq()
      const res = createMockRes()
      const next = jest.fn()

      middleware(req, res, next)
      middleware(req, res, next)
      middleware(req, res, next)
      expect(next).toHaveBeenCalledTimes(2)

      jest.advanceTimersByTime(60001)

      middleware(req, res, next)
      expect(next).toHaveBeenCalledTimes(3)
    })

    it('uses userId from jwtDecoded if available', () => {
      const { createChatbotRateLimit } = getModule()
      const middleware = createChatbotRateLimit({ windowMs: 60000, maxRequests: 1 })
      const req1 = createMockReq({ jwtDecoded: { id: 'user-123' }, ip: '1.1.1.1' })
      const req2 = createMockReq({ jwtDecoded: { id: 'user-456' }, ip: '1.1.1.1' })
      const res = createMockRes()
      const next = jest.fn()

      middleware(req1, res, next)
      middleware(req2, res, next)

      expect(next).toHaveBeenCalledTimes(2)
    })

    it('falls back to IP if no userId', () => {
      const { createChatbotRateLimit } = getModule()
      const middleware = createChatbotRateLimit({ windowMs: 60000, maxRequests: 1 })
      const req = createMockReq({ jwtDecoded: undefined, ip: '192.168.1.1' })
      const res = createMockRes()
      const next = jest.fn()

      middleware(req, res, next)
      middleware(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.status).toHaveBeenCalledWith(429)
    })

    it('falls back to anonymous if no IP', () => {
      const { createChatbotRateLimit } = getModule()
      const middleware = createChatbotRateLimit({ windowMs: 60000, maxRequests: 1 })
      const req = createMockReq({
        jwtDecoded: undefined,
        ip: undefined,
        connection: { remoteAddress: undefined },
      })
      const res = createMockRes()
      const next = jest.fn()

      middleware(req, res, next)
      middleware(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.status).toHaveBeenCalledWith(429)
    })

    it('different IPs have independent limits', () => {
      const { createChatbotRateLimit } = getModule()
      const middleware = createChatbotRateLimit({ windowMs: 60000, maxRequests: 1 })
      const req1 = createMockReq({ ip: '10.0.0.1' })
      const req2 = createMockReq({ ip: '10.0.0.2' })
      const res = createMockRes()
      const next = jest.fn()

      middleware(req1, res, next)
      middleware(req2, res, next)

      expect(next).toHaveBeenCalledTimes(2)
    })

    it('on internal error, allows request through', () => {
      const { createChatbotRateLimit } = getModule()
      const middleware = createChatbotRateLimit({ windowMs: 60000, maxRequests: 5 })
      const req = createMockReq()
      const res = createMockRes()
      const next = jest.fn()

      Object.defineProperty(req, 'ip', {
        get() {
          throw new Error('Simulated error')
        },
      })

      middleware(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.status).not.toHaveBeenCalled()
    })

    it('uses custom message when provided', () => {
      const { createChatbotRateLimit } = getModule()
      const customMessage = 'Custom rate limit message'
      const middleware = createChatbotRateLimit({
        windowMs: 60000,
        maxRequests: 1,
        message: customMessage,
      })
      const req = createMockReq()
      const res = createMockRes()
      const next = jest.fn()

      middleware(req, res, next)
      middleware(req, res, next)

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: customMessage })
      )
    })
  })

  describe('rateLimitConfigs', () => {
    const getModule = () => {
      let module: typeof import('@middleware/rateLimiter.middleware')
      jest.isolateModules(() => {
        module = require('@middleware/rateLimiter.middleware')
      })
      return module!
    }

    it.each([
      'testChatbot',
      'conversation',
      'sendMessage',
      'api',
      'auth',
      'products',
      'purchase',
      'health',
    ] as const)('%s config exists and is a function', (configName) => {
      const { rateLimitConfigs } = getModule()
      expect(rateLimitConfigs[configName]).toBeDefined()
      expect(typeof rateLimitConfigs[configName]).toBe('function')
    })
  })

  describe('cleanupExpiredRateLimits', () => {
    const getModule = () => {
      let module: typeof import('@middleware/rateLimiter.middleware')
      jest.isolateModules(() => {
        module = require('@middleware/rateLimiter.middleware')
      })
      return module!
    }

    it('removes expired entries and keeps active ones', () => {
      const { createChatbotRateLimit, cleanupExpiredRateLimits, getRateLimitStats } =
        getModule()
      const middleware = createChatbotRateLimit({ windowMs: 60000, maxRequests: 10 })
      const req1 = createMockReq({ ip: '1.1.1.1' })
      const req2 = createMockReq({ ip: '2.2.2.2' })
      const res = createMockRes()
      const next = jest.fn()

      middleware(req1, res, next)

      jest.advanceTimersByTime(30000)
      middleware(req2, res, next)

      jest.advanceTimersByTime(31000)

      cleanupExpiredRateLimits()

      const stats = getRateLimitStats()
      expect(stats.totalActiveKeys).toBe(1)
    })
  })

  describe('getRateLimitStats', () => {
    const getModule = () => {
      let module: typeof import('@middleware/rateLimiter.middleware')
      jest.isolateModules(() => {
        module = require('@middleware/rateLimiter.middleware')
      })
      return module!
    }

    it('returns correct structure with totalActiveKeys, averageRequestsPerKey, topUsers', () => {
      const { createChatbotRateLimit, getRateLimitStats } = getModule()
      const middleware = createChatbotRateLimit({ windowMs: 60000, maxRequests: 10 })
      const req1 = createMockReq({ ip: '1.1.1.1' })
      const req2 = createMockReq({ ip: '2.2.2.2' })
      const res = createMockRes()
      const next = jest.fn()

      middleware(req1, res, next)
      middleware(req1, res, next)
      middleware(req1, res, next)
      middleware(req2, res, next)

      const stats = getRateLimitStats()

      expect(stats).toHaveProperty('totalActiveKeys')
      expect(stats).toHaveProperty('averageRequestsPerKey')
      expect(stats).toHaveProperty('topUsers')
      expect(stats.totalActiveKeys).toBe(2)
      expect(stats.averageRequestsPerKey).toBe(2)
      expect(Array.isArray(stats.topUsers)).toBe(true)
      expect(stats.topUsers[0]).toEqual({ key: '1.1.1.1', count: 3 })
    })

    it('returns zero values when no active keys', () => {
      const { getRateLimitStats } = getModule()

      const stats = getRateLimitStats()

      expect(stats.totalActiveKeys).toBe(0)
      expect(stats.averageRequestsPerKey).toBe(0)
      expect(stats.topUsers).toEqual([])
    })

    it('limits topUsers to 5 entries', () => {
      const { createChatbotRateLimit, getRateLimitStats } = getModule()
      const middleware = createChatbotRateLimit({ windowMs: 60000, maxRequests: 10 })
      const res = createMockRes()
      const next = jest.fn()

      for (let i = 1; i <= 7; i++) {
        const req = createMockReq({ ip: `10.0.0.${i}` })
        middleware(req, res, next)
      }

      const stats = getRateLimitStats()

      expect(stats.topUsers.length).toBe(5)
    })
  })
})