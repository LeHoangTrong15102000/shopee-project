import { Response } from 'express'
import { STATUS } from '@constants/status'
import { COMMON_MESSAGES } from '@constants/messages'

/**
 * Interface cho response data chuẩn
 */
interface SuccessResponseData<T = any> {
  message: string
  data?: T
}

interface ErrorResponseData {
  message: string
  data?: Record<string, any>
  errors?: Record<string, string>
}

interface PaginationInfo {
  page: number
  limit: number
  page_size: number
  total?: number
  total_pages?: number
}

interface PaginatedResponseData<T = any> {
  message: string
  data: T[]
  pagination: PaginationInfo
}

/**
 * Class ApiResponse cung cấp các static methods để tạo response chuẩn
 * Đảm bảo format response nhất quán trong toàn bộ API
 */
export class ApiResponse {
  /**
   * Response thành công với data
   * @param res - Express Response object
   * @param data - Data trả về
   * @param message - Message thành công (mặc định: 'Thành công')
   * @param statusCode - HTTP status code (mặc định: 200)
   */
  static success<T = any>(
    res: Response,
    data: T,
    message: string = COMMON_MESSAGES.SUCCESS,
    statusCode: number = STATUS.OK
  ): Response {
    const response: SuccessResponseData<T> = {
      message,
      data,
    }
    return res.status(statusCode).json(response)
  }

  /**
   * Response lỗi
   * @param res - Express Response object
   * @param message - Message lỗi
   * @param statusCode - HTTP status code (mặc định: 400)
   * @param errors - Object chứa chi tiết lỗi theo field
   */
  static error(
    res: Response,
    message: string = COMMON_MESSAGES.ERROR,
    statusCode: number = STATUS.BAD_REQUEST,
    errors?: Record<string, string>
  ): Response {
    const response: ErrorResponseData = {
      message,
    }
    if (errors) {
      response.data = errors
    }
    return res.status(statusCode).json(response)
  }

  /**
   * Response với pagination
   * @param res - Express Response object
   * @param data - Array data trả về
   * @param pagination - Thông tin pagination
   * @param message - Message thành công
   */
  static paginated<T = any>(
    res: Response,
    data: T[],
    pagination: PaginationInfo,
    message: string = COMMON_MESSAGES.SUCCESS
  ): Response {
    const response: PaginatedResponseData<T> = {
      message,
      data,
      pagination,
    }
    return res.status(STATUS.OK).json(response)
  }

  /**
   * Response khi tạo resource thành công (201 Created)
   * @param res - Express Response object
   * @param data - Data của resource vừa tạo
   * @param message - Message thành công (mặc định: 'Tạo thành công')
   */
  static created<T = any>(
    res: Response,
    data: T,
    message: string = COMMON_MESSAGES.CREATED
  ): Response {
    return ApiResponse.success(res, data, message, 201)
  }

  /**
   * Response không có content (204 No Content)
   * Thường dùng cho DELETE thành công
   * @param res - Express Response object
   */
  static noContent(res: Response): Response {
    return res.status(204).send()
  }

  /**
   * Response unauthorized (401)
   * @param res - Express Response object
   * @param message - Message lỗi
   */
  static unauthorized(
    res: Response,
    message: string = 'Bạn không có quyền truy cập'
  ): Response {
    return ApiResponse.error(res, message, STATUS.UNAUTHORIZED)
  }

  /**
   * Response forbidden (403)
   * @param res - Express Response object
   * @param message - Message lỗi
   */
  static forbidden(
    res: Response,
    message: string = 'Bạn không có quyền thực hiện hành động này'
  ): Response {
    return ApiResponse.error(res, message, STATUS.FORBIDDEN)
  }

  /**
   * Response not found (404)
   * @param res - Express Response object
   * @param message - Message lỗi
   */
  static notFound(
    res: Response,
    message: string = COMMON_MESSAGES.NOT_FOUND
  ): Response {
    return ApiResponse.error(res, message, STATUS.NOT_FOUND)
  }

  /**
   * Response validation error (422)
   * @param res - Express Response object
   * @param errors - Object chứa chi tiết lỗi validation theo field
   * @param message - Message lỗi
   */
  static validationError(
    res: Response,
    errors: Record<string, string>,
    message: string = COMMON_MESSAGES.VALIDATION_ERROR
  ): Response {
    return ApiResponse.error(res, message, STATUS.UNPROCESSABLE_ENTITY, errors)
  }
}

export default ApiResponse

