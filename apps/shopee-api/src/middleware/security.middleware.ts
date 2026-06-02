import { Request, Response, NextFunction } from 'express'
import { RateLimiterRedis, RateLimiterMemory, RateLimiterAbstract } from 'rate-limiter-flexible'
import { redisClient } from '@utils/redis.client'
import { Logger } from '@utils/logger'
import {
  MAX_REQUEST_SIZE,
  ALLOWED_CONTENT_TYPES,
  SENSITIVE_ENDPOINTS,
} from '@constants/security.config'
import { STATUS } from '@constants/status'

// ============ Brute-force limiter ============

const BRUTE_POINTS = 5
const BRUTE_DURATION = 900 // 15 minutes in seconds

function buildBruteForceLimiter(): RateLimiterAbstract {
  if (redisClient) {
    return new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:brute',
      points: BRUTE_POINTS,
      duration: BRUTE_DURATION,
      insuranceLimiter: new RateLimiterMemory({
        points: BRUTE_POINTS,
        duration: BRUTE_DURATION,
      }),
    })
  }
  return new RateLimiterMemory({
    keyPrefix: 'rl:brute',
    points: BRUTE_POINTS,
    duration: BRUTE_DURATION,
  })
}

const bruteForceLimiter = buildBruteForceLimiter()

// ============ Suspicious activity log (unchanged) ============

interface SuspiciousActivity {
  ip: string
  endpoint: string
  method: string
  timestamp: number
  reason: string
  userAgent?: string
}

const suspiciousActivities: SuspiciousActivity[] = []
const MAX_SUSPICIOUS_LOG = 1000
const REDIS_SUSPICIOUS_KEY = 'sec:suspicious'

/**
 * Lấy IP thực của client (hỗ trợ proxy)
 */
const getClientIP = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.ip || req.socket.remoteAddress || 'unknown'
}

/**
 * Parse size string thành bytes
 */
const parseSize = (size: string): number => {
  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  }
  const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)?$/)
  if (!match) return 10 * 1024 * 1024
  const value = parseInt(match[1], 10)
  const unit = match[2] || 'b'
  return value * units[unit]
}

/**
 * Log hoạt động đáng ngờ — persists to Redis LIST when available, falls back to in-memory.
 */
const logSuspiciousActivity = (req: Request, reason: string): void => {
  const activity: SuspiciousActivity = {
    ip: getClientIP(req),
    endpoint: req.path,
    method: req.method,
    timestamp: Date.now(),
    reason,
    userAgent: req.headers['user-agent'],
  }

  if (redisClient) {
    // LPUSH prepends (newest first), LTRIM keeps the list capped at MAX_SUSPICIOUS_LOG
    redisClient
      .lpush(REDIS_SUSPICIOUS_KEY, JSON.stringify(activity))
      .then(() => redisClient!.ltrim(REDIS_SUSPICIOUS_KEY, 0, MAX_SUSPICIOUS_LOG - 1))
      .catch((err) => {
        Logger.apiError('Failed to write suspicious activity to Redis', err)
        // Fall back to in-memory on Redis error
        suspiciousActivities.push(activity)
        if (suspiciousActivities.length > MAX_SUSPICIOUS_LOG) {
          suspiciousActivities.shift()
        }
      })
  } else {
    suspiciousActivities.push(activity)
    if (suspiciousActivities.length > MAX_SUSPICIOUS_LOG) {
      suspiciousActivities.shift()
    }
  }

  Logger.apiWarn('Hoạt động đáng ngờ được phát hiện', activity)
}

/**
 * Tạo key để track login attempts
 */
export const getLoginAttemptKey = (ip: string, email?: string): string => {
  return email ? `${ip}:${email}` : ip
}

/**
 * Middleware kiểm tra request size limit
 */
export const requestSizeLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const contentLength = req.headers['content-length']
  if (contentLength) {
    const sizeInBytes = parseInt(contentLength, 10)
    const maxSizeInBytes = parseSize(MAX_REQUEST_SIZE)
    if (sizeInBytes > maxSizeInBytes) {
      logSuspiciousActivity(req, 'Request size exceeds limit')
      res.status(STATUS.BAD_REQUEST).json({
        message: 'Request quá lớn. Vui lòng giảm kích thước dữ liệu.',
      })
      return
    }
  }
  next()
}

/**
 * Middleware chống brute force cho login.
 * Uses RateLimiterRedis (with memory insurance) to track failed attempts.
 */
export const bruteForceProtectionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const clientIP = getClientIP(req)
  const email = req.body?.email
  const key = getLoginAttemptKey(clientIP, email)

  bruteForceLimiter
    .get(key)
    .then((rateLimiterRes) => {
      if (rateLimiterRes !== null && rateLimiterRes.consumedPoints >= BRUTE_POINTS) {
        const remainingMs = rateLimiterRes.msBeforeNext
        const remainingMinutes = Math.ceil(remainingMs / 1000 / 60)

        Logger.apiWarn('Tài khoản đang bị khóa do quá nhiều lần đăng nhập thất bại', {
          ip: clientIP,
          email,
          remainingMinutes,
        })

        res.status(STATUS.TOO_MANY_REQUESTS).json({
          message: `Tài khoản tạm thời bị khóa. Vui lòng thử lại sau ${remainingMinutes} phút.`,
        })
        return
      }
      next()
    })
    .catch(() => {
      // On error, allow the request through
      next()
    })
}

/**
 * Ghi nhận login thất bại
 */
export const recordFailedLogin = (ip: string, email?: string): void => {
  const key = getLoginAttemptKey(ip, email)
  bruteForceLimiter.penalty(key, 1).catch((err) => {
    Logger.apiError('Failed to record login attempt', err)
  })
  Logger.apiWarn('Đăng nhập thất bại', { ip, email })
}

/**
 * Reset login attempts sau khi đăng nhập thành công
 */
export const resetLoginAttempts = (ip: string, email?: string): void => {
  const key = getLoginAttemptKey(ip, email)
  bruteForceLimiter.delete(key).catch((err) => {
    Logger.apiError('Failed to reset login attempts', err)
  })
}

/**
 * Reset all login attempts — dùng cho testing
 */
export const resetAllLoginAttempts = (): void => {
  if (bruteForceLimiter instanceof RateLimiterMemory) {
    const storage = (bruteForceLimiter as any)._storage
    if (storage && typeof storage.clear === 'function') {
      storage.clear()
    }
  } else if (bruteForceLimiter instanceof RateLimiterRedis) {
    const insurance = (bruteForceLimiter as any).insuranceLimiter
    if (insurance instanceof RateLimiterMemory) {
      const storage = (insurance as any)._storage
      if (storage && typeof storage.clear === 'function') {
        storage.clear()
      }
    }
  }
}

/**
 * Middleware log các hoạt động đáng ngờ
 */
export const suspiciousActivityMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const clientIP = getClientIP(req)
  const isSensitiveEndpoint = SENSITIVE_ENDPOINTS.some((endpoint) => req.path.includes(endpoint))
  if (isSensitiveEndpoint) {
    Logger.apiInfo('Request đến endpoint nhạy cảm', {
      ip: clientIP,
      method: req.method,
      path: req.path,
      userAgent: req.headers['user-agent'],
    })
  }
  next()
}

/**
 * Middleware validate content-type
 */
export const validateContentTypeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next()
    return
  }
  const contentType = req.headers['content-type']
  if (!contentType && req.headers['content-length'] === '0') {
    next()
    return
  }
  if (contentType) {
    const isValidContentType = ALLOWED_CONTENT_TYPES.some((allowed) =>
      contentType.toLowerCase().includes(allowed),
    )
    if (!isValidContentType) {
      logSuspiciousActivity(req, `Invalid content-type: ${contentType}`)
      res.status(STATUS.UNSUPPORTED_MEDIA_TYPE).json({
        message: 'Content-Type không được hỗ trợ.',
      })
      return
    }
  }
  next()
}

/**
 * Các pattern đáng ngờ trong request
 */
const SUSPICIOUS_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b.*\b(FROM|INTO|TABLE|DATABASE)\b)/i,
  /('|")\s*(OR|AND)\s*('|"|\d)/i,
  /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
  /<script[\s\S]*?>[\s\S]*?<\/script>/i,
  /javascript\s*:/i,
  /on(load|error|click|mouseover|submit|focus|blur)\s*=/i,
  /\.\.\//g,
  /\.\.\\/,
  /[;&|`$]/,
  /\$where|\$gt|\$lt|\$ne|\$regex|\$or|\$and/i,
]

const containsSuspiciousPattern = (value: string): { isSuspicious: boolean; pattern?: string } => {
  if (!value || typeof value !== 'string') return { isSuspicious: false }
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(value)) {
      return { isSuspicious: true, pattern: pattern.toString() }
    }
  }
  return { isSuspicious: false }
}

const checkObjectForSuspiciousPatterns = (
  obj: any,
  path = '',
): { isSuspicious: boolean; field?: string; pattern?: string } => {
  if (!obj || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      const result = containsSuspiciousPattern(obj)
      if (result.isSuspicious) return { isSuspicious: true, field: path, pattern: result.pattern }
    }
    return { isSuspicious: false }
  }
  for (const key of Object.keys(obj)) {
    const currentPath = path ? `${path}.${key}` : key
    const value = obj[key]
    const keyCheck = containsSuspiciousPattern(key)
    if (keyCheck.isSuspicious) {
      return { isSuspicious: true, field: currentPath, pattern: keyCheck.pattern }
    }
    if (typeof value === 'string') {
      const valueCheck = containsSuspiciousPattern(value)
      if (valueCheck.isSuspicious) {
        return { isSuspicious: true, field: currentPath, pattern: valueCheck.pattern }
      }
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const result = checkObjectForSuspiciousPatterns(value[i], `${currentPath}[${i}]`)
        if (result.isSuspicious) return result
      }
    } else if (typeof value === 'object' && value !== null) {
      const result = checkObjectForSuspiciousPatterns(value, currentPath)
      if (result.isSuspicious) return result
    }
  }
  return { isSuspicious: false }
}

/**
 * Middleware kiểm tra suspicious patterns trong request
 */
export const suspiciousPatternMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const urlCheck = containsSuspiciousPattern(req.path)
  if (urlCheck.isSuspicious) {
    logSuspiciousActivity(req, `Suspicious pattern in URL: ${urlCheck.pattern}`)
    res.status(STATUS.BAD_REQUEST).json({ message: 'Request chứa nội dung không hợp lệ.' })
    return
  }
  const queryCheck = checkObjectForSuspiciousPatterns(req.query, 'query')
  if (queryCheck.isSuspicious) {
    logSuspiciousActivity(req, `Suspicious pattern in ${queryCheck.field}: ${queryCheck.pattern}`)
    res.status(STATUS.BAD_REQUEST).json({ message: 'Request chứa nội dung không hợp lệ.' })
    return
  }
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyCheck = checkObjectForSuspiciousPatterns(req.body, 'body')
    if (bodyCheck.isSuspicious) {
      logSuspiciousActivity(req, `Suspicious pattern in ${bodyCheck.field}: ${bodyCheck.pattern}`)
      res.status(STATUS.BAD_REQUEST).json({ message: 'Request chứa nội dung không hợp lệ.' })
      return
    }
  }
  next()
}

/**
 * Lấy danh sách hoạt động đáng ngờ (cho monitoring).
 * Uses Redis LRANGE when available; falls back to in-memory slice.
 */
export const getSuspiciousActivities = async (limit = 100): Promise<SuspiciousActivity[]> => {
  if (redisClient) {
    try {
      const raw = await redisClient.lrange(REDIS_SUSPICIOUS_KEY, 0, limit - 1)
      return raw
        .map((item) => {
          try {
            return JSON.parse(item) as SuspiciousActivity
          } catch {
            return null
          }
        })
        .filter(Boolean) as SuspiciousActivity[]
    } catch (err) {
      Logger.apiError('Failed to read suspicious activities from Redis', err)
      // Fall through to in-memory
    }
  }
  return suspiciousActivities.slice(-limit)
}

/**
 * Lấy thống kê login attempts (cho monitoring)
 */
export const getLoginAttemptStats = () => {
  return {
    limiterType: redisClient ? 'redis' : 'memory',
    points: BRUTE_POINTS,
    duration: BRUTE_DURATION,
  }
}
