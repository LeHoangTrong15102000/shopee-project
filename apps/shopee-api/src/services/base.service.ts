import { Types } from 'mongoose'
import {
  PaginatedResult,
  PaginationOptions,
} from '@repositories/interfaces/base.repository.interface'

/**
 * Base service class providing common utilities for all services
 */
export abstract class BaseService {
  /**
   * Validate MongoDB ObjectId format
   */
  protected isValidObjectId(id: string | Types.ObjectId): boolean {
    return Types.ObjectId.isValid(id.toString())
  }

  /**
   * Convert string to ObjectId safely
   */
  protected toObjectId(id: string | Types.ObjectId): Types.ObjectId {
    return new Types.ObjectId(id.toString())
  }

  /**
   * Normalize pagination options with defaults
   */
  protected normalizePagination(options: Partial<PaginationOptions>): PaginationOptions {
    return {
      page: Math.max(1, options.page || 1),
      limit: Math.min(100, Math.max(1, options.limit || 30)),
      sort: options.sort,
    }
  }

  /**
   * Create empty paginated result
   */
  protected emptyPaginatedResult<T>(options: PaginationOptions): PaginatedResult<T> {
    return {
      data: [],
      pagination: {
        page: options.page,
        limit: options.limit,
        page_size: 1,
        total: 0,
      },
    }
  }
}

/**
 * Service error types for consistent error handling
 */
export class ServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

export class NotFoundError extends ServiceError {
  constructor(resource: string, id?: string) {
    super('NOT_FOUND', id ? `${resource} with id ${id} not found` : `${resource} not found`, 404)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends ServiceError {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super('VALIDATION_ERROR', message, 422)
    this.name = 'ValidationError'
  }
}

export class ConflictError extends ServiceError {
  constructor(message: string) {
    super('CONFLICT', message, 409)
    this.name = 'ConflictError'
  }
}

export class UnauthorizedError extends ServiceError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class BusinessError extends ServiceError {
  constructor(message: string) {
    super('BUSINESS_ERROR', message, 400)
    this.name = 'BusinessError'
  }
}

export class ForbiddenError extends ServiceError {
  constructor(message = 'Bạn không có quyền thực hiện hành động này') {
    super('FORBIDDEN', message, 403)
    this.name = 'ForbiddenError'
  }
}
