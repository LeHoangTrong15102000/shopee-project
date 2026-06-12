// Load .env file FIRST — before any module that reads process.env
require('dotenv').config()

// Validate environment variables IMMEDIATELY after loading .env
// This ensures the server exits with a clear error if any required vars are missing
// BEFORE attempting to connect to DB or initialize any services.
import { validateEnv } from '@constants/env.schema'
validateEnv()

import express, { Request, Response, NextFunction } from 'express'
import http from 'http'
import cors from 'cors'
import chalk from 'chalk'
import helmet from 'helmet'
import compression from 'compression'
import { connectMongoDB } from '@database/database'
import adminRoutes from '@routes/admin/index.route'
import commonRoutes from '@routes/common/index.route'
import userRoutes from '@routes/user/index.route'
import { responseError, ErrorHandler } from '@utils/response'
import { ServiceError } from '@services/base.service'
import { FOLDERS, FOLDER_UPLOAD, ROUTE_IMAGE } from '@constants/config'
import { corsOptions } from '@constants/cors.config'
import path from 'path'
import { isProduction } from '@utils/helper'
import { sanitizeMiddleware } from '@middleware/sanitize.middleware'
import { publicRateLimit } from '@middleware/rateLimiter.middleware'
import { swaggerDocument, swaggerUIHtml } from './docs/swagger'
import { MAX_REQUEST_SIZE } from '@constants/security.config'
import {
  requestSizeLimitMiddleware,
  suspiciousActivityMiddleware,
  suspiciousPatternMiddleware,
  validateContentTypeMiddleware,
} from '@middleware/security.middleware'
import { requestLoggerMiddleware } from '@middleware/request-logger.middleware'
import { requestIdMiddleware } from '@middleware/request-id.middleware'
import { getDeprecationInfo, getDeprecationHeaders } from '@constants/api-version'
import { Logger } from '@utils/logger'
import { initializeSocket } from './socket/socket.init'
import { viewCounterService } from '@utils/view-counter.service'
import { disconnectRedis } from '@utils/redis.client'
import {
  paymentReconciliationJob,
  flashSaleScheduler,
  refundStatusPollJob,
  meilisearchService,
  analyticsAggregationJob,
  cleanupJob,
  searchReindexJob,
} from './container'
import dockerHealthRouter from '@routes/health.route'

const app: express.Application = express()
const routes = [{ ...commonRoutes }, { ...userRoutes }, { ...adminRoutes }]

// Health check endpoint — registered BEFORE the HTTPS redirect middleware so
// that in-container wget http://localhost:4000/health returns 200 (not 301).
// This is required for the Docker health check to pass in production.
app.use('/health', dockerHealthRouter)

// Middleware redirect HTTP sang HTTPS trong môi trường production
if (isProduction) {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`)
    }
    next()
  })
}

// Cấu hình Helmet với các security headers nâng cao
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', '*'],
      },
    },
    // Ngăn chặn clickjacking bằng cách không cho phép iframe
    frameguard: { action: 'deny' },
    // Ngăn chặn MIME type sniffing
    noSniff: true,
    // Bật Strict-Transport-Security cho HTTPS
    hsts: isProduction
      ? {
          maxAge: 31536000, // 1 năm
          includeSubDomains: true,
          preload: true,
        }
      : false,
    // Ẩn header X-Powered-By
    hidePoweredBy: true,
    // Ngăn chặn XSS attacks
    xssFilter: true,
  }),
)

// Thêm các security headers bổ sung
app.use((req: Request, res: Response, next: NextFunction) => {
  // Ngăn chặn MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')
  // Ngăn chặn clickjacking
  res.setHeader('X-Frame-Options', 'DENY')
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  next()
})

// Cấu hình CORS với whitelist origins
app.use(cors(corsOptions))

// Security middleware - kiểm tra request size trước khi parse body
app.use(requestSizeLimitMiddleware)

// Security middleware - validate content-type
app.use(validateContentTypeMiddleware)

// Security middleware - log hoạt động đáng ngờ
app.use(suspiciousActivityMiddleware)

// Raw body parser for Stripe webhook — MUST come before express.json()
// Stripe signature verification requires the raw Buffer, not parsed JSON.
app.use('/payment/stripe/webhook', express.raw({ type: 'application/json' }))

// Parse JSON với giới hạn kích thước
app.use(express.json({ limit: MAX_REQUEST_SIZE }))
app.use(express.urlencoded({ extended: true, limit: MAX_REQUEST_SIZE }))

// Normalize req.body: body-parser 2.x leaves req.body === undefined when it skips
// parsing (e.g. Content-Length: 0 with no matching Content-Type). Set it to {} so
// every downstream controller can safely destructure without a TypeError crash.
// Strict === undefined check preserves parsed objects/arrays/{} and leaves the
// Stripe webhook Buffer body (/payment/stripe/webhook via express.raw) untouched.
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.body === undefined) req.body = {}
  next()
})

// Compression middleware - nén response để giảm bandwidth
app.use(compression())

// Security middleware - kiểm tra suspicious patterns trong request (sau khi parse body)
// Skip for Stripe webhook — body is a raw Buffer, not parsed JSON
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/payment/stripe/webhook') return next()
  suspiciousPatternMiddleware(req, res, next)
})

// Middleware sanitize input để chống NoSQL injection
// Skip for Stripe webhook — body is a raw Buffer, not parsed JSON
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/payment/stripe/webhook') return next()
  sanitizeMiddleware(req, res, next)
})

// Global rate limiting — baseline 200 req/min per IP for all routes
app.use(publicRateLimit)

// Request ID middleware — must run before request logger so req.requestId is available
app.use(requestIdMiddleware)

// Request logger middleware - log tất cả incoming requests
app.use(requestLoggerMiddleware)

// Deprecation warning middleware - thêm headers cho deprecated endpoints
app.use((req: Request, res: Response, next: NextFunction) => {
  const deprecationInfo = getDeprecationInfo(req.path)
  if (deprecationInfo) {
    const headers = getDeprecationHeaders(deprecationInfo)
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value)
    })
    Logger.apiWarn(`Deprecated endpoint accessed: ${req.path}`, {
      replacement: deprecationInfo.replacement,
      removeAt: deprecationInfo.removeAt,
    })
  }
  next()
})

// Both dev and prod resolve correctly with a single path.dirname(__dirname):
// - Dev: __dirname = apps/shopee-api/src → dirname = apps/shopee-api ✓
// - Prod: __dirname = /app/build (tsc flattens output to build/index.js, 1 level)
//         → dirname = /app ✓ (where the ./upload volume is mounted)
// The old double-dirname assumed a build/src/index.js 2-level layout that tsc does not produce.
const dirNameWithEnv = path.dirname(__dirname)

// Static file caching options for optimal performance
const staticCacheOptions = {
  maxAge: '1y', // Cache for 1 year (images are typically immutable)
  etag: true, // Enable ETag for cache validation
  lastModified: true, // Enable Last-Modified header
  immutable: true, // Mark as immutable (won't change)
}

// Serve static files for images with caching headers
app.use(
  `/${ROUTE_IMAGE}`,
  express.static(path.join(dirNameWithEnv, FOLDER_UPLOAD, FOLDERS.PRODUCT), staticCacheOptions),
)
app.use(
  `/${ROUTE_IMAGE}`,
  express.static(path.join(dirNameWithEnv, FOLDER_UPLOAD), staticCacheOptions),
)

routes.forEach((item) =>
  item.routes.forEach((route) => app.use(item.prefix + route.path, route.route)),
)

// Swagger API Documentation Routes
// Route để serve OpenAPI spec dạng JSON
app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerDocument)
})

// Route để serve Swagger UI
app.get('/api-docs', (req: Request, res: Response) => {
  // Tắt CSP cho trang Swagger UI để load được các script từ CDN
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:;",
  )
  const specUrl = `${req.protocol}://${req.get('host')}/api-docs.json`
  res.send(swaggerUIHtml(specUrl))
})

// ==================== ERROR HANDLING ====================

// 404 handler - route không tồn tại
app.use((req: Request, res: Response, next: NextFunction): void => {
  const error = new ErrorHandler(404, `Route ${req.method} ${req.path} không tồn tại`)
  next(error)
})

// Global error handler - xử lý tất cả errors
app.use((err: any, req: Request, res: Response, _next: NextFunction): void => {
  // Log error
  if (err instanceof ErrorHandler) {
    if (!err.isOperational) {
      Logger.apiWarn('Non-operational error occurred', err.toJSON())
    }
  } else if (err instanceof ServiceError) {
    Logger.apiError('Service error occurred', {
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    })

    const response: Record<string, unknown> = {
      message: err.message,
      code: err.code,
    }

    if (process.env.NODE_ENV === 'development' && err.stack) {
      response.stack = err.stack
    }

    res.status(err.statusCode).json(response)
    return
  } else {
    Logger.apiError('Unexpected error occurred', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    })
  }

  responseError(res, err, req)
})

// ==================== SERVER STARTUP ====================

const PORT = process.env.PORT || 4000

// Create HTTP server from Express app (required for Socket.io)
const httpServer = http.createServer(app)

// Initialize Socket.io with the HTTP server
const io = initializeSocket(httpServer)

/**
 * Async boot sequence: connect to MongoDB first, then start listening.
 * On MongoDB connection failure: log with a clear boot-failure marker and exit(1).
 * This ensures the process never starts serving requests with a disconnected DB.
 */
void (async () => {
  try {
    await connectMongoDB()
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    Logger.apiError('boot dependency failure: MongoDB — initial connection rejected', {
      message: error.message,
      stack: error.stack,
    })
    console.error(
      chalk.red('[BOOT FAILURE] boot dependency failure: MongoDB — initial connection rejected'),
      error,
    )
    process.exit(1)
  }

  httpServer.listen(PORT, () => {
    console.log(chalk.greenBright(`API listening on port ${PORT}!`))
    console.log(chalk.cyanBright(`WebSocket server ready on port ${PORT}`))
    Logger.apiInfo(`Server started on port ${PORT}`, {
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      websocket: true,
    })

    // Register BullMQ repeatable jobs after server is ready
    paymentReconciliationJob.start().catch((err) => {
      Logger.apiError('[index] Failed to register payment reconciliation job', {
        error: err?.message,
      })
    })
    flashSaleScheduler.start().catch((err) => {
      Logger.apiError('[index] Failed to register flash sale scheduler job', {
        error: err?.message,
      })
    })
    refundStatusPollJob.start().catch((err) => {
      Logger.apiError('[index] Failed to register refund status poll job', { error: err?.message })
    })
    analyticsAggregationJob.start().catch((err) => {
      Logger.apiError('[index] Failed to register analytics aggregation job', {
        error: err?.message,
      })
    })
    cleanupJob.start().catch((err) => {
      Logger.apiError('[index] Failed to register cleanup jobs', { error: err?.message })
    })
    searchReindexJob.start().catch((err) => {
      Logger.apiError('[index] Failed to register search reindex job', { error: err?.message })
    })

    // Configure Meilisearch index (idempotent — safe to call on every startup)
    meilisearchService.configureIndex().catch((err) => {
      Logger.apiError('[index] Failed to configure Meilisearch index', { error: err?.message })
    })
  })
})()

// ==================== GRACEFUL SHUTDOWN ====================

// Thời gian chờ tối đa để đóng connections (30 giây)
const SHUTDOWN_TIMEOUT = 30000

/**
 * Xử lý graceful shutdown
 * Đảm bảo server đóng đúng cách khi nhận signal
 */
const gracefulShutdown = async (signal: string) => {
  console.log(chalk.yellow(`\n${signal} received. Starting graceful shutdown...`))
  Logger.apiInfo(`Graceful shutdown initiated`, { signal })

  // Stop flash sale scheduler (removes BullMQ repeatable job)
  flashSaleScheduler.stop()

  // Flush buffered view counts to database before shutdown
  try {
    await viewCounterService.shutdown()
    console.log(chalk.green('View counter service flushed successfully'))
  } catch (error) {
    Logger.apiError('Failed to flush view counts during shutdown', error)
  }

  // Disconnect Redis client
  try {
    await disconnectRedis()
    console.log(chalk.green('Redis client disconnected'))
  } catch (error) {
    Logger.apiError('Failed to disconnect Redis during shutdown', error)
  }

  // Đóng Socket.io connections trước
  io.emit('server_shutdown', { message: 'Server is shutting down' })
  io.close(() => {
    Logger.apiInfo('Socket.io server closed')
  })

  // Ngừng nhận connections mới
  httpServer.close((err) => {
    if (err) {
      Logger.apiError('Error during server close', err)
      process.exit(1)
    }

    console.log(chalk.green('Server closed successfully'))
    Logger.apiInfo('Server closed successfully')

    // Đóng database connections nếu cần
    // mongoose.connection.close() sẽ được gọi ở đây nếu cần

    process.exit(0)
  })

  // Force shutdown nếu quá timeout
  setTimeout(() => {
    console.log(chalk.red('Forced shutdown due to timeout'))
    Logger.apiError('Forced shutdown due to timeout')
    process.exit(1)
  }, SHUTDOWN_TIMEOUT)
}

// Lắng nghe các signals để graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Xử lý uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  Logger.apiError('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
  })
  console.error(chalk.red('Uncaught Exception:'), error)
  gracefulShutdown('uncaughtException')
})

// Xử lý unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  Logger.apiError('Unhandled Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
  })
  console.error(chalk.red('Unhandled Rejection:'), reason)
})
