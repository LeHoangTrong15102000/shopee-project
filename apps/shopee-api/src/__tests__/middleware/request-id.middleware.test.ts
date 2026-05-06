/// <reference types="jest" />

import { Request, Response, NextFunction } from 'express'
import {
  requestIdMiddleware,
  requestIdStorage,
  getRequestId,
} from '@middleware/request-id.middleware'

// UUID v4 pattern
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function makeReq(headers: Record<string, string> = {}): Request {
  return {
    headers,
    requestId: undefined as unknown as string,
  } as unknown as Request
}

function makeRes(): Response {
  const headers: Record<string, string> = {}
  return {
    setHeader: jest.fn((name: string, value: string) => {
      headers[name] = value
    }),
    _headers: headers,
  } as unknown as Response
}

describe('requestIdMiddleware', () => {
  describe('UUID generation', () => {
    it('generates a UUID when no X-Request-ID header is present', () => {
      const req = makeReq()
      const res = makeRes()
      const next = jest.fn()

      requestIdMiddleware(req, res, next)

      expect(req.requestId).toMatch(UUID_PATTERN)
    })

    it('generates a different UUID for each request', () => {
      const req1 = makeReq()
      const req2 = makeReq()
      const res1 = makeRes()
      const res2 = makeRes()
      const next = jest.fn()

      requestIdMiddleware(req1, res1, next)
      requestIdMiddleware(req2, res2, next)

      expect(req1.requestId).not.toBe(req2.requestId)
    })
  })

  describe('incoming X-Request-ID header', () => {
    it('uses the incoming X-Request-ID header value when present', () => {
      const req = makeReq({ 'x-request-id': 'my-custom-id-123' })
      const res = makeRes()
      const next = jest.fn()

      requestIdMiddleware(req, res, next)

      expect(req.requestId).toBe('my-custom-id-123')
    })

    it('trims whitespace from incoming header', () => {
      const req = makeReq({ 'x-request-id': '  trimmed-id  ' })
      const res = makeRes()
      const next = jest.fn()

      requestIdMiddleware(req, res, next)

      expect(req.requestId).toBe('trimmed-id')
    })

    it('ignores empty X-Request-ID header and generates a new UUID', () => {
      const req = makeReq({ 'x-request-id': '' })
      const res = makeRes()
      const next = jest.fn()

      requestIdMiddleware(req, res, next)

      expect(req.requestId).toMatch(UUID_PATTERN)
    })

    it('ignores whitespace-only X-Request-ID header and generates a new UUID', () => {
      const req = makeReq({ 'x-request-id': '   ' })
      const res = makeRes()
      const next = jest.fn()

      requestIdMiddleware(req, res, next)

      expect(req.requestId).toMatch(UUID_PATTERN)
    })
  })

  describe('req.requestId property', () => {
    it('sets req.requestId to the resolved ID', () => {
      const req = makeReq({ 'x-request-id': 'explicit-id' })
      const res = makeRes()
      const next = jest.fn()

      requestIdMiddleware(req, res, next)

      expect(req.requestId).toBe('explicit-id')
    })
  })

  describe('X-Request-ID response header', () => {
    it('sets X-Request-ID response header with generated UUID', () => {
      const req = makeReq()
      const res = makeRes()
      const next = jest.fn()

      requestIdMiddleware(req, res, next)

      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', req.requestId)
    })

    it('sets X-Request-ID response header with incoming ID', () => {
      const req = makeReq({ 'x-request-id': 'incoming-id' })
      const res = makeRes()
      const next = jest.fn()

      requestIdMiddleware(req, res, next)

      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', 'incoming-id')
    })
  })

  describe('AsyncLocalStorage', () => {
    it('stores requestId in AsyncLocalStorage — getRequestId() returns it inside next()', (done) => {
      const req = makeReq({ 'x-request-id': 'als-test-id' })
      const res = makeRes()

      const next: NextFunction = () => {
        try {
          expect(getRequestId()).toBe('als-test-id')
          done()
        } catch (err) {
          done(err)
        }
      }

      requestIdMiddleware(req, res, next)
    })

    it('stores generated UUID in AsyncLocalStorage', (done) => {
      const req = makeReq()
      const res = makeRes()

      const next: NextFunction = () => {
        try {
          const storedId = getRequestId()
          expect(storedId).toBe(req.requestId)
          expect(storedId).toMatch(UUID_PATTERN)
          done()
        } catch (err) {
          done(err)
        }
      }

      requestIdMiddleware(req, res, next)
    })

    it('calls next() exactly once', () => {
      const req = makeReq()
      const res = makeRes()
      const next = jest.fn()

      requestIdMiddleware(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
    })
  })

  describe('getRequestId() outside request context', () => {
    it('returns undefined when called outside AsyncLocalStorage context', () => {
      // Outside any requestIdStorage.run() call, getStore() returns undefined
      const id = getRequestId()
      expect(id).toBeUndefined()
    })
  })
})
