import { Request, Response, NextFunction } from 'express'
import { Logger } from '@utils/logger'

// In-memory store for rate limiting (production nên dùng Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

interface RateLimitOptions {
  windowMs: number // Thời gian window (ms)
  maxRequests: number // Số request tối đa trong window
  message?: string // Custom message khi limit
  skipSuccessfulRequests?: boolean // Có skip requests thành công không
}

/**
 * Rate limiting middleware cho chatbot APIs
 */
export const createChatbotRateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    message = 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng chờ ít phút rồi thử lại.',
    skipSuccessfulRequests = false,
  } = options

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Tạo key dựa trên user ID hoặc IP
      const userId = req.jwtDecoded?.id
      const clientIP = req.ip || req.connection.remoteAddress
      const key = userId || clientIP || 'anonymous'

      const now = Date.now()
      const userLimit = requestCounts.get(key)

      // Reset counter nếu đã hết window
      if (!userLimit || now > userLimit.resetTime) {
        requestCounts.set(key, {
          count: 1,
          resetTime: now + windowMs,
        })

        Logger.chatbotDebug('Rate limit reset', {
          key,
          newResetTime: new Date(now + windowMs).toISOString(),
        })

        next()
        return
      }

      // Kiểm tra có vượt limit không
      if (userLimit.count >= maxRequests) {
        const timeUntilReset = Math.ceil((userLimit.resetTime - now) / 1000)

        Logger.chatbotWarn('Rate limit exceeded', {
          key,
          currentCount: userLimit.count,
          maxRequests,
          timeUntilReset,
        })

        res.status(429).json({
          message,
          error: 'Rate limit exceeded',
          retryAfter: timeUntilReset,
          limit: maxRequests,
          remaining: 0,
        })
        return
      }

      // Tăng counter
      userLimit.count += 1
      requestCounts.set(key, userLimit)

      // Thêm headers thông tin rate limit
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': (maxRequests - userLimit.count).toString(),
        'X-RateLimit-Reset': new Date(userLimit.resetTime).toISOString(),
      })

      Logger.chatbotDebug('Rate limit check passed', {
        key,
        currentCount: userLimit.count,
        remaining: maxRequests - userLimit.count,
      })

      next()
    } catch (error) {
      Logger.chatbotError('Rate limiter error', error)
      // Trong trường hợp lỗi, cho phép request đi qua
      next()
    }
  }
}

/**
 * Rate limit configurations cho different endpoints
 */
export const rateLimitConfigs = {
  // Cho test chatbot (không cần auth)
  testChatbot: createChatbotRateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    maxRequests: 10, // 10 requests per 15 min
    message: 'Bạn đã test chatbot quá nhiều lần. Vui lòng chờ 15 phút rồi thử lại.',
  }),

  // Cho conversation APIs (cần auth)
  conversation: createChatbotRateLimit({
    windowMs: 5 * 60 * 1000, // 5 phút
    maxRequests: 20, // 20 requests per 5 min
    message: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ ít phút rồi thử lại.',
  }),

  // Cho sending messages (strict hơn)
  sendMessage: createChatbotRateLimit({
    windowMs: 1 * 60 * 1000, // 1 phút
    maxRequests: 5, // 5 messages per minute
    message: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ 1 phút rồi thử lại.',
  }),

  // General API rate limit
  api: createChatbotRateLimit({
    windowMs: 1 * 60 * 1000, // 1 phút
    maxRequests: 100, // 100 requests per minute
    message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
  }),

  // Auth endpoints (login, register) - strict
  auth: createChatbotRateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    maxRequests: 10, // 10 attempts per 15 min
    message: 'Quá nhiều lần thử đăng nhập. Vui lòng chờ 15 phút.',
  }),

  // Product listing - relaxed
  products: createChatbotRateLimit({
    windowMs: 1 * 60 * 1000, // 1 phút
    maxRequests: 60, // 60 requests per minute
    message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
  }),

  // Purchase/checkout - moderate
  purchase: createChatbotRateLimit({
    windowMs: 1 * 60 * 1000, // 1 phút
    maxRequests: 30, // 30 requests per minute
    message: 'Quá nhiều yêu cầu mua hàng. Vui lòng thử lại sau.',
  }),

  // Health check - very relaxed (for monitoring)
  health: createChatbotRateLimit({
    windowMs: 1 * 60 * 1000, // 1 phút
    maxRequests: 120, // 120 requests per minute
    message: 'Quá nhiều yêu cầu health check.',
  }),
}

/**
 * Cleanup expired entries (chạy định kỳ)
 */
export const cleanupExpiredRateLimits = () => {
  const now = Date.now()

  requestCounts.forEach((limit, key) => {
    if (now > limit.resetTime) {
      requestCounts.delete(key)
    }
  })

  Logger.chatbotDebug('Rate limit cleanup completed', {
    activeKeys: requestCounts.size,
  })
}

/**
 * Get rate limit stats (for monitoring)
 */
export const getRateLimitStats = () => {
  const now = Date.now()
  const activeKeys: Array<[string, { count: number; resetTime: number }]> = []
  requestCounts.forEach((limit, key) => {
    if (now <= limit.resetTime) {
      activeKeys.push([key, limit])
    }
  })

  return {
    totalActiveKeys: activeKeys.length,
    averageRequestsPerKey:
      activeKeys.length > 0
        ? activeKeys.reduce((sum, [, limit]) => sum + limit.count, 0) / activeKeys.length
        : 0,
    topUsers: activeKeys
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([key, limit]) => ({ key, count: limit.count })),
  }
}

// Chạy cleanup mỗi 10 phút
setInterval(cleanupExpiredRateLimits, 10 * 60 * 1000)

/**
 * Reset all rate limit counters — dùng cho testing
 */
export const resetAllRateLimits = (): void => {
  requestCounts.clear()
}
