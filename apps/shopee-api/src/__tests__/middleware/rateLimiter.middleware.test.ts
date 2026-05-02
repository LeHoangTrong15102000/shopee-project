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

// redis.client returns null in test env so all limiters use RateLimiterMemory
jest.mock('@utils/redis.client', () => ({ redisClient: null }))

import { Request, Response, NextFunction } from 'express'

const createMockReq = (overrides = {}) =>
  ({
    jwtDecoded: undefined,
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' },
    body: {},
    ...overrides,
  }) as any

const createMockRes = () => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.set = jest.fn().mockReturnValue(res)
  return res
}

/**
 * Run an Express middleware and wait for it to call next() or send a response.
 * Returns a Promise that resolves once the middleware has finished.
 */
const runMiddleware = (
  middleware: (req: Request, res: Response, next: NextFunction) => void,
  req: any,
  res: any,
): Promise<void> => {
  return new Promise<void>((resolve) => {
    const next = jest.fn(() => resolve())
    res._resolve = resolve
    // Patch res.json to also resolve so blocked requests finish
    const origJson = res.json.bind(res)
    res.json = jest.fn((...args: any[]) => {
      origJson(...args)
      resolve()
      return res
    })
    middleware(req, res, next)
  })
}

// Helper used in preset limiter tests
function middleware(
  mw: (req: any, res: any, next: any) => void,
  req: any,
  res: any,
  onNext: () => void,
  onBlock: () => void,
) {
  const origJson = res.json.bind(res)
  res.json = jest.fn((...args: any[]) => { origJson(...args); onBlock(); return res })
  mw(req, res, onNext)
}

describe('rateLimiter.middleware', () => {
  describe('createChatbotRateLimit', () => {
    const getModule = () => {
      let module: typeof import('@middleware/rateLimiter.middleware')
      jest.isolateModules(() => {
        module = require('@middleware/rateLimiter.middleware')
      })
      return module!
    }

    it('first request passes and calls next()', async () => {
      const { createChatbotRateLimit } = getModule()
      const middleware = createChatbotRateLimit({ windowMs: 60000, maxRequests: 5 })
      const req = createMockReq()
      const res = createMockRes()
      const next = jest.fn()

      await new Promise<void>((resolve) => {
        const wrappedNext = jest.fn(() => { next(); resolve() })
        middleware(req, res, wrappedNext)
      })

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.status).not.toHaveBeenCalled()
    })

    it('sets rate limit headers on subsequent requests', async () => {
      const { createChatbotRateLimit } = getModule()
      const middleware = createChatbotRateLimit({ windowMs: 60000, maxRequests: 5 })
      const req = createMockReq()
      const res = createMockRes()

      const callMiddleware = () =>
        new Promise<void>((resolve) => {
          const origJson = res.json.bind(res)
          res.json = jest.fn((...args: any[]) => { origJson(...args); resolve(); return res })
          middleware(req, res, () => resolve())
        })

      await callMiddleware()
      await callMiddleware()

      expect(res.set).toHaveBeenCalledWith({
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '3',
        'X-RateLimit-Reset': expect.any(String),
      })
    })

    it('blocks after maxRequests exceeded and returns 429', async () => {
      const { createChatbotRateLimit } = getModule()
      const middleware = createChatbotRateLimit({ windowMs: 60000, maxRequests: 2 })
      const req = createMockReq()
      const res = createMockRes()
      const next = jest.fn()

      const callMiddleware = () =>
        new Promise<void>((resolve) => {
          const origJson = res.json.bind(res)
          res.json = jest.fn((...args: any[]) => { origJson(...args); resolve(); return res })
          middleware(req, res, () => { next(); resolve() })
        })

      await callMiddleware()
      await callMiddleware()
      await callMiddleware()

      expect(next).toHaveBeenCalledTimes(2)
      expect(res.status).toHaveBeenCalledWith(429)
    })

    it('uses userId from jwtDecoded if available', async () => {
      const { createChatbotRateLimit } = getModule()
      const middleware = createChatbotRateLimit({ windowMs: 60000, maxRequests: 1 })
      const req1 = createMockReq({ jwtDecoded: { id: 'user-123' }, ip: '1.1.1.1' })
      const req2 = createMockReq({ jwtDecoded: { id: 'user-456' }, ip: '1.1.1.1' })
      const res = createMockRes()
      const next = jest.fn()

      const callMiddleware = (r: any) =>
        new Promise<void>((resolve) => {
          const origJson = res.json.bind(res)
          res.json = jest.fn((...args: any[]) => { origJson(...args); resolve(); return res })
          middleware(r, res, () => { next(); resolve() })
        })

      await callMiddleware(req1)
      await callMiddleware(req2)

      expect(next).toHaveBeenCalledTimes(2)
    })

    it('falls back to IP if no userId', async () => {
      const { createChatbotRateLimit } = getModule()
      const middleware = createChatbotRateLimit({ windowMs: 60000, maxRequests: 1 })
      const req = createMockReq({ jwtDecoded: undefined, ip: '192.168.1.1' })
      const res = createMockRes()
      const next = jest.fn()

      const callMiddleware = () =>
        new Promise<void>((resolve) => {
          const origJson = res.json.bind(res)
          res.json = jest.fn((...args: any[]) => { origJson(...args); resolve(); return res })
          middleware(req, res, () => { next(); resolve() })
        })

      await callMiddleware()
      await callMiddleware()

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.status).toHaveBeenCalledWith(429)
    })

    it('falls back to anonymous if no IP', async () => {
      const { createChatbotRateLimit } = getModule()
      const middleware = createChatbotRateLimit({ windowMs: 60000, maxRequests: 1 })
      const req = createMockReq({
        jwtDecoded: undefined,
        ip: undefined,
        connection: { remoteAddress: undefined },
      })
      const res = createMockRes()
      const next = jest.fn()

      const callMiddleware = () =>
        new Promise<void>((resolve) => {
          const origJson = res.json.bind(res)
          res.json = jest.fn((...args: any[]) => { origJson(...args); resolve(); return res })
          middleware(req, res, () => { next(); resolve() })
        })

      await callMiddleware()
      await callMiddleware()

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.status).toHaveBeenCalledWith(429)
    })

    it('different IPs have independent limits', async () => {
      const { createChatbotRateLimit } = getModule()
      const middleware = createChatbotRateLimit({ windowMs: 60000, maxRequests: 1 })
      const req1 = createMockReq({ ip: '10.0.0.1' })
      const req2 = createMockReq({ ip: '10.0.0.2' })
      const res = createMockRes()
      const next = jest.fn()

      const callMiddleware = (r: any) =>
        new Promise<void>((resolve) => {
          const origJson = res.json.bind(res)
          res.json = jest.fn((...args: any[]) => { origJson(...args); resolve(); return res })
          middleware(r, res, () => { next(); resolve() })
        })

      await callMiddleware(req1)
      await callMiddleware(req2)

      expect(next).toHaveBeenCalledTimes(2)
    })

    it('uses custom message when provided', async () => {
      const { createChatbotRateLimit } = getModule()
      const customMessage = 'Custom rate limit message'
      const middleware = createChatbotRateLimit({
        windowMs: 60000,
        maxRequests: 1,
        message: customMessage,
      })
      const req = createMockReq()
      const res = createMockRes()

      const callMiddleware = () =>
        new Promise<void>((resolve) => {
          const origJson = res.json.bind(res)
          res.json = jest.fn((...args: any[]) => { origJson(...args); resolve(); return res })
          middleware(req, res, () => resolve())
        })

      await callMiddleware()
      await callMiddleware()

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: customMessage }))
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

  describe('getRateLimitStats', () => {
    const getModule = () => {
      let module: typeof import('@middleware/rateLimiter.middleware')
      jest.isolateModules(() => {
        module = require('@middleware/rateLimiter.middleware')
      })
      return module!
    }

    it('returns an array of limiter stats', () => {
      const { getRateLimitStats } = getModule()
      const stats = getRateLimitStats()
      expect(Array.isArray(stats)).toBe(true)
      expect(stats.length).toBeGreaterThan(0)
    })

    it('each entry has keyPrefix, points, and duration', () => {
      const { getRateLimitStats } = getModule()
      const stats = getRateLimitStats()
      for (const entry of stats) {
        expect(entry).toHaveProperty('keyPrefix')
        expect(entry).toHaveProperty('points')
        expect(entry).toHaveProperty('duration')
        expect(typeof entry.keyPrefix).toBe('string')
        expect(typeof entry.points).toBe('number')
        expect(typeof entry.duration).toBe('number')
      }
    })

    it('includes all expected key prefixes', () => {
      const { getRateLimitStats } = getModule()
      const stats = getRateLimitStats()
      const prefixes = stats.map((s) => s.keyPrefix)
      expect(prefixes).toContain('rl:public')
      expect(prefixes).toContain('rl:authPreset')
      expect(prefixes).toContain('rl:admin')
      expect(prefixes).toContain('rl:expensive')
    })
  })

  describe('preset limiters', () => {
    const getModule = () => {
      let module: typeof import('@middleware/rateLimiter.middleware')
      jest.isolateModules(() => {
        module = require('@middleware/rateLimiter.middleware')
      })
      return module!
    }

    it('publicRateLimit is exported and is a function', () => {
      const { publicRateLimit } = getModule()
      expect(typeof publicRateLimit).toBe('function')
    })

    it('authRateLimit is exported and is a function', () => {
      const { authRateLimit } = getModule()
      expect(typeof authRateLimit).toBe('function')
    })

    it('adminRateLimit is exported and is a function', () => {
      const { adminRateLimit } = getModule()
      expect(typeof adminRateLimit).toBe('function')
    })

    it('expensiveRateLimit is exported and is a function', () => {
      const { expensiveRateLimit } = getModule()
      expect(typeof expensiveRateLimit).toBe('function')
    })

    it('publicRateLimit allows first request and calls next()', async () => {
      const { publicRateLimit } = getModule()
      const req = createMockReq({ ip: '10.0.0.1' })
      const res = createMockRes()
      const next = jest.fn()

      await new Promise<void>((resolve) => {
        middleware(publicRateLimit, req, res, () => { next(); resolve() }, resolve)
      })

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.status).not.toHaveBeenCalled()
    })

    it('authRateLimit uses IP+email composite key', async () => {
      const { authRateLimit } = getModule()
      // Two requests with same IP but different emails should be independent
      const req1 = createMockReq({ ip: '10.0.0.1', body: { email: 'a@test.com' } })
      const req2 = createMockReq({ ip: '10.0.0.1', body: { email: 'b@test.com' } })
      const res = createMockRes()
      const next = jest.fn()

      const callMiddleware = (r: any) =>
        new Promise<void>((resolve) => {
          const origJson = res.json.bind(res)
          res.json = jest.fn((...args: any[]) => { origJson(...args); resolve(); return res })
          authRateLimit(r, res, () => { next(); resolve() })
        })

      await callMiddleware(req1)
      await callMiddleware(req2)

      // Both should pass since they have different composite keys
      expect(next).toHaveBeenCalledTimes(2)
    })

    it('adminRateLimit uses jwtDecoded.id as key', async () => {
      const { adminRateLimit } = getModule()
      const req1 = createMockReq({ jwtDecoded: { id: 'admin-1' }, ip: '10.0.0.1' })
      const req2 = createMockReq({ jwtDecoded: { id: 'admin-2' }, ip: '10.0.0.1' })
      const res = createMockRes()
      const next = jest.fn()

      const callMiddleware = (r: any) =>
        new Promise<void>((resolve) => {
          const origJson = res.json.bind(res)
          res.json = jest.fn((...args: any[]) => { origJson(...args); resolve(); return res })
          adminRateLimit(r, res, () => { next(); resolve() })
        })

      await callMiddleware(req1)
      await callMiddleware(req2)

      // Both should pass since they have different user IDs
      expect(next).toHaveBeenCalledTimes(2)
    })

    it('publicRateLimit returns 429 after exhausting limit', async () => {
      // Use a fresh module with a very low public limit
      process.env.RATE_LIMIT_PUBLIC_MAX = '2'
      let mod: typeof import('@middleware/rateLimiter.middleware')
      jest.isolateModules(() => {
        mod = require('@middleware/rateLimiter.middleware')
      })
      delete process.env.RATE_LIMIT_PUBLIC_MAX

      const req = createMockReq({ ip: '10.99.0.1' })
      const res = createMockRes()
      const next = jest.fn()

      const callMiddleware = () =>
        new Promise<void>((resolve) => {
          const origJson = res.json.bind(res)
          res.json = jest.fn((...args: any[]) => { origJson(...args); resolve(); return res })
          mod!.publicRateLimit(req, res, () => { next(); resolve() })
        })

      await callMiddleware() // 1st — allowed
      await callMiddleware() // 2nd — allowed
      await callMiddleware() // 3rd — blocked

      expect(next).toHaveBeenCalledTimes(2)
      expect(res.status).toHaveBeenCalledWith(429)
      expect(res.set).toHaveBeenCalledWith('Retry-After', expect.any(String))
    })

    it('expensiveRateLimit blocks after exhausting limit', async () => {
      process.env.RATE_LIMIT_EXPENSIVE_MAX = '2'
      let mod: typeof import('@middleware/rateLimiter.middleware')
      jest.isolateModules(() => {
        mod = require('@middleware/rateLimiter.middleware')
      })
      delete process.env.RATE_LIMIT_EXPENSIVE_MAX

      const req = createMockReq({ ip: '10.88.0.1' })
      const res = createMockRes()
      const next = jest.fn()

      const callMiddleware = () =>
        new Promise<void>((resolve) => {
          const origJson = res.json.bind(res)
          res.json = jest.fn((...args: any[]) => { origJson(...args); resolve(); return res })
          mod!.expensiveRateLimit(req, res, () => { next(); resolve() })
        })

      await callMiddleware() // 1st — allowed
      await callMiddleware() // 2nd — allowed
      await callMiddleware() // 3rd — blocked

      expect(next).toHaveBeenCalledTimes(2)
      expect(res.status).toHaveBeenCalledWith(429)
    })
  })

  describe('Retry-After header on 429', () => {
    const getModule = () => {
      let module: typeof import('@middleware/rateLimiter.middleware')
      jest.isolateModules(() => {
        module = require('@middleware/rateLimiter.middleware')
      })
      return module!
    }

    it('sets Retry-After header when rate limit is exceeded', async () => {
      const { createChatbotRateLimit } = getModule()
      const middleware = createChatbotRateLimit({ windowMs: 60000, maxRequests: 1 })
      const req = createMockReq({ ip: '10.0.0.1' })
      const res = createMockRes()

      const callMiddleware = () =>
        new Promise<void>((resolve) => {
          const origJson = res.json.bind(res)
          res.json = jest.fn((...args: any[]) => { origJson(...args); resolve(); return res })
          middleware(req, res, () => resolve())
        })

      await callMiddleware() // first request passes
      await callMiddleware() // second request hits limit

      expect(res.status).toHaveBeenCalledWith(429)
      // Retry-After should be set as a string (seconds)
      expect(res.set).toHaveBeenCalledWith('Retry-After', expect.any(String))
    })
  })

  describe('IP whitelist bypass', () => {
    const getModuleWithWhitelist = (whitelist: string) => {
      process.env.RATE_LIMIT_WHITELIST_IPS = whitelist
      let module: typeof import('@middleware/rateLimiter.middleware')
      jest.isolateModules(() => {
        module = require('@middleware/rateLimiter.middleware')
      })
      delete process.env.RATE_LIMIT_WHITELIST_IPS
      return module!
    }

    it('whitelisted IP bypasses rate limiting', async () => {
      const { publicRateLimit } = getModuleWithWhitelist('10.0.0.99')
      const req = createMockReq({ ip: '10.0.0.99' })
      const res = createMockRes()
      const next = jest.fn()

      const callMiddleware = () =>
        new Promise<void>((resolve) => {
          const origJson = res.json.bind(res)
          res.json = jest.fn((...args: any[]) => { origJson(...args); resolve(); return res })
          publicRateLimit(req, res, () => { next(); resolve() })
        })

      // Call many times — should never be rate limited
      for (let i = 0; i < 10; i++) {
        await callMiddleware()
      }

      expect(next).toHaveBeenCalledTimes(10)
      expect(res.status).not.toHaveBeenCalled()
    })

    it('non-whitelisted IP is still rate limited', async () => {
      const { createChatbotRateLimit } = getModuleWithWhitelist('10.0.0.99')
      const middleware = createChatbotRateLimit({ windowMs: 60000, maxRequests: 1 })
      const req = createMockReq({ ip: '10.0.0.1' }) // different IP, not whitelisted
      const res = createMockRes()
      const next = jest.fn()

      const callMiddleware = () =>
        new Promise<void>((resolve) => {
          const origJson = res.json.bind(res)
          res.json = jest.fn((...args: any[]) => { origJson(...args); resolve(); return res })
          middleware(req, res, () => { next(); resolve() })
        })

      await callMiddleware()
      await callMiddleware()

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.status).toHaveBeenCalledWith(429)
    })
  })
})
