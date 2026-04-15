/**
 * Test App Factory
 * Creates an Express app configured identically to production for integration/E2E testing
 * Does NOT start the server — supertest manages the lifecycle
 */
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import adminRoutes from '@routes/admin/index.route'
import commonRoutes from '@routes/common/index.route'
import userRoutes from '@routes/user/index.route'
import { responseError, ErrorHandler } from '@utils/response'
import { sanitizeMiddleware } from '@middleware/sanitize.middleware'
import { MAX_REQUEST_SIZE } from '@constants/security.config'
import {
  requestSizeLimitMiddleware,
  suspiciousActivityMiddleware,
  suspiciousPatternMiddleware,
  validateContentTypeMiddleware,
} from '@middleware/security.middleware'
import { requestLoggerMiddleware } from '@middleware/request-logger.middleware'

export const createTestApp = (): express.Application => {
  const app = express()

  const routes = [{ ...commonRoutes }, { ...userRoutes }, { ...adminRoutes }]

  // Helmet with relaxed CSP for testing
  app.use(helmet({ contentSecurityPolicy: false }))

  // CORS — allow all origins in test
  app.use(cors())

  // Security middleware
  app.use(requestSizeLimitMiddleware)
  app.use(validateContentTypeMiddleware)
  app.use(suspiciousActivityMiddleware)

  // Body parsing
  app.use(express.json({ limit: MAX_REQUEST_SIZE }))
  app.use(express.urlencoded({ extended: true, limit: MAX_REQUEST_SIZE }))

  // Compression
  app.use(compression())

  // Suspicious pattern check (after body parse)
  app.use(suspiciousPatternMiddleware)

  // Sanitize input
  app.use(sanitizeMiddleware)

  // Request logger
  app.use(requestLoggerMiddleware)

  // Register all routes (same as src/index.ts)
  routes.forEach((item) =>
    item.routes.forEach((route) => app.use(item.prefix + route.path, route.route)),
  )

  // 404 handler
  app.use((req: Request, res: Response, next: NextFunction): void => {
    const error = new ErrorHandler(404, `Route ${req.method} ${req.path} không tồn tại`)
    next(error)
  })

  // Global error handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction): void => {
    responseError(res, err)
  })

  return app
}
