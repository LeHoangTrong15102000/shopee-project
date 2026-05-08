import { Request, Response } from 'express'
import { responseSuccess } from '@utils/response'
import {
  checkDatabaseHealth,
  isDatabaseReady,
  getConnectionPoolStats,
  DatabaseHealthStatus,
} from '@database/database'
import { redisClient } from '@utils/redis.client'
import { getRequestStats } from '@utils/request-stats'

/**
 * Health check response interface
 */
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  version: string
  database: DatabaseHealthStatus
  memory: {
    heapUsed: number
    heapTotal: number
    external: number
    rss: number
  }
}

/**
 * Readiness check response interface
 */
interface ReadinessResponse {
  ready: boolean
  timestamp: string
  checks: {
    database: boolean
    redis: boolean
  }
}

/**
 * Liveness probe - basic health check
 * Returns 200 if the service is running
 */
export const healthCheck = async (req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth()
  const memoryUsage = process.memoryUsage()

  const health: HealthCheckResponse = {
    status: dbHealth.status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    database: dbHealth,
    memory: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
    },
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503

  return res.status(statusCode).json({
    message: 'Health check completed',
    data: health,
  })
}

/**
 * Readiness probe - checks if the service is ready to accept traffic
 * Returns 200 if all dependencies are ready
 */
export const readinessCheck = async (req: Request, res: Response) => {
  const dbReady = isDatabaseReady()
  const redisReady = redisClient !== null && redisClient.status === 'ready'

  const readiness: ReadinessResponse = {
    ready: dbReady,
    timestamp: new Date().toISOString(),
    checks: {
      database: dbReady,
      redis: redisReady,
    },
  }

  const statusCode = readiness.ready ? 200 : 503

  return res.status(statusCode).json({
    message: readiness.ready ? 'Service is ready' : 'Service is not ready',
    data: readiness,
  })
}

/**
 * Detailed metrics endpoint for monitoring
 */
export const metricsCheck = async (req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth()
  const poolStats = getConnectionPoolStats()
  const memoryUsage = process.memoryUsage()
  const reqStats = getRequestStats()

  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    process: {
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version,
    },
    memory: {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
      heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    },
    database: {
      ...dbHealth,
      pool: poolStats,
    },
    requests: {
      total: reqStats.totalRequests,
      perMinute: reqStats.requestsPerMinute,
      avgResponseTimeMs: reqStats.avgResponseTimeMs,
      errorRate: reqStats.errorRate,
    },
  }

  return responseSuccess(res, {
    message: 'Metrics retrieved',
    data: metrics,
  })
}

const healthController = {
  healthCheck,
  readinessCheck,
  metricsCheck,
}

export default healthController
