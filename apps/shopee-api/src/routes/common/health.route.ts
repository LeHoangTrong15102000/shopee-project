import { Router } from 'express'
import { wrapAsync } from '@utils/response'
import healthController from '@controllers/health.controller'

const healthRouter = Router()

/**
 * @route GET /health
 * @description Liveness probe - basic health check
 * @access Public
 */
healthRouter.get('/health', wrapAsync(healthController.healthCheck))

/**
 * @route GET /ready
 * @description Readiness probe - checks if service is ready for traffic
 * @access Public
 */
healthRouter.get('/ready', wrapAsync(healthController.readinessCheck))

/**
 * @route GET /metrics
 * @description Detailed metrics for monitoring
 * @access Public (consider adding auth for production)
 */
healthRouter.get('/metrics', wrapAsync(healthController.metricsCheck))

export default healthRouter

