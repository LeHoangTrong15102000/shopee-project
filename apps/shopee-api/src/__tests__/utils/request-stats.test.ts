/// <reference types="jest" />

// request-stats uses a module-level singleton, so we must re-import fresh for each test
// to avoid state leaking between tests.

describe('request-stats', () => {
  let recordRequest: (statusCode: number, responseTimeMs: number) => void
  let getRequestStats: () => {
    totalRequests: number
    requestsPerMinute: number
    avgResponseTimeMs: number
    errorRate: number
  }

  beforeEach(() => {
    jest.resetModules()
    const mod = require('../../utils/request-stats')
    recordRequest = mod.recordRequest
    getRequestStats = mod.getRequestStats
  })

  describe('recordRequest', () => {
    it('increments totalRequests on each call', () => {
      recordRequest(200, 50)
      recordRequest(200, 100)

      const stats = getRequestStats()
      expect(stats.totalRequests).toBe(2)
    })

    it('tracks 4xx status codes as error requests', () => {
      recordRequest(200, 50)
      recordRequest(404, 30)
      recordRequest(400, 20)

      const stats = getRequestStats()
      expect(stats.errorRate).toBeGreaterThan(0)
    })

    it('tracks 5xx status codes as error requests', () => {
      recordRequest(200, 50)
      recordRequest(500, 100)

      const stats = getRequestStats()
      expect(stats.errorRate).toBeGreaterThan(0)
    })

    it('does not count 2xx or 3xx as errors', () => {
      recordRequest(200, 50)
      recordRequest(201, 30)
      recordRequest(301, 20)

      const stats = getRequestStats()
      expect(stats.errorRate).toBe(0)
    })
  })

  describe('getRequestStats', () => {
    it('returns zero values when no requests recorded', () => {
      const stats = getRequestStats()

      expect(stats.totalRequests).toBe(0)
      expect(stats.requestsPerMinute).toBe(0)
      expect(stats.avgResponseTimeMs).toBe(0)
      expect(stats.errorRate).toBe(0)
    })

    it('calculates avgResponseTimeMs correctly', () => {
      recordRequest(200, 100)
      recordRequest(200, 200)
      recordRequest(200, 300)

      const stats = getRequestStats()
      expect(stats.avgResponseTimeMs).toBe(200) // (100+200+300)/3
    })

    it('calculates errorRate as percentage', () => {
      recordRequest(200, 50)
      recordRequest(200, 50)
      recordRequest(500, 50)
      recordRequest(404, 50)

      const stats = getRequestStats()
      // 2 errors out of 4 = 50%
      expect(stats.errorRate).toBe(50)
    })

    it('includes requestsPerMinute from sliding window', () => {
      recordRequest(200, 50)
      recordRequest(200, 100)

      const stats = getRequestStats()
      // Both requests are recent, so requestsPerMinute should be 2
      expect(stats.requestsPerMinute).toBe(2)
    })

    it('prunes old entries from sliding window after 60 seconds', () => {
      const realNow = Date.now()

      // Record requests at a time 61 seconds in the past
      const pastTime = realNow - 61_000
      const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(pastTime)
      recordRequest(200, 50)
      recordRequest(200, 100)
      dateSpy.mockRestore()

      // Record a new request at current time — this triggers pruning of old entries
      recordRequest(200, 75)

      const stats = getRequestStats()
      // The two old requests should be pruned; only the new one remains in the window
      expect(stats.requestsPerMinute).toBe(1)
    })

    it('returns all required fields', () => {
      const stats = getRequestStats()

      expect(stats).toHaveProperty('totalRequests')
      expect(stats).toHaveProperty('requestsPerMinute')
      expect(stats).toHaveProperty('avgResponseTimeMs')
      expect(stats).toHaveProperty('errorRate')
    })
  })
})
