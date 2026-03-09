import { Router } from 'express'
import { asyncHandler } from '@utils/async-handler'
import healthController from '@controllers/health.controller'

const healthRouter = Router()

/**
 * @route GET /health
 * @description Liveness probe - basic health check
 * @access Public
 */
healthRouter.get('/health', asyncHandler(healthController.healthCheck))

/**
 * @route GET /ready
 * @description Readiness probe - checks if service is ready for traffic
 * @access Public
 */
healthRouter.get('/ready', asyncHandler(healthController.readinessCheck))

/**
 * @route GET /metrics
 * @description Detailed metrics for monitoring
 * @access Public (consider adding auth for production)
 */
healthRouter.get('/metrics', asyncHandler(healthController.metricsCheck))

export default healthRouter

