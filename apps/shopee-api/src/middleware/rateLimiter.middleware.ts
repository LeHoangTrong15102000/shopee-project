import { Request, Response, NextFunction } from 'express'
import { RateLimiterRedis, RateLimiterMemory, RateLimiterAbstract } from 'rate-limiter-flexible'
import { redisClient } from '@utils/redis.client'
import { Logger } from '@utils/logger'

interface RateLimitOptions {
  windowMs: number
  maxRequests: number
  message?: string
  keyPrefix: string
}

/**
 * Build a rate limiter: RateLimiterRedis when Redis is available,
 * RateLimiterMemory otherwise (test env or Redis unavailable at startup).
 */
function buildLimiter(opts: RateLimitOptions): RateLimiterAbstract {
  const points = opts.maxRequests
  const duration = Math.floor(opts.windowMs / 1000)

  if (redisClient) {
    return new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: opts.keyPrefix,
      points,
      duration,
      insuranceLimiter: new RateLimiterMemory({ points, duration }),
    })
  }

  return new RateLimiterMemory({ keyPrefix: opts.keyPrefix, points, duration })
}

// ============ IP whitelist ============

const whitelistSet: Set<string> = (() => {
  const raw = process.env.RATE_LIMIT_WHITELIST_IPS || ''
  const ips = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return new Set(ips)
})()

/**
 * Factory that creates an Express middleware from a RateLimiterAbstract instance.
 * Accepts an optional key resolver; defaults to userId || IP.
 */
function createMiddleware(
  limiter: RateLimiterAbstract,
  message: string,
  keyResolver?: (req: Request) => string,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIP = req.ip || (req as any).connection?.remoteAddress || 'anonymous'

    // IP whitelist bypass
    if (whitelistSet.size > 0 && whitelistSet.has(clientIP)) {
      next()
      return
    }

    const key = keyResolver ? keyResolver(req) : (req.jwtDecoded?.id || clientIP)

    limiter
      .consume(key)
      .then((rateLimiterRes) => {
        res.set({
          'X-RateLimit-Limit': String(limiter.points),
          'X-RateLimit-Remaining': String(rateLimiterRes.remainingPoints),
          'X-RateLimit-Reset': new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString(),
        })
        next()
      })
      .catch((rateLimiterRes) => {
        const retryAfterSecs = rateLimiterRes?.msBeforeNext
          ? Math.ceil(rateLimiterRes.msBeforeNext / 1000)
          : 60
        res.set('Retry-After', String(retryAfterSecs))
        res.status(429).json({ success: false, message })
      })
  }
}

// ============ Env-driven window ============

const windowMs = (Number(process.env.RATE_LIMIT_WINDOW_S) || 60) * 1000

// ============ Limiter instances ============

const testChatbotLimiter = buildLimiter({
  keyPrefix: 'rl:testChatbot',
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
})

const conversationLimiter = buildLimiter({
  keyPrefix: 'rl:conversation',
  windowMs: 5 * 60 * 1000,
  maxRequests: 20,
})

const sendMessageLimiter = buildLimiter({
  keyPrefix: 'rl:sendMessage',
  windowMs: 1 * 60 * 1000,
  maxRequests: 5,
})

const apiLimiter = buildLimiter({
  keyPrefix: 'rl:api',
  windowMs: 1 * 60 * 1000,
  maxRequests: 100,
})

const authLimiter = buildLimiter({
  keyPrefix: 'rl:auth',
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
})

const productsLimiter = buildLimiter({
  keyPrefix: 'rl:products',
  windowMs: 1 * 60 * 1000,
  maxRequests: 60,
})

const purchaseLimiter = buildLimiter({
  keyPrefix: 'rl:purchase',
  windowMs: 1 * 60 * 1000,
  maxRequests: 30,
})

const healthLimiter = buildLimiter({
  keyPrefix: 'rl:health',
  windowMs: 1 * 60 * 1000,
  maxRequests: 120,
})

// ============ Preset limiter instances (env-driven) ============

const publicLimiterInstance = buildLimiter({
  keyPrefix: 'rl:public',
  windowMs,
  maxRequests: Number(process.env.RATE_LIMIT_PUBLIC_MAX) || 200,
})

const authPresetLimiterInstance = buildLimiter({
  keyPrefix: 'rl:authPreset',
  windowMs,
  maxRequests: Number(process.env.RATE_LIMIT_AUTH_MAX) || 15,
})

const adminLimiterInstance = buildLimiter({
  keyPrefix: 'rl:admin',
  windowMs,
  maxRequests: Number(process.env.RATE_LIMIT_ADMIN_MAX) || 300,
})

const expensiveLimiterInstance = buildLimiter({
  keyPrefix: 'rl:expensive',
  windowMs,
  maxRequests: Number(process.env.RATE_LIMIT_EXPENSIVE_MAX) || 30,
})

// ============ Exported middleware map ============

export const rateLimitConfigs = {
  testChatbot: createMiddleware(
    testChatbotLimiter,
    'Bạn đã test chatbot quá nhiều lần. Vui lòng chờ 15 phút rồi thử lại.',
  ),
  conversation: createMiddleware(
    conversationLimiter,
    'Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ ít phút rồi thử lại.',
  ),
  sendMessage: createMiddleware(
    sendMessageLimiter,
    'Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ 1 phút rồi thử lại.',
  ),
  api: createMiddleware(apiLimiter, 'Quá nhiều yêu cầu. Vui lòng thử lại sau.'),
  auth: createMiddleware(authLimiter, 'Quá nhiều lần thử đăng nhập. Vui lòng chờ 15 phút.'),
  products: createMiddleware(productsLimiter, 'Quá nhiều yêu cầu. Vui lòng thử lại sau.'),
  purchase: createMiddleware(purchaseLimiter, 'Quá nhiều yêu cầu mua hàng. Vui lòng thử lại sau.'),
  health: createMiddleware(healthLimiter, 'Quá nhiều yêu cầu health check.'),
}

// ============ Preset middleware exports ============

/**
 * Global baseline limiter — 200 req/min per IP (env: RATE_LIMIT_PUBLIC_MAX).
 * Register as app.use() in index.ts to cover all routes.
 */
export const publicRateLimit = createMiddleware(
  publicLimiterInstance,
  'Too many requests. Please try again later.',
  (req) => req.ip || (req as any).connection?.remoteAddress || 'anonymous',
)

/**
 * Auth endpoint limiter — 15 req/min per IP+email (env: RATE_LIMIT_AUTH_MAX).
 * Apply to POST /auth/login, /register, /forgot-password, /reset-password.
 */
export const authRateLimit = createMiddleware(
  authPresetLimiterInstance,
  'Too many auth attempts. Please wait before trying again.',
  (req) => {
    const ip = req.ip || (req as any).connection?.remoteAddress || 'anonymous'
    const email = req.body?.email || ''
    return email ? `${ip}:${email}` : ip
  },
)

/**
 * Admin endpoint limiter — 300 req/min per authenticated user ID (env: RATE_LIMIT_ADMIN_MAX).
 * Apply at the admin router level.
 */
export const adminRateLimit = createMiddleware(
  adminLimiterInstance,
  'Too many admin requests. Please slow down.',
  (req) => req.jwtDecoded?.id || req.ip || 'anonymous',
)

/**
 * Expensive endpoint limiter — 30 req/min per IP (env: RATE_LIMIT_EXPENSIVE_MAX).
 * Apply to search suggestions and other resource-intensive endpoints.
 */
export const expensiveRateLimit = createMiddleware(
  expensiveLimiterInstance,
  'Too many requests to this endpoint. Please try again later.',
  (req) => req.ip || (req as any).connection?.remoteAddress || 'anonymous',
)

const allLimiters: RateLimiterAbstract[] = [
  testChatbotLimiter,
  conversationLimiter,
  sendMessageLimiter,
  apiLimiter,
  authLimiter,
  productsLimiter,
  purchaseLimiter,
  healthLimiter,
  publicLimiterInstance,
  authPresetLimiterInstance,
  adminLimiterInstance,
  expensiveLimiterInstance,
]

/**
 * Get rate limit stats (for monitoring).
 */
export const getRateLimitStats = () => {
  return allLimiters.map((limiter) => ({
    keyPrefix: limiter.keyPrefix,
    points: limiter.points,
    duration: limiter.duration,
  }))
}

/**
 * Reset all rate limit counters — used for testing.
 */
export const resetAllRateLimits = async (): Promise<void> => {
  // RateLimiterMemory exposes _storage; for Redis limiters the insurance
  // limiter is memory-backed and is what tests exercise.
  // Calling delete on a non-existent key is a no-op, so we just clear the
  // internal storage of each memory limiter directly.
  for (const limiter of allLimiters) {
    if (limiter instanceof RateLimiterMemory) {
      // Access internal storage to clear all keys
      const storage = (limiter as any)._storage
      if (storage && typeof storage.clear === 'function') {
        storage.clear()
      }
    } else if (limiter instanceof RateLimiterRedis) {
      // Clear the insurance limiter (memory-backed)
      const insurance = (limiter as any).insuranceLimiter
      if (insurance instanceof RateLimiterMemory) {
        const storage = (insurance as any)._storage
        if (storage && typeof storage.clear === 'function') {
          storage.clear()
        }
      }
    }
  }
  Logger.chatbotDebug('Rate limits reset')
}

/**
 * Legacy factory kept for backward compatibility.
 * New code should use rateLimitConfigs directly.
 */
export const createChatbotRateLimit = (options: {
  windowMs: number
  maxRequests: number
  message?: string
}) => {
  const limiter = buildLimiter({
    keyPrefix: 'rl:custom',
    windowMs: options.windowMs,
    maxRequests: options.maxRequests,
  })
  return createMiddleware(limiter, options.message ?? 'Too many requests')
}
