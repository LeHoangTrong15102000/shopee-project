/// <reference types="jest" />
import { sanitizeMiddleware, sanitizeBodyMiddleware, sanitizeQueryMiddleware } from '@middleware/sanitize.middleware'
import { createMockRequest, createMockResponse, createMockNext } from '../setup'

jest.mock('@utils/sanitize', () => ({
  sanitizeObject: jest.fn((obj: any) => {
    const result = { ...obj }
    for (const key of Object.keys(result)) {
      if (key.startsWith('$')) delete result[key]
    }
    return result
  }),
}))

describe('Sanitize Middleware', () => {
  const { sanitizeObject } = require('@utils/sanitize')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('sanitizeMiddleware', () => {
    it('sanitizes body, query, and params, then calls next()', () => {
      const req = createMockRequest({ body: { $gt: 1, name: 'test' }, query: { $ne: 'x' }, params: { id: '1' } })
      const res = createMockResponse()
      const next = createMockNext()

      sanitizeMiddleware(req as any, res as any, next)

      expect(sanitizeObject).toHaveBeenCalledTimes(3)
      expect(req.body).toEqual({ name: 'test' })
      expect(req.query).toEqual({})
      expect(next).toHaveBeenCalled()
    })

    it('skips sanitization when body is not an object', () => {
      const req = createMockRequest({ body: {} as any, query: {}, params: {} })
      req.body = 'string body' as any
      const res = createMockResponse()
      const next = createMockNext()

      sanitizeMiddleware(req as any, res as any, next)

      expect(next).toHaveBeenCalled()
    })

    it('calls next() even on sanitize error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      sanitizeObject.mockImplementationOnce(() => { throw new Error('Sanitize error') })
      const req = createMockRequest({ body: { name: 'test' }, query: {}, params: {} })
      const res = createMockResponse()
      const next = createMockNext()

      sanitizeMiddleware(req as any, res as any, next)

      expect(consoleSpy).toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('sanitizeBodyMiddleware', () => {
    it('only sanitizes body, calls next()', () => {
      const req = createMockRequest({ body: { $where: 'x', data: 'ok' } })
      const res = createMockResponse()
      const next = createMockNext()

      sanitizeBodyMiddleware(req as any, res as any, next)

      expect(sanitizeObject).toHaveBeenCalledTimes(1)
      expect(req.body).toEqual({ data: 'ok' })
      expect(next).toHaveBeenCalled()
    })

    it('calls next() on error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      sanitizeObject.mockImplementationOnce(() => { throw new Error('Sanitize error') })
      const req = createMockRequest({ body: { name: 'test' } })
      const res = createMockResponse()
      const next = createMockNext()

      sanitizeBodyMiddleware(req as any, res as any, next)

      expect(consoleSpy).toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('sanitizeQueryMiddleware', () => {
    it('only sanitizes query, calls next()', () => {
      const req = createMockRequest({ query: { $regex: 'x', search: 'term' } })
      const res = createMockResponse()
      const next = createMockNext()

      sanitizeQueryMiddleware(req as any, res as any, next)

      expect(sanitizeObject).toHaveBeenCalledTimes(1)
      expect(req.query).toEqual({ search: 'term' })
      expect(next).toHaveBeenCalled()
    })

    it('calls next() on error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      sanitizeObject.mockImplementationOnce(() => { throw new Error('Sanitize error') })
      const req = createMockRequest({ query: { search: 'test' } })
      const res = createMockResponse()
      const next = createMockNext()

      sanitizeQueryMiddleware(req as any, res as any, next)

      expect(consoleSpy).toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })
})

