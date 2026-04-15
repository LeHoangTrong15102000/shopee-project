/**
 * Middleware sanitize input để chống NoSQL injection
 * Áp dụng cho tất cả các request đến API
 */

import { Request, Response, NextFunction } from 'express'
import { sanitizeObject } from '@utils/sanitize'

/**
 * Middleware chính để sanitize tất cả input từ request
 * Xử lý body, query params và route params
 */
export const sanitizeMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Sanitize request body (POST, PUT, PATCH data)
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body)
    }

    // Sanitize query parameters (URL query string)
    // In Express 5, req.query is read-only (getter only), so we sanitize values in-place
    if (req.query && typeof req.query === 'object') {
      const sanitizedQuery = sanitizeObject(req.query)
      for (const key of Object.keys(req.query)) {
        ;(req.query as Record<string, any>)[key] = (sanitizedQuery as Record<string, any>)[key]
      }
    }

    // Sanitize route parameters (URL path params)
    if (req.params && typeof req.params === 'object') {
      const sanitizedParams = sanitizeObject(req.params)
      for (const key of Object.keys(req.params)) {
        ;(req.params as Record<string, any>)[key] = (sanitizedParams as Record<string, any>)[key]
      }
    }

    next()
  } catch (error) {
    // Nếu có lỗi trong quá trình sanitize, vẫn cho request đi tiếp
    // để không block legitimate requests
    console.error('Sanitize middleware error:', error)
    next()
  }
}

/**
 * Middleware sanitize chỉ cho body
 * Dùng khi chỉ cần sanitize body mà không cần query/params
 */
export const sanitizeBodyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body)
    }
    next()
  } catch (error) {
    console.error('Sanitize body middleware error:', error)
    next()
  }
}

/**
 * Middleware sanitize chỉ cho query params
 * Dùng cho các GET requests cần bảo vệ query string
 */
export const sanitizeQueryMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (req.query && typeof req.query === 'object') {
      const sanitizedQuery = sanitizeObject(req.query)
      for (const key of Object.keys(req.query)) {
        ;(req.query as Record<string, any>)[key] = (sanitizedQuery as Record<string, any>)[key]
      }
    }
    next()
  } catch (error) {
    console.error('Sanitize query middleware error:', error)
    next()
  }
}

export default sanitizeMiddleware
