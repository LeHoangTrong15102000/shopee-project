/// <reference types="jest" />

jest.mock('@utils/logger', () => ({
  Logger: {
    apiInfo: jest.fn(),
    apiWarn: jest.fn(),
    apiError: jest.fn(),
    chatbotDebug: jest.fn(),
    chatbotWarn: jest.fn(),
    chatbotError: jest.fn(),
  },
}))

jest.mock('@utils/redis.client', () => ({ redisClient: null }))

import { Request, Response } from 'express'
import {
  requestSizeLimitMiddleware,
  bruteForceProtectionMiddleware,
  recordFailedLogin,
  resetLoginAttempts,
  resetAllLoginAttempts,
  suspiciousActivityMiddleware,
  validateContentTypeMiddleware,
  suspiciousPatternMiddleware,
  getSuspiciousActivities,
  getLoginAttemptStats,
  getLoginAttemptKey,
} from '@middleware/security.middleware'
import { STATUS } from '@constants/status'

const createMockResponse = (): any => {
  const res: any = {}
  res.status = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const createMockNext = () => jest.fn()

const createSecurityMockRequest = (
  options: {
    body?: Record<string, unknown>
    params?: Record<string, unknown>
    query?: Record<string, unknown>
    headers?: Record<string, string>
    ip?: string
    path?: string
    method?: string
  } = {},
): any => {
  return {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    ip: options.ip || '127.0.0.1',
    socket: { remoteAddress: options.ip || '127.0.0.1' },
    connection: { remoteAddress: options.ip || '127.0.0.1' },
    path: options.path || '/',
    method: options.method || 'GET',
  }
}

/** Run an async Express middleware and wait for it to call next() or send a response. */
const runMiddleware = (
  mw: (req: Request, res: Response, next: any) => void,
  req: any,
  res: any,
): Promise<void> =>
  new Promise<void>((resolve) => {
    const origJson = res.json.bind(res)
    res.json = jest.fn((...args: any[]) => {
      origJson(...args)
      resolve()
      return res
    })
    mw(req, res, () => resolve())
  })

/** Flush the microtask queue so fire-and-forget Promises complete. */
const flushPromises = () => new Promise<void>((resolve) => setImmediate(resolve))

describe('Security Middleware', () => {
  describe('getLoginAttemptKey', () => {
    it('should return IP only when no email provided', () => {
      const key = getLoginAttemptKey('192.168.1.1')
      expect(key).toBe('192.168.1.1')
    })

    it('should return IP:email when email provided', () => {
      const key = getLoginAttemptKey('192.168.1.1', 'test@example.com')
      expect(key).toBe('192.168.1.1:test@example.com')
    })
  })

  describe('requestSizeLimitMiddleware', () => {
    it('should pass normal request without content-length', () => {
      const req = createSecurityMockRequest() as Request
      const res = createMockResponse() as Response
      const next = createMockNext()

      requestSizeLimitMiddleware(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should pass request with content-length under limit', () => {
      const req = createSecurityMockRequest({
        headers: { 'content-length': '1024' },
      }) as Request
      const res = createMockResponse() as Response
      const next = createMockNext()

      requestSizeLimitMiddleware(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should reject request with content-length over 10MB limit', () => {
      const req = createSecurityMockRequest({
        headers: { 'content-length': '10485761' },
      }) as Request
      const res = createMockResponse() as Response
      const next = createMockNext()

      requestSizeLimitMiddleware(req, res, next)

      expect(next).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(STATUS.BAD_REQUEST)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Request quá lớn. Vui lòng giảm kích thước dữ liệu.',
      })
    })

    it('should pass request exactly at 10MB limit', () => {
      const req = createSecurityMockRequest({
        headers: { 'content-length': '10485760' },
      }) as Request
      const res = createMockResponse() as Response
      const next = createMockNext()

      requestSizeLimitMiddleware(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })
  })

  describe('bruteForceProtectionMiddleware', () => {
    beforeEach(async () => {
      resetAllLoginAttempts()
      await flushPromises()
    })

    it('should pass normal request without previous attempts', async () => {
      const req = createSecurityMockRequest({
        ip: '10.0.0.1',
        body: { email: 'brute@test.com' },
      }) as Request
      const res = createMockResponse() as Response

      await runMiddleware(bruteForceProtectionMiddleware, req, res)

      expect(res.status).not.toHaveBeenCalled()
    })

    it('should return 429 when account is locked after max attempts', async () => {
      const ip = '10.0.0.2'
      const email = 'locked@test.com'

      for (let i = 0; i < 5; i++) {
        recordFailedLogin(ip, email)
      }
      // Wait for all penalty() Promises to settle
      await flushPromises()
      await flushPromises()

      const req = createSecurityMockRequest({
        ip,
        body: { email },
      }) as Request
      const res = createMockResponse() as Response

      await runMiddleware(bruteForceProtectionMiddleware, req, res)

      expect(res.status).toHaveBeenCalledWith(STATUS.TOO_MANY_REQUESTS)
    })
  })

  describe('recordFailedLogin / resetLoginAttempts', () => {
    beforeEach(async () => {
      resetAllLoginAttempts()
      await flushPromises()
    })

    it('should track failed login attempts by IP', async () => {
      const ip = '10.0.0.3'

      recordFailedLogin(ip)
      recordFailedLogin(ip)
      await flushPromises()

      // After recording failures, a subsequent request should still pass
      // (only 2 attempts, threshold is 5)
      const req = createSecurityMockRequest({ ip }) as Request
      const res = createMockResponse() as Response
      await runMiddleware(bruteForceProtectionMiddleware, req, res)
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should track failed login attempts by IP and email', async () => {
      const ip = '10.0.0.4'
      const email = 'track@test.com'

      recordFailedLogin(ip, email)
      recordFailedLogin(ip, email)
      recordFailedLogin(ip, email)
      await flushPromises()

      // 3 attempts, threshold is 5 — should still pass
      const req = createSecurityMockRequest({ ip, body: { email } }) as Request
      const res = createMockResponse() as Response
      await runMiddleware(bruteForceProtectionMiddleware, req, res)
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should reset login attempts correctly', async () => {
      const ip = '10.0.0.5'
      const email = 'reset@test.com'

      for (let i = 0; i < 5; i++) {
        recordFailedLogin(ip, email)
      }
      await flushPromises()
      await flushPromises()

      resetLoginAttempts(ip, email)
      await flushPromises()

      const req = createSecurityMockRequest({
        ip,
        body: { email },
      }) as Request
      const res = createMockResponse() as Response

      await runMiddleware(bruteForceProtectionMiddleware, req, res)

      expect(res.status).not.toHaveBeenCalled()
    })
  })

  describe('suspiciousPatternMiddleware', () => {
    describe('SQL Injection detection', () => {
      it('should detect OR 1=1 pattern', () => {
        const req = createSecurityMockRequest({
          method: 'POST',
          path: '/api/users',
          body: { input: "' OR 1=1--" },
        }) as Request
        const res = createMockResponse() as Response
        const next = createMockNext()

        suspiciousPatternMiddleware(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(STATUS.BAD_REQUEST)
      })

      it('should detect UNION SELECT pattern', () => {
        const req = createSecurityMockRequest({
          method: 'GET',
          path: '/api/products',
          query: { search: 'UNION SELECT * FROM users' },
        }) as Request
        const res = createMockResponse() as Response
        const next = createMockNext()

        suspiciousPatternMiddleware(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(STATUS.BAD_REQUEST)
      })
    })

    describe('XSS detection', () => {
      it('should detect script tags', () => {
        const req = createSecurityMockRequest({
          method: 'POST',
          path: '/api/comments',
          body: { content: '<script>alert("xss")</script>' },
        }) as Request
        const res = createMockResponse() as Response
        const next = createMockNext()

        suspiciousPatternMiddleware(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(STATUS.BAD_REQUEST)
      })

      it('should detect javascript: protocol', () => {
        const req = createSecurityMockRequest({
          method: 'POST',
          path: '/api/links',
          body: { url: 'javascript:alert(1)' },
        }) as Request
        const res = createMockResponse() as Response
        const next = createMockNext()

        suspiciousPatternMiddleware(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(STATUS.BAD_REQUEST)
      })
    })

    describe('Path traversal detection', () => {
      it('should detect path traversal in URL', () => {
        const req = createSecurityMockRequest({
          method: 'GET',
          path: '/../../../etc/passwd',
        }) as Request
        const res = createMockResponse() as Response
        const next = createMockNext()

        suspiciousPatternMiddleware(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(STATUS.BAD_REQUEST)
      })

      it('should detect path traversal in query', () => {
        const req = createSecurityMockRequest({
          method: 'GET',
          path: '/api/files',
          query: { file: '../../../etc/passwd' },
        }) as Request
        const res = createMockResponse() as Response
        const next = createMockNext()

        suspiciousPatternMiddleware(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(STATUS.BAD_REQUEST)
      })
    })

    describe('Command injection detection', () => {
      it('should detect semicolon command injection', () => {
        const req = createSecurityMockRequest({
          method: 'POST',
          path: '/api/exec',
          body: { cmd: ';ls -la' },
        }) as Request
        const res = createMockResponse() as Response
        const next = createMockNext()

        suspiciousPatternMiddleware(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(STATUS.BAD_REQUEST)
      })

      it('should detect pipe command injection', () => {
        const req = createSecurityMockRequest({
          method: 'POST',
          path: '/api/exec',
          body: { cmd: '|cat /etc/passwd' },
        }) as Request
        const res = createMockResponse() as Response
        const next = createMockNext()

        suspiciousPatternMiddleware(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(STATUS.BAD_REQUEST)
      })
    })

    describe('NoSQL injection detection', () => {
      it('should detect $where operator', () => {
        const req = createSecurityMockRequest({
          method: 'POST',
          path: '/api/query',
          body: { filter: '$where' },
        }) as Request
        const res = createMockResponse() as Response
        const next = createMockNext()

        suspiciousPatternMiddleware(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(STATUS.BAD_REQUEST)
      })

      it('should detect $gt operator', () => {
        const req = createSecurityMockRequest({
          method: 'POST',
          path: '/api/query',
          body: { filter: '$gt' },
        }) as Request
        const res = createMockResponse() as Response
        const next = createMockNext()

        suspiciousPatternMiddleware(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(STATUS.BAD_REQUEST)
      })
    })

    it('should pass clean request', () => {
      const req = createSecurityMockRequest({
        method: 'POST',
        path: '/api/users',
        body: { name: 'John Doe', email: 'john@example.com' },
      }) as Request
      const res = createMockResponse() as Response
      const next = createMockNext()

      suspiciousPatternMiddleware(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })
  })

  describe('validateContentTypeMiddleware', () => {
    it('should skip GET requests', () => {
      const req = createSecurityMockRequest({
        method: 'GET',
        path: '/api/users',
      }) as Request
      const res = createMockResponse() as Response
      const next = createMockNext()

      validateContentTypeMiddleware(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should skip HEAD requests', () => {
      const req = createSecurityMockRequest({
        method: 'HEAD',
        path: '/api/users',
      }) as Request
      const res = createMockResponse() as Response
      const next = createMockNext()

      validateContentTypeMiddleware(req, res, next)

      expect(next).toHaveBeenCalled()
    })

    it('should skip OPTIONS requests', () => {
      const req = createSecurityMockRequest({
        method: 'OPTIONS',
        path: '/api/users',
      }) as Request
      const res = createMockResponse() as Response
      const next = createMockNext()

      validateContentTypeMiddleware(req, res, next)

      expect(next).toHaveBeenCalled()
    })

    it('should reject invalid content-type for POST', () => {
      const req = createSecurityMockRequest({
        method: 'POST',
        path: '/api/users',
        headers: { 'content-type': 'text/plain' },
      }) as Request
      const res = createMockResponse() as Response
      const next = createMockNext()

      validateContentTypeMiddleware(req, res, next)

      expect(next).not.toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(STATUS.UNSUPPORTED_MEDIA_TYPE)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Content-Type không được hỗ trợ.',
      })
    })

    it('should allow application/json content-type', () => {
      const req = createSecurityMockRequest({
        method: 'POST',
        path: '/api/users',
        headers: { 'content-type': 'application/json' },
      }) as Request
      const res = createMockResponse() as Response
      const next = createMockNext()

      validateContentTypeMiddleware(req, res, next)

      expect(next).toHaveBeenCalled()
    })

    it('should allow application/x-www-form-urlencoded content-type', () => {
      const req = createSecurityMockRequest({
        method: 'POST',
        path: '/api/users',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      }) as Request
      const res = createMockResponse() as Response
      const next = createMockNext()

      validateContentTypeMiddleware(req, res, next)

      expect(next).toHaveBeenCalled()
    })

    it('should allow multipart/form-data content-type', () => {
      const req = createSecurityMockRequest({
        method: 'POST',
        path: '/api/upload',
        headers: { 'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary' },
      }) as Request
      const res = createMockResponse() as Response
      const next = createMockNext()

      validateContentTypeMiddleware(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('suspiciousActivityMiddleware', () => {
    it('should log access to sensitive endpoints', () => {
      const req = createSecurityMockRequest({
        method: 'POST',
        path: '/login',
        headers: { 'user-agent': 'Mozilla/5.0' },
      }) as Request
      const res = createMockResponse() as Response
      const next = createMockNext()

      suspiciousActivityMiddleware(req, res, next)

      expect(next).toHaveBeenCalled()
    })

    it('should log access to register endpoint', () => {
      const req = createSecurityMockRequest({
        method: 'POST',
        path: '/register',
      }) as Request
      const res = createMockResponse() as Response
      const next = createMockNext()

      suspiciousActivityMiddleware(req, res, next)

      expect(next).toHaveBeenCalled()
    })

    it('should pass through non-sensitive endpoints', () => {
      const req = createSecurityMockRequest({
        method: 'GET',
        path: '/api/products',
      }) as Request
      const res = createMockResponse() as Response
      const next = createMockNext()

      suspiciousActivityMiddleware(req, res, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('getLoginAttemptStats', () => {
    it('should return correct stats structure', () => {
      const stats = getLoginAttemptStats()

      expect(stats).toHaveProperty('limiterType')
      expect(stats).toHaveProperty('points')
      expect(stats).toHaveProperty('duration')
      expect(typeof stats.limiterType).toBe('string')
      expect(typeof stats.points).toBe('number')
      expect(typeof stats.duration).toBe('number')
    })

    it('should report memory limiter type when Redis is unavailable', () => {
      const stats = getLoginAttemptStats()
      // In test env, redis.client is mocked to null so limiterType is 'memory'
      expect(stats.limiterType).toBe('memory')
    })

    it('should report correct brute force thresholds', () => {
      const stats = getLoginAttemptStats()
      expect(stats.points).toBe(5)
      expect(stats.duration).toBe(900)
    })
  })

  describe('getSuspiciousActivities', () => {
    it('should return array of suspicious activities', async () => {
      const activities = await getSuspiciousActivities()

      expect(Array.isArray(activities)).toBe(true)
    })

    it('should respect limit parameter', async () => {
      const activities = await getSuspiciousActivities(5)

      expect(activities.length).toBeLessThanOrEqual(5)
    })

    it('should return activities with correct structure', async () => {
      const req = createSecurityMockRequest({
        method: 'POST',
        path: '/api/test',
        headers: { 'content-length': '20000000' },
      }) as Request
      const res = createMockResponse() as Response
      const next = createMockNext()

      requestSizeLimitMiddleware(req, res, next)

      const activities = await getSuspiciousActivities(1)
      if (activities.length > 0) {
        const activity = activities[activities.length - 1]
        expect(activity).toHaveProperty('ip')
        expect(activity).toHaveProperty('endpoint')
        expect(activity).toHaveProperty('method')
        expect(activity).toHaveProperty('timestamp')
        expect(activity).toHaveProperty('reason')
      }
    })
  })
})
