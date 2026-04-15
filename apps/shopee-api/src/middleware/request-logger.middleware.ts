import { Request, Response, NextFunction } from 'express'
import { Logger } from '@utils/logger'

/**
 * Danh sách các fields nhạy cảm cần loại bỏ khỏi logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'confirmPassword',
  'confirm_password',
  'token',
  'access_token',
  'refresh_token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'creditCard',
  'credit_card',
  'cvv',
  'ssn',
  'secret',
  'apiKey',
  'api_key',
]

/**
 * Danh sách các paths không cần log chi tiết (health check, static files, etc.)
 */
const EXCLUDED_PATHS = ['/health', '/favicon.ico', '/api-docs', '/api-docs.json']

/**
 * Loại bỏ sensitive data từ object
 * @param obj - Object cần sanitize
 * @returns Object đã được sanitize
 */
const sanitizeData = (obj: any): any => {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeData)
  }

  const sanitized: Record<string, any> = {}

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase()

    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Lấy IP address từ request
 */
const getClientIP = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.ip || req.socket.remoteAddress || 'unknown'
}

/**
 * Interface cho request log data
 */
interface RequestLogData {
  method: string
  url: string
  ip: string
  userAgent: string
  userId?: string
  query?: Record<string, any>
  body?: Record<string, any>
  responseTime?: number
  statusCode?: number
  contentLength?: string
}

/**
 * Request Logger Middleware
 * Log tất cả incoming requests với response time
 * Tự động loại bỏ sensitive data từ logs
 */
export const requestLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Bỏ qua các paths không cần log
  if (EXCLUDED_PATHS.some((path) => req.path.startsWith(path))) {
    return next()
  }

  const startTime = Date.now()

  // Lấy thông tin request
  const logData: RequestLogData = {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: getClientIP(req),
    userAgent: req.headers['user-agent'] || 'unknown',
  }

  // Thêm user ID nếu có (sau khi auth middleware chạy)
  if (req.jwtDecoded?.id) {
    logData.userId = req.jwtDecoded.id
  }

  // Sanitize và log query params (chỉ trong development)
  if (process.env.NODE_ENV !== 'production' && Object.keys(req.query).length > 0) {
    logData.query = sanitizeData(req.query)
  }

  // Sanitize và log body (chỉ trong development, và chỉ với POST/PUT/PATCH)
  if (
    process.env.NODE_ENV !== 'production' &&
    ['POST', 'PUT', 'PATCH'].includes(req.method) &&
    req.body &&
    Object.keys(req.body).length > 0
  ) {
    logData.body = sanitizeData(req.body)
  }

  // Log request đến
  Logger.request(req.method, req.originalUrl || req.url, logData.userId, {
    ip: logData.ip,
  })

  // Override res.end để log response
  const originalEnd = res.end.bind(res)

  res.end = function (chunk?: any, encoding?: any, callback?: any): Response {
    const responseTime = Date.now() - startTime

    logData.responseTime = responseTime
    logData.statusCode = res.statusCode
    logData.contentLength = res.get('Content-Length') || '0'

    // Log response với màu theo status code
    const logLevel = res.statusCode >= 400 ? 'error' : 'info'

    if (logLevel === 'error') {
      Logger.apiError(`${req.method} ${req.originalUrl} - ${res.statusCode} (${responseTime}ms)`, {
        ...logData,
      })
    } else {
      Logger.apiInfo(`${req.method} ${req.originalUrl} - ${res.statusCode} (${responseTime}ms)`)
    }

    return originalEnd(chunk, encoding, callback)
  }

  next()
}

export default requestLoggerMiddleware
