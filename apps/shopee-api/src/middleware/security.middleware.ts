import { Request, Response, NextFunction } from 'express'
import { Logger } from '@utils/logger'
import {
  MAX_LOGIN_ATTEMPTS,
  LOGIN_LOCKOUT_TIME,
  MAX_REQUEST_SIZE,
  ALLOWED_CONTENT_TYPES,
  SENSITIVE_ENDPOINTS,
} from '@constants/security.config'
import { STATUS } from '@constants/status'

// Lưu trữ số lần đăng nhập thất bại theo IP/email (production nên dùng Redis)
interface LoginAttempt {
  count: number
  firstAttempt: number
  lastAttempt: number
  lockedUntil?: number
}

const loginAttempts = new Map<string, LoginAttempt>()

// Lưu trữ các hoạt động đáng ngờ
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
 * Ví dụ: '10mb' -> 10485760
 */
const parseSize = (size: string): number => {
  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  }

  const match = size.toLowerCase().match(/^(\d+)(b|kb|mb|gb)?$/)
  if (!match) return 10 * 1024 * 1024 // Default 10MB

  const value = parseInt(match[1], 10)
  const unit = match[2] || 'b'

  return value * units[unit]
}

/**
 * Log hoạt động đáng ngờ
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

  suspiciousActivities.push(activity)

  // Giới hạn số lượng log trong memory
  if (suspiciousActivities.length > MAX_SUSPICIOUS_LOG) {
    suspiciousActivities.shift()
  }

  Logger.apiWarn('Hoạt động đáng ngờ được phát hiện', activity)
}

/**
 * Tạo key để track login attempts
 * Kết hợp IP và email để tránh bypass bằng cách đổi email
 */
export const getLoginAttemptKey = (ip: string, email?: string): string => {
  return email ? `${ip}:${email}` : ip
}

/**
 * Middleware kiểm tra request size limit
 * Ngăn chặn các request quá lớn có thể gây DoS
 */
export const requestSizeLimitMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
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
 * Middleware chống brute force cho login
 * Track số lần đăng nhập thất bại và khóa tạm thời
 */
export const bruteForceProtectionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const clientIP = getClientIP(req)
  const email = req.body?.email
  const key = getLoginAttemptKey(clientIP, email)

  const attempt = loginAttempts.get(key)
  const now = Date.now()

  // Kiểm tra nếu đang bị khóa
  if (attempt?.lockedUntil && now < attempt.lockedUntil) {
    const remainingTime = Math.ceil((attempt.lockedUntil - now) / 1000 / 60)

    Logger.apiWarn('Tài khoản đang bị khóa do quá nhiều lần đăng nhập thất bại', {
      ip: clientIP,
      email,
      remainingMinutes: remainingTime,
    })

    res.status(STATUS.TOO_MANY_REQUESTS).json({
      message: `Tài khoản tạm thời bị khóa. Vui lòng thử lại sau ${remainingTime} phút.`,
    })
    return
  }

  // Reset nếu đã hết thời gian lockout
  if (attempt?.lockedUntil && now >= attempt.lockedUntil) {
    loginAttempts.delete(key)
  }

  // Kiểm tra số lần thử trong window time
  if (attempt && now - attempt.firstAttempt < LOGIN_LOCKOUT_TIME) {
    if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
      // Khóa tài khoản
      attempt.lockedUntil = now + LOGIN_LOCKOUT_TIME
      loginAttempts.set(key, attempt)

      logSuspiciousActivity(req, 'Brute force attack detected - account locked')

      res.status(STATUS.TOO_MANY_REQUESTS).json({
        message: `Quá nhiều lần đăng nhập thất bại. Tài khoản bị khóa trong 15 phút.`,
      })
      return
    }
  }

  next()
}

/**
 * Ghi nhận login thất bại
 * Được gọi từ auth controller khi đăng nhập thất bại
 */
export const recordFailedLogin = (ip: string, email?: string): void => {
  const key = getLoginAttemptKey(ip, email)
  const now = Date.now()
  const attempt = loginAttempts.get(key)

  if (!attempt || now - attempt.firstAttempt >= LOGIN_LOCKOUT_TIME) {
    loginAttempts.set(key, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    })
  } else {
    attempt.count += 1
    attempt.lastAttempt = now
    loginAttempts.set(key, attempt)
  }

  Logger.apiWarn('Đăng nhập thất bại', {
    ip,
    email,
    attemptCount: loginAttempts.get(key)?.count,
  })
}

/**
 * Reset login attempts sau khi đăng nhập thành công
 */
export const resetLoginAttempts = (ip: string, email?: string): void => {
  const key = getLoginAttemptKey(ip, email)
  loginAttempts.delete(key)
}

/**
 * Reset all login attempts — dùng cho testing
 */
export const resetAllLoginAttempts = (): void => {
  loginAttempts.clear()
}

/**
 * Middleware log các hoạt động đáng ngờ
 */
export const suspiciousActivityMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const clientIP = getClientIP(req)
  const isSensitiveEndpoint = SENSITIVE_ENDPOINTS.some((endpoint) =>
    req.path.includes(endpoint)
  )

  // Log các request đến endpoint nhạy cảm
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
 * Chỉ cho phép các content-type hợp lệ
 */
export const validateContentTypeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Bỏ qua GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next()
    return
  }

  const contentType = req.headers['content-type']

  // Nếu không có body thì không cần check content-type
  if (!contentType && req.headers['content-length'] === '0') {
    next()
    return
  }

  // Kiểm tra content-type có hợp lệ không
  if (contentType) {
    const isValidContentType = ALLOWED_CONTENT_TYPES.some((allowed) =>
      contentType.toLowerCase().includes(allowed)
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
 * Các pattern đáng ngờ trong request (SQL injection, XSS, path traversal, etc.)
 */
const SUSPICIOUS_PATTERNS = [
  // SQL Injection patterns
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b.*\b(FROM|INTO|TABLE|DATABASE)\b)/i,
  /('|")\s*(OR|AND)\s*('|"|\d)/i,
  /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i,
  // XSS patterns
  /<script[\s\S]*?>[\s\S]*?<\/script>/i,
  /javascript\s*:/i,
  /on(load|error|click|mouseover|submit|focus|blur)\s*=/i,
  // Path traversal patterns
  /\.\.\//g,
  /\.\.\\/,
  // Command injection patterns
  /[;&|`$]/,
  // NoSQL injection patterns
  /\$where|\$gt|\$lt|\$ne|\$regex|\$or|\$and/i,
]

/**
 * Kiểm tra string có chứa pattern đáng ngờ không
 */
const containsSuspiciousPattern = (value: string): { isSuspicious: boolean; pattern?: string } => {
  if (!value || typeof value !== 'string') {
    return { isSuspicious: false }
  }

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(value)) {
      return { isSuspicious: true, pattern: pattern.toString() }
    }
  }

  return { isSuspicious: false }
}

/**
 * Đệ quy kiểm tra object có chứa pattern đáng ngờ không
 */
const checkObjectForSuspiciousPatterns = (
  obj: any,
  path: string = ''
): { isSuspicious: boolean; field?: string; pattern?: string } => {
  if (!obj || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      const result = containsSuspiciousPattern(obj)
      if (result.isSuspicious) {
        return { isSuspicious: true, field: path, pattern: result.pattern }
      }
    }
    return { isSuspicious: false }
  }

  for (const key of Object.keys(obj)) {
    const currentPath = path ? `${path}.${key}` : key
    const value = obj[key]

    // Kiểm tra key có đáng ngờ không
    const keyCheck = containsSuspiciousPattern(key)
    if (keyCheck.isSuspicious) {
      return { isSuspicious: true, field: currentPath, pattern: keyCheck.pattern }
    }

    // Kiểm tra value
    if (typeof value === 'string') {
      const valueCheck = containsSuspiciousPattern(value)
      if (valueCheck.isSuspicious) {
        return { isSuspicious: true, field: currentPath, pattern: valueCheck.pattern }
      }
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const result = checkObjectForSuspiciousPatterns(value[i], `${currentPath}[${i}]`)
        if (result.isSuspicious) {
          return result
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      const result = checkObjectForSuspiciousPatterns(value, currentPath)
      if (result.isSuspicious) {
        return result
      }
    }
  }

  return { isSuspicious: false }
}

/**
 * Middleware kiểm tra suspicious patterns trong request
 * Phát hiện SQL injection, XSS, path traversal, command injection
 */
export const suspiciousPatternMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Kiểm tra URL path
  const urlCheck = containsSuspiciousPattern(req.path)
  if (urlCheck.isSuspicious) {
    logSuspiciousActivity(req, `Suspicious pattern in URL: ${urlCheck.pattern}`)
    res.status(STATUS.BAD_REQUEST).json({
      message: 'Request chứa nội dung không hợp lệ.',
    })
    return
  }

  // Kiểm tra query params
  const queryCheck = checkObjectForSuspiciousPatterns(req.query, 'query')
  if (queryCheck.isSuspicious) {
    logSuspiciousActivity(
      req,
      `Suspicious pattern in ${queryCheck.field}: ${queryCheck.pattern}`
    )
    res.status(STATUS.BAD_REQUEST).json({
      message: 'Request chứa nội dung không hợp lệ.',
    })
    return
  }

  // Kiểm tra body (nếu có)
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyCheck = checkObjectForSuspiciousPatterns(req.body, 'body')
    if (bodyCheck.isSuspicious) {
      logSuspiciousActivity(
        req,
        `Suspicious pattern in ${bodyCheck.field}: ${bodyCheck.pattern}`
      )
      res.status(STATUS.BAD_REQUEST).json({
        message: 'Request chứa nội dung không hợp lệ.',
      })
      return
    }
  }

  next()
}

/**
 * Lấy danh sách hoạt động đáng ngờ (cho monitoring)
 */
export const getSuspiciousActivities = (limit: number = 100): SuspiciousActivity[] => {
  return suspiciousActivities.slice(-limit)
}

/**
 * Lấy thống kê login attempts (cho monitoring)
 */
export const getLoginAttemptStats = () => {
  const now = Date.now()
  const stats = {
    totalTracked: loginAttempts.size,
    lockedAccounts: 0,
    activeAttempts: 0,
  }

  loginAttempts.forEach((attempt) => {
    if (attempt.lockedUntil && now < attempt.lockedUntil) {
      stats.lockedAccounts++
    }
    if (now - attempt.firstAttempt < LOGIN_LOCKOUT_TIME) {
      stats.activeAttempts++
    }
  })

  return stats
}

/**
 * Cleanup expired login attempts (chạy định kỳ)
 */
export const cleanupExpiredLoginAttempts = (): void => {
  const now = Date.now()

  loginAttempts.forEach((attempt, key) => {
    // Xóa nếu đã hết thời gian lockout và không còn trong window
    if (
      (!attempt.lockedUntil || now >= attempt.lockedUntil) &&
      now - attempt.firstAttempt >= LOGIN_LOCKOUT_TIME
    ) {
      loginAttempts.delete(key)
    }
  })

  Logger.apiInfo('Đã cleanup login attempts', {
    remainingEntries: loginAttempts.size,
  })
}

// Chạy cleanup mỗi 30 phút
setInterval(cleanupExpiredLoginAttempts, 30 * 60 * 1000)

