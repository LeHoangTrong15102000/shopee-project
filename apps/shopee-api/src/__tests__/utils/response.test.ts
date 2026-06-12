/// <reference types="jest" />
import { Response, Request } from 'express'
import {
  ErrorHandler,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  InternalServerError,
  ConflictError,
  TooManyRequestsError,
  responseError,
  responseSuccess,
} from '@utils/response'
import { STATUS } from '@constants/status'
import { COMMON_MESSAGES, ERROR_CODES } from '@constants/messages'
import { createMockResponse } from '../setup'

// Mock Logger to verify logging calls
jest.mock('@utils/logger', () => ({
  Logger: {
    apiError: jest.fn(),
    apiWarn: jest.fn(),
    apiInfo: jest.fn(),
  },
}))

import { Logger } from '@utils/logger'

describe('ErrorHandler', () => {
  it('constructor sets properties correctly with string error', () => {
    const error = new ErrorHandler(400, 'Test error', true, ERROR_CODES.BAD_REQUEST)
    expect(error.status).toBe(400)
    expect(error.error).toBe('Test error')
    expect(error.isOperational).toBe(true)
    expect(error.code).toBe(ERROR_CODES.BAD_REQUEST)
    expect(error.message).toBe('Test error')
  })

  it('constructor sets properties correctly with object error', () => {
    const errorData = { field: 'email', message: 'Invalid email' }
    const error = new ErrorHandler(422, errorData, true, ERROR_CODES.VALIDATION_ERROR)
    expect(error.status).toBe(422)
    expect(error.error).toEqual(errorData)
    expect(error.isOperational).toBe(true)
    expect(error.message).toBe(COMMON_MESSAGES.ERROR)
  })

  it('toJSON returns correct structure', () => {
    const error = new ErrorHandler(400, 'Test error', true, ERROR_CODES.BAD_REQUEST)
    const json = error.toJSON()
    expect(json.name).toBe('Error')
    expect(json.message).toBe('Test error')
    expect(json.status).toBe(400)
    expect(json.error).toBe('Test error')
    expect(json.isOperational).toBe(true)
    expect(json.code).toBe(ERROR_CODES.BAD_REQUEST)
    expect(json.timestamp).toBeDefined()
  })

  it('validation returns ValidationError with 422', () => {
    const errors = { email: 'Invalid email' }
    const error = ErrorHandler.validation(errors)
    expect(error).toBeInstanceOf(ValidationError)
    expect(error.status).toBe(STATUS.UNPROCESSABLE_ENTITY)
    expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR)
  })

  it('notFound returns NotFoundError with 404', () => {
    const error = ErrorHandler.notFound('Resource not found')
    expect(error).toBeInstanceOf(NotFoundError)
    expect(error.status).toBe(STATUS.NOT_FOUND)
    expect(error.code).toBe(ERROR_CODES.NOT_FOUND)
  })

  it('unauthorized returns UnauthorizedError with 401', () => {
    const error = ErrorHandler.unauthorized('Not authorized')
    expect(error).toBeInstanceOf(UnauthorizedError)
    expect(error.status).toBe(STATUS.UNAUTHORIZED)
    expect(error.code).toBe(ERROR_CODES.AUTH_UNAUTHORIZED)
  })

  it('forbidden returns ForbiddenError with 403', () => {
    const error = ErrorHandler.forbidden('Access denied')
    expect(error).toBeInstanceOf(ForbiddenError)
    expect(error.status).toBe(STATUS.FORBIDDEN)
    expect(error.code).toBe(ERROR_CODES.AUTH_FORBIDDEN)
  })

  it('badRequest returns BadRequestError with 400', () => {
    const error = ErrorHandler.badRequest('Invalid request')
    expect(error).toBeInstanceOf(BadRequestError)
    expect(error.status).toBe(STATUS.BAD_REQUEST)
    expect(error.code).toBe(ERROR_CODES.BAD_REQUEST)
  })

  it('internal returns InternalServerError with 500', () => {
    const error = ErrorHandler.internal('Server error')
    expect(error).toBeInstanceOf(InternalServerError)
    expect(error.status).toBe(STATUS.INTERNAL_SERVER_ERROR)
    expect(error.code).toBe(ERROR_CODES.INTERNAL_SERVER_ERROR)
  })

  it('fromCode creates error with custom code', () => {
    const error = ErrorHandler.fromCode(ERROR_CODES.AUTH_EMAIL_EXISTS, 'Email exists', 409)
    expect(error.status).toBe(409)
    expect(error.code).toBe(ERROR_CODES.AUTH_EMAIL_EXISTS)
    expect(error.error).toBe('Email exists')
  })
})

describe('TooManyRequestsError', () => {
  it('creates with 429 status', () => {
    const error = new TooManyRequestsError('Rate limit exceeded')
    expect(error.status).toBe(STATUS.TOO_MANY_REQUESTS)
    expect(error.name).toBe('TooManyRequestsError')
  })
})

describe('ConflictError', () => {
  it('creates with 409 status', () => {
    const error = new ConflictError('Resource already exists')
    expect(error.status).toBe(409)
    expect(error.name).toBe('ConflictError')
  })
})

describe('responseError', () => {
  it('ErrorHandler with string error sends correct response', () => {
    const res = createMockResponse() as Response
    const error = new ErrorHandler(400, 'Bad request', true, ERROR_CODES.BAD_REQUEST)
    responseError(res, error)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Bad request',
        code: ERROR_CODES.BAD_REQUEST,
      }),
    )
  })

  it('ErrorHandler with object error sends response with data', () => {
    const res = createMockResponse() as Response
    const errorData = { email: 'Invalid email' }
    const error = new ValidationError(errorData)
    responseError(res, error)
    expect(res.status).toHaveBeenCalledWith(STATUS.UNPROCESSABLE_ENTITY)
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: COMMON_MESSAGES.ERROR,
        data: errorData,
        code: ERROR_CODES.VALIDATION_ERROR,
      }),
    )
  })

  it('generic Error sends 500', () => {
    const res = createMockResponse() as Response
    const error = new Error('Unexpected error')
    responseError(res, error)
    expect(res.status).toHaveBeenCalledWith(STATUS.INTERNAL_SERVER_ERROR)
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      }),
    )
  })
})

describe('responseError — Fix #3: observable masking layer', () => {
  const originalNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
    jest.clearAllMocks()
  })

  const createMockReq = (
    overrides?: Partial<{ path: string; method: string; requestId: string }>,
  ) =>
    ({
      path: '/test/path',
      method: 'GET',
      requestId: 'req-id-123',
      ...overrides,
    }) as Pick<Request, 'path' | 'method' | 'requestId'>

  it('untyped error logs message, stack, path, method, and requestId', () => {
    const res = createMockResponse() as Response
    const req = createMockReq()
    const error = new Error('Something broke')
    error.stack = 'Error: Something broke\n  at test.ts:1:1'

    responseError(res, error, req)

    expect(Logger.apiError).toHaveBeenCalledWith(
      expect.stringContaining('500'),
      expect.objectContaining({
        message: 'Something broke',
        stack: error.stack,
        path: '/test/path',
        method: 'GET',
        requestId: 'req-id-123',
      }),
    )
  })

  it('untyped error logs even when requestId is absent', () => {
    const res = createMockResponse() as Response
    const req = createMockReq({ requestId: undefined as unknown as string })
    const error = new Error('No request id')

    responseError(res, error, req)

    expect(Logger.apiError).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        message: 'No request id',
        path: '/test/path',
        method: 'GET',
      }),
    )
  })

  it('in production, untyped error response contains only generic message and code — no stack, no raw message', () => {
    process.env.NODE_ENV = 'production'
    const res = createMockResponse() as Response
    const error = new Error('Internal secret details')

    responseError(res, error)

    expect(res.status).toHaveBeenCalledWith(STATUS.INTERNAL_SERVER_ERROR)
    const sentBody = (res.send as jest.Mock).mock.calls[0][0] as Record<string, unknown>
    expect(sentBody.message).toBe(COMMON_MESSAGES.INTERNAL_SERVER_ERROR)
    expect(sentBody.code).toBe(ERROR_CODES.INTERNAL_SERVER_ERROR)
    expect(sentBody.stack).toBeUndefined()
    // The raw underlying error message must NOT appear in the response body
    expect(JSON.stringify(sentBody)).not.toContain('Internal secret details')
  })

  it('in non-production, untyped error response may include message and stack', () => {
    process.env.NODE_ENV = 'development'
    const res = createMockResponse() as Response
    const error = new Error('Dev debug info')
    error.stack = 'Error: Dev debug info\n  at test.ts:5:5'

    responseError(res, error)

    const sentBody = (res.send as jest.Mock).mock.calls[0][0] as Record<string, unknown>
    expect(sentBody.message).toBe('Dev debug info')
    expect(sentBody.stack).toBe(error.stack)
  })

  it('ErrorHandler branch does NOT invoke the untyped-error logging', () => {
    const res = createMockResponse() as Response
    const error = new ErrorHandler(400, 'Bad request error', true, ERROR_CODES.BAD_REQUEST)

    responseError(res, error)

    expect(Logger.apiError).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('CastError branch does NOT invoke the untyped-error logging', () => {
    const res = createMockResponse() as Response
    const castError = new Error('Cast to ObjectId failed')
    castError.name = 'CastError'

    responseError(res, castError)

    expect(Logger.apiError).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(STATUS.BAD_REQUEST)
  })

  it('ErrorHandler response status, message, and body are byte-for-byte unchanged', () => {
    process.env.NODE_ENV = 'production'
    const res = createMockResponse() as Response
    const error = new ErrorHandler(422, 'Validation failed', true, ERROR_CODES.VALIDATION_ERROR)

    responseError(res, error)

    expect(res.status).toHaveBeenCalledWith(422)
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Validation failed',
        code: ERROR_CODES.VALIDATION_ERROR,
      }),
    )
  })
})

describe('responseSuccess', () => {
  it('sends 200 with data', () => {
    const res = createMockResponse() as Response
    const data = { message: 'Success', user: { id: '1' } }
    responseSuccess(res, data)
    expect(res.status).toHaveBeenCalledWith(STATUS.OK)
    expect(res.send).toHaveBeenCalledWith(data)
  })
})
