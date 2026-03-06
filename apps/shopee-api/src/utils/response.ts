import { Response, Request, NextFunction } from 'express'
import { STATUS } from '@constants/status'
import { COMMON_MESSAGES, ERROR_CODES, ErrorCode } from '@constants/messages'

type ErrorThrow = Record<string, unknown>
type SuccessResponse = Record<string, unknown>

/**
 * Interface cho error response
 */
interface ErrorResponse {
  message: string
  code?: ErrorCode
  data?: unknown
  stack?: string
}

/**
 * Kiểm tra môi trường production
 */
const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production'
}

/**
 * @deprecated Sử dụng asyncHandler từ @utils/async-handler thay thế
 * Wrapper cho async functions để tự động catch errors
 */
export const wrapAsync = (func: Function) => {
  return function (req: Request, res: Response, next: NextFunction): void {
    Promise.resolve(func(req, res, next)).catch(next)
  }
}

/**
 * Interface cho error response JSON
 */
interface ErrorJSON {
  name: string
  message: string
  status: number
  code?: ErrorCode
  error: string | ErrorThrow
  isOperational: boolean
  stack?: string
  timestamp: string
}

/**
 * Base Error Handler class
 * Cải thiện với error codes, stack trace handling và serialization
 */
export class ErrorHandler extends Error {
  status: number
  error: string | ErrorThrow
  isOperational: boolean
  code?: ErrorCode

  constructor(
    status: number,
    error: string | ErrorThrow,
    isOperational = true,
    code?: ErrorCode
  ) {
    super(typeof error === 'string' ? error : COMMON_MESSAGES.ERROR)
    this.status = status
    this.error = error
    this.isOperational = isOperational
    this.code = code

    // Capture stack trace, không bao gồm constructor trong stack
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Serialize error thành JSON object
   * Hữu ích cho logging và API responses
   */
  toJSON(): ErrorJSON {
    const json: ErrorJSON = {
      name: this.name,
      message: this.message,
      status: this.status,
      error: this.error,
      isOperational: this.isOperational,
      timestamp: new Date().toISOString(),
    }

    if (this.code) {
      json.code = this.code
    }

    // Chỉ include stack trong development
    if (!isProduction() && this.stack) {
      json.stack = this.stack
    }

    return json
  }

  // ==================== STATIC FACTORY METHODS ====================

  /**
   * Tạo Validation Error (422)
   */
  static validation(errors: ErrorThrow): ErrorHandler {
    return new ValidationError(errors)
  }

  /**
   * Tạo Not Found Error (404)
   */
  static notFound(message: string = COMMON_MESSAGES.NOT_FOUND): ErrorHandler {
    return new NotFoundError(message)
  }

  /**
   * Tạo Unauthorized Error (401)
   */
  static unauthorized(message: string = 'Bạn không có quyền truy cập'): ErrorHandler {
    return new UnauthorizedError(message)
  }

  /**
   * Tạo Forbidden Error (403)
   */
  static forbidden(message: string = 'Bạn không có quyền thực hiện hành động này'): ErrorHandler {
    return new ForbiddenError(message)
  }

  /**
   * Tạo Bad Request Error (400)
   */
  static badRequest(message: string = COMMON_MESSAGES.BAD_REQUEST): ErrorHandler {
    return new BadRequestError(message)
  }

  /**
   * Tạo Internal Server Error (500)
   */
  static internal(message: string = COMMON_MESSAGES.INTERNAL_SERVER_ERROR): ErrorHandler {
    return new InternalServerError(message)
  }

  /**
   * Tạo error từ error code
   */
  static fromCode(code: ErrorCode, message: string, status: number = STATUS.BAD_REQUEST): ErrorHandler {
    return new ErrorHandler(status, message, true, code)
  }
}

/**
 * Validation Error - 422 Unprocessable Entity
 * Dùng khi dữ liệu đầu vào không hợp lệ
 */
export class ValidationError extends ErrorHandler {
  constructor(errors: ErrorThrow) {
    super(STATUS.UNPROCESSABLE_ENTITY, errors, true, ERROR_CODES.VALIDATION_ERROR)
    this.name = 'ValidationError'
  }
}

/**
 * Not Found Error - 404 Not Found
 * Dùng khi không tìm thấy resource
 */
export class NotFoundError extends ErrorHandler {
  constructor(message: string = COMMON_MESSAGES.NOT_FOUND, code?: ErrorCode) {
    super(STATUS.NOT_FOUND, message, true, code || ERROR_CODES.NOT_FOUND)
    this.name = 'NotFoundError'
  }
}

/**
 * Unauthorized Error - 401 Unauthorized
 * Dùng khi chưa xác thực hoặc token không hợp lệ
 */
export class UnauthorizedError extends ErrorHandler {
  constructor(message: string = 'Bạn không có quyền truy cập', code?: ErrorCode) {
    super(STATUS.UNAUTHORIZED, message, true, code || ERROR_CODES.AUTH_UNAUTHORIZED)
    this.name = 'UnauthorizedError'
  }
}

/**
 * Forbidden Error - 403 Forbidden
 * Dùng khi đã xác thực nhưng không có quyền thực hiện hành động
 */
export class ForbiddenError extends ErrorHandler {
  constructor(message: string = 'Bạn không có quyền thực hiện hành động này') {
    super(STATUS.FORBIDDEN, message, true, ERROR_CODES.AUTH_FORBIDDEN)
    this.name = 'ForbiddenError'
  }
}

/**
 * Bad Request Error - 400 Bad Request
 * Dùng khi request không hợp lệ
 */
export class BadRequestError extends ErrorHandler {
  constructor(message: string = COMMON_MESSAGES.BAD_REQUEST, code?: ErrorCode) {
    super(STATUS.BAD_REQUEST, message, true, code || ERROR_CODES.BAD_REQUEST)
    this.name = 'BadRequestError'
  }
}

/**
 * Internal Server Error - 500 Internal Server Error
 * Dùng cho lỗi hệ thống không mong đợi
 */
export class InternalServerError extends ErrorHandler {
  constructor(message: string = COMMON_MESSAGES.INTERNAL_SERVER_ERROR) {
    super(STATUS.INTERNAL_SERVER_ERROR, message, false, ERROR_CODES.INTERNAL_SERVER_ERROR)
    this.name = 'InternalServerError'
  }
}

/**
 * Conflict Error - 409 Conflict
 * Dùng khi resource đã tồn tại
 */
export class ConflictError extends ErrorHandler {
  constructor(message: string, code?: ErrorCode) {
    super(409, message, true, code)
    this.name = 'ConflictError'
  }
}

/**
 * Too Many Requests Error - 429 Too Many Requests
 * Dùng khi rate limit exceeded
 */
export class TooManyRequestsError extends ErrorHandler {
  constructor(message: string = 'Quá nhiều request, vui lòng thử lại sau') {
    super(STATUS.TOO_MANY_REQUESTS, message, true)
    this.name = 'TooManyRequestsError'
  }
}

/**
 * Xử lý và trả về response lỗi
 * Không leak stack trace trong production
 * Include error code nếu có
 */
export const responseError = (res: Response, error: ErrorHandler | Error) => {
  if (error instanceof ErrorHandler) {
    const status = error.status

    // Case error là string
    if (typeof error.error === 'string') {
      const response: ErrorResponse = { message: error.error }

      // Thêm error code nếu có
      if (error.code) {
        response.code = error.code
      }

      // Chỉ thêm stack trace trong development
      if (!isProduction() && error.stack) {
        response.stack = error.stack
      }

      return res.status(status).send(response)
    }

    // Case error là object (validation errors)
    const response: ErrorResponse = {
      message: COMMON_MESSAGES.ERROR,
      data: error.error,
    }

    // Thêm error code nếu có
    if (error.code) {
      response.code = error.code
    }

    if (!isProduction() && error.stack) {
      response.stack = error.stack
    }

    return res.status(status).send(response)
  }

  // Lỗi không mong đợi - không leak thông tin trong production
  const response: ErrorResponse = {
    message: isProduction() ? COMMON_MESSAGES.INTERNAL_SERVER_ERROR : error.message,
    code: ERROR_CODES.INTERNAL_SERVER_ERROR,
  }

  if (!isProduction() && error.stack) {
    response.stack = error.stack
  }

  return res.status(STATUS.INTERNAL_SERVER_ERROR).send(response)
}

/**
 * Trả về response thành công
 */
export const responseSuccess = (res: Response, data: SuccessResponse | unknown) => {
  return res.status(STATUS.OK).send(data)
}
