/// <reference types="jest" />
import { Types } from 'mongoose'
import {
  BaseService,
  ServiceError,
  NotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
  BusinessError,
} from '@services/base.service'
import { PaginationOptions } from '@repositories/interfaces/base.repository.interface'

class TestService extends BaseService {
  public testIsValidObjectId(id: string | Types.ObjectId) {
    return this.isValidObjectId(id)
  }
  public testToObjectId(id: string | Types.ObjectId) {
    return this.toObjectId(id)
  }
  public testNormalizePagination(options: Partial<PaginationOptions>) {
    return this.normalizePagination(options)
  }
  public testEmptyPaginatedResult<T>(options: PaginationOptions) {
    return this.emptyPaginatedResult<T>(options)
  }
}

describe('BaseService', () => {
  const service = new TestService()

  describe('isValidObjectId', () => {
    it('returns true for valid ObjectId string', () => {
      expect(service.testIsValidObjectId('507f1f77bcf86cd799439011')).toBe(true)
    })
    it('returns false for invalid string', () => {
      expect(service.testIsValidObjectId('invalid')).toBe(false)
    })
    it('returns true for ObjectId instance', () => {
      expect(service.testIsValidObjectId(new Types.ObjectId())).toBe(true)
    })
  })

  describe('toObjectId', () => {
    it('converts string to ObjectId', () => {
      const result = service.testToObjectId('507f1f77bcf86cd799439011')
      expect(result).toBeInstanceOf(Types.ObjectId)
      expect(result.toString()).toBe('507f1f77bcf86cd799439011')
    })
    it('returns ObjectId from ObjectId instance', () => {
      const oid = new Types.ObjectId()
      const result = service.testToObjectId(oid)
      expect(result).toBeInstanceOf(Types.ObjectId)
      expect(result.toString()).toBe(oid.toString())
    })
  })

  describe('normalizePagination', () => {
    it('uses defaults when no options provided', () => {
      expect(service.testNormalizePagination({})).toEqual({ page: 1, limit: 30 })
    })
    it('respects provided values', () => {
      expect(service.testNormalizePagination({ page: 5, limit: 20, sort: { name: 1 } })).toEqual({
        page: 5,
        limit: 20,
        sort: { name: 1 },
      })
    })
    it('enforces page minimum of 1', () => {
      expect(service.testNormalizePagination({ page: 0 }).page).toBe(1)
      expect(service.testNormalizePagination({ page: -1 }).page).toBe(1)
    })
    it('enforces limit max of 100', () => {
      expect(service.testNormalizePagination({ limit: 200 }).limit).toBe(100)
    })
    it('enforces limit min of 1', () => {
      // Note: limit 0 is falsy so || 30 kicks in, resulting in 30 (default)
      expect(service.testNormalizePagination({ limit: 0 }).limit).toBe(30)
      // Negative limit: Math.max(1, Math.min(100, -5)) = Math.max(1, -5) = 1
      expect(service.testNormalizePagination({ limit: -5 }).limit).toBe(1)
    })
  })

  describe('emptyPaginatedResult', () => {
    it('returns correct structure', () => {
      const result = service.testEmptyPaginatedResult<string>({ page: 2, limit: 10 })
      expect(result).toEqual({
        data: [],
        pagination: { page: 2, limit: 10, page_size: 1, total: 0 },
      })
    })
  })
})

describe('Error Classes', () => {
  describe('ServiceError', () => {
    it('sets code, message, statusCode, and name', () => {
      const error = new ServiceError('TEST_CODE', 'Test message', 500)
      expect(error.code).toBe('TEST_CODE')
      expect(error.message).toBe('Test message')
      expect(error.statusCode).toBe(500)
      expect(error.name).toBe('ServiceError')
    })
  })

  describe('NotFoundError', () => {
    it('formats message with id', () => {
      const error = new NotFoundError('User', '123')
      expect(error.code).toBe('NOT_FOUND')
      expect(error.statusCode).toBe(404)
      expect(error.message).toBe('User with id 123 not found')
    })
    it('formats message without id', () => {
      const error = new NotFoundError('User')
      expect(error.message).toBe('User not found')
    })
  })

  describe('ValidationError', () => {
    it('sets field when provided', () => {
      const error = new ValidationError('Invalid email', 'email')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.statusCode).toBe(422)
      expect(error.message).toBe('Invalid email')
      expect(error.field).toBe('email')
    })
  })

  describe('ConflictError', () => {
    it('sets correct code and statusCode', () => {
      const error = new ConflictError('Already exists')
      expect(error.code).toBe('CONFLICT')
      expect(error.statusCode).toBe(409)
      expect(error.message).toBe('Already exists')
    })
  })

  describe('UnauthorizedError', () => {
    it('uses default message', () => {
      const error = new UnauthorizedError()
      expect(error.code).toBe('UNAUTHORIZED')
      expect(error.statusCode).toBe(401)
      expect(error.message).toBe('Unauthorized')
    })
    it('uses custom message', () => {
      const error = new UnauthorizedError('Token expired')
      expect(error.message).toBe('Token expired')
    })
  })

  describe('BusinessError', () => {
    it('sets correct code and statusCode', () => {
      const error = new BusinessError('Business rule violated')
      expect(error.code).toBe('BUSINESS_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error.message).toBe('Business rule violated')
    })
  })
})
