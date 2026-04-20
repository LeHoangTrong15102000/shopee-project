/**
 * Integration Tests for Health Controller
 * Tests health check, readiness, and metrics endpoints
 */

/// <reference types="jest" />
import { Request, Response } from 'express'
import { healthCheck, readinessCheck, metricsCheck } from '@controllers/health.controller'

// Mock database module
jest.mock('@database/database', () => ({
  checkDatabaseHealth: jest.fn(),
  isDatabaseReady: jest.fn(),
  getConnectionPoolStats: jest.fn(),
}))

import { checkDatabaseHealth, isDatabaseReady, getConnectionPoolStats } from '@database/database'

const mockCheckDatabaseHealth = checkDatabaseHealth as jest.Mock
const mockIsDatabaseReady = isDatabaseReady as jest.Mock
const mockGetConnectionPoolStats = getConnectionPoolStats as jest.Mock

// Helper to create mock request/response
const createMockRequest = (): Partial<Request> => ({})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('HealthController', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('healthCheck', () => {
    it('should return 200 with healthy status when database is healthy', async () => {
      mockCheckDatabaseHealth.mockResolvedValue({
        status: 'healthy',
        connected: true,
        latency: 5,
      })

      const req = createMockRequest() as Request
      const res = createMockResponse() as Response

      await healthCheck(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Health check completed',
          data: expect.objectContaining({
            status: 'healthy',
            database: expect.objectContaining({
              status: 'healthy',
              connected: true,
            }),
            memory: expect.objectContaining({
              heapUsed: expect.any(Number),
              heapTotal: expect.any(Number),
            }),
          }),
        }),
      )
    })

    it('should return 503 when database is unhealthy', async () => {
      mockCheckDatabaseHealth.mockResolvedValue({
        status: 'unhealthy',
        connected: false,
        error: 'Connection failed',
      })

      const req = createMockRequest() as Request
      const res = createMockResponse() as Response

      await healthCheck(req, res)

      expect(res.status).toHaveBeenCalledWith(503)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'unhealthy',
          }),
        }),
      )
    })

    it('should return 200 with degraded status', async () => {
      mockCheckDatabaseHealth.mockResolvedValue({
        status: 'degraded',
        connected: true,
        latency: 500,
      })

      const req = createMockRequest() as Request
      const res = createMockResponse() as Response

      await healthCheck(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'degraded',
          }),
        }),
      )
    })
  })

  describe('readinessCheck', () => {
    it('should return 200 when service is ready', async () => {
      mockIsDatabaseReady.mockReturnValue(true)

      const req = createMockRequest() as Request
      const res = createMockResponse() as Response

      await readinessCheck(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Service is ready',
          data: expect.objectContaining({
            ready: true,
            checks: { database: true },
          }),
        }),
      )
    })

    it('should return 503 when service is not ready', async () => {
      mockIsDatabaseReady.mockReturnValue(false)

      const req = createMockRequest() as Request
      const res = createMockResponse() as Response

      await readinessCheck(req, res)

      expect(res.status).toHaveBeenCalledWith(503)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Service is not ready',
          data: expect.objectContaining({
            ready: false,
            checks: { database: false },
          }),
        }),
      )
    })
  })

  describe('metricsCheck', () => {
    it('should return metrics with database health and pool stats', async () => {
      const mockDbHealth = {
        status: 'healthy',
        connected: true,
        readyState: 1,
        readyStateText: 'connected',
        latencyMs: 5,
      }
      const mockPoolStats = { poolSize: 10, readyState: 1, host: 'cluster0.example.net' }

      mockCheckDatabaseHealth.mockResolvedValue(mockDbHealth)
      mockGetConnectionPoolStats.mockReturnValue(mockPoolStats)

      const req = createMockRequest() as Request
      const res = createMockResponse() as Response
      // responseSuccess uses res.status().send(), so add send mock
      ;(res.status as jest.Mock).mockReturnValue({ send: jest.fn().mockReturnValue(res) })

      await metricsCheck(req, res)

      expect(mockCheckDatabaseHealth).toHaveBeenCalled()
      expect(mockGetConnectionPoolStats).toHaveBeenCalled()
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })
})
