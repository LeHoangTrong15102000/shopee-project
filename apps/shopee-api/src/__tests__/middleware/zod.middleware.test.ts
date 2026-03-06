/// <reference types="jest" />
import { z, ZodError } from 'zod'
import { validate, validateBadRequest } from '@middleware/zod.middleware'
import { STATUS } from '@constants/status'
import { createMockRequest, createMockResponse, createMockNext } from '../setup'

jest.mock('@utils/response', () => ({
  responseError: jest.fn(),
  ErrorHandler: jest.fn().mockImplementation((status: number, error: any) => ({ status, error })),
}))

import { responseError, ErrorHandler } from '@utils/response'

const testSchema = z.object({
  body: z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(6, 'Password phải có ít nhất 6 ký tự'),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
})

describe('Zod Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validate', () => {
    it('should call next() when input is valid', async () => {
      const req = createMockRequest({ body: { email: 'test@example.com', password: 'password123' } })
      const res = createMockResponse()
      const next = createMockNext()

      await validate(testSchema)(req as any, res as any, next)

      expect(next).toHaveBeenCalledWith()
      expect(responseError).not.toHaveBeenCalled()
    })

    it('should call responseError with 422 when input is invalid', async () => {
      const req = createMockRequest({ body: { email: 'invalid', password: '123' } })
      const res = createMockResponse()
      const next = createMockNext()

      await validate(testSchema)(req as any, res as any, next)

      expect(ErrorHandler).toHaveBeenCalledWith(STATUS.UNPROCESSABLE_ENTITY, expect.any(Object))
      expect(responseError).toHaveBeenCalledWith(res, expect.any(Object))
      expect(next).not.toHaveBeenCalled()
    })

    it('should strip body prefix from path in formatted errors', async () => {
      const req = createMockRequest({ body: { email: 'invalid', password: 'valid123' } })
      const res = createMockResponse()
      const next = createMockNext()

      await validate(testSchema)(req as any, res as any, next)

      expect(ErrorHandler).toHaveBeenCalledWith(
        STATUS.UNPROCESSABLE_ENTITY,
        expect.objectContaining({ email: 'Email không hợp lệ' })
      )
    })

    it('should call next(error) for non-ZodError', async () => {
      const customError = new Error('Custom error')
      const failingSchema = {
        parseAsync: jest.fn().mockRejectedValue(customError),
      }
      const req = createMockRequest()
      const res = createMockResponse()
      const next = createMockNext()

      await validate(failingSchema as any)(req as any, res as any, next)

      expect(next).toHaveBeenCalledWith(customError)
      expect(responseError).not.toHaveBeenCalled()
    })
  })

  describe('validateBadRequest', () => {
    it('should call responseError with 400 when input is invalid', async () => {
      const req = createMockRequest({ body: { email: 'invalid', password: '123' } })
      const res = createMockResponse()
      const next = createMockNext()

      await validateBadRequest(testSchema)(req as any, res as any, next)

      expect(ErrorHandler).toHaveBeenCalledWith(STATUS.BAD_REQUEST, expect.any(Object))
      expect(responseError).toHaveBeenCalledWith(res, expect.any(Object))
    })

    it('should call next() when input is valid', async () => {
      const req = createMockRequest({ body: { email: 'test@example.com', password: 'password123' } })
      const res = createMockResponse()
      const next = createMockNext()

      await validateBadRequest(testSchema)(req as any, res as any, next)

      expect(next).toHaveBeenCalledWith()
      expect(responseError).not.toHaveBeenCalled()
    })
  })
})

