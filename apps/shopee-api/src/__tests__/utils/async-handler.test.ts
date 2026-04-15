/// <reference types="jest" />
import { Request, Response, NextFunction } from 'express'
import {
  asyncHandler,
  asyncHandlers,
  asyncHandlerWithTimeout,
  asyncHandlerWithRetry,
  asyncHandlerWithErrorTransform,
} from '@utils/async-handler'
import { createMockRequest, createMockResponse, createMockNext } from '../setup'

describe('async-handler', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: jest.Mock

  beforeEach(() => {
    req = createMockRequest()
    res = createMockResponse()
    next = createMockNext()
  })

  describe('asyncHandler', () => {
    it('should not call next when handler resolves successfully', async () => {
      const handler = asyncHandler(async (_req, res) => {
        res.json({ success: true })
      })

      handler(req as Request, res as Response, next as NextFunction)
      await Promise.resolve()

      expect(res.json).toHaveBeenCalledWith({ success: true })
      expect(next).not.toHaveBeenCalled()
    })

    it('should call next with error when handler rejects', async () => {
      const error = new Error('Test error')
      const handler = asyncHandler(async () => {
        throw error
      })

      handler(req as Request, res as Response, next as NextFunction)
      await Promise.resolve()

      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe('asyncHandlers', () => {
    it('should wrap array of handlers and return array of same length', () => {
      const handlers = [async () => {}, async () => {}, async () => {}]

      const wrapped = asyncHandlers(handlers)

      expect(wrapped).toHaveLength(3)
      expect(typeof wrapped[0]).toBe('function')
    })
  })

  describe('asyncHandlerWithTimeout', () => {
    it('should resolve normally when handler completes before timeout', async () => {
      const handler = asyncHandlerWithTimeout(async (_req, res) => {
        res.json({ success: true })
      }, 100)

      handler(req as Request, res as Response, next as NextFunction)
      await new Promise((r) => setTimeout(r, 20))

      expect(res.json).toHaveBeenCalledWith({ success: true })
      expect(next).not.toHaveBeenCalled()
    })

    it('should call next with timeout error when handler exceeds timeout', async () => {
      const handler = asyncHandlerWithTimeout(async () => {
        await new Promise((r) => setTimeout(r, 100))
      }, 10)

      handler(req as Request, res as Response, next as NextFunction)
      await new Promise((r) => setTimeout(r, 50))

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Request timeout after 10ms',
        }),
      )
    })
  })

  describe('asyncHandlerWithRetry', () => {
    it('should not call next with error when handler succeeds first try', async () => {
      const handler = asyncHandlerWithRetry(
        async (_req, res) => {
          res.json({ success: true })
        },
        3,
        1,
      )

      await handler(req as Request, res as Response, next as NextFunction)

      expect(res.json).toHaveBeenCalledWith({ success: true })
      expect(next).not.toHaveBeenCalled()
    })

    it('should succeed after retry when first attempt fails', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('First fail'))
        .mockResolvedValueOnce(undefined)

      const handler = asyncHandlerWithRetry(
        async (_req, res) => {
          await mockFn()
          res.json({ success: true })
        },
        3,
        1,
      )

      await handler(req as Request, res as Response, next as NextFunction)

      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(next).not.toHaveBeenCalled()
    })

    it('should call next with last error after all retries fail', async () => {
      const lastError = new Error('Final error')
      const mockFn = jest.fn().mockRejectedValue(lastError)

      const handler = asyncHandlerWithRetry(
        async () => {
          await mockFn()
        },
        2,
        1,
      )

      await handler(req as Request, res as Response, next as NextFunction)

      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(next).toHaveBeenCalledWith(lastError)
    })
  })

  describe('asyncHandlerWithErrorTransform', () => {
    it('should transform error before passing to next', async () => {
      const originalError = new Error('Original')
      const transformedError = new Error('Transformed')
      const transformer = jest.fn().mockReturnValue(transformedError)

      const handler = asyncHandlerWithErrorTransform(async () => {
        throw originalError
      }, transformer)

      handler(req as Request, res as Response, next as NextFunction)
      await Promise.resolve()

      expect(transformer).toHaveBeenCalledWith(originalError)
      expect(next).toHaveBeenCalledWith(transformedError)
    })
  })
})
