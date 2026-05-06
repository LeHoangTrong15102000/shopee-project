/// <reference types="jest" />

/**
 * Integration tests for requestIdMiddleware.
 *
 * Creates a minimal Express app with the middleware and verifies
 * end-to-end behavior including AsyncLocalStorage isolation.
 */

import express, { Request, Response } from 'express'
import request from 'supertest'
import { requestIdMiddleware, getRequestId } from '@middleware/request-id.middleware'
import { setFormatter, setMinLevel } from '@utils/logger'
import { ILogFormatter, LogLevel, LogMeta } from '@utils/logger'

// UUID v4 pattern
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Capture formatter to inspect log output
class CapturingFormatter implements ILogFormatter {
  entries: Array<{ level: LogLevel; category: string; message: string; meta?: LogMeta }> = []

  format(level: LogLevel, category: string, message: string, meta?: LogMeta): string {
    this.entries.push({ level, category, message, meta })
    return JSON.stringify({ level, category, message, ...meta })
  }

  reset(): void {
    this.entries = []
  }
}

function buildApp(handler?: (req: Request, res: Response) => void) {
  const app = express()
  app.use(requestIdMiddleware)
  app.get('/test', handler ?? ((_req, res) => res.json({ ok: true })))
  return app
}

describe('requestIdMiddleware — integration', () => {
  let consoleInfoSpy: jest.SpyInstance
  let consoleErrorSpy: jest.SpyInstance
  let consoleWarnSpy: jest.SpyInstance
  let consoleDebugSpy: jest.SpyInstance

  beforeEach(() => {
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation()
  })

  afterEach(() => {
    consoleInfoSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleDebugSpy.mockRestore()
  })

  describe('X-Request-ID response header', () => {
    it('request without X-Request-ID → response has X-Request-ID header with UUID format', async () => {
      const app = buildApp()
      const res = await request(app).get('/test')
      expect(res.headers['x-request-id']).toMatch(UUID_PATTERN)
    })

    it('request with X-Request-ID → response echoes same value', async () => {
      const app = buildApp()
      const res = await request(app).get('/test').set('X-Request-ID', 'my-trace-id-123')
      expect(res.headers['x-request-id']).toBe('my-trace-id-123')
    })

    it('request with empty X-Request-ID → response has generated UUID', async () => {
      const app = buildApp()
      const res = await request(app).get('/test').set('X-Request-ID', '')
      expect(res.headers['x-request-id']).toMatch(UUID_PATTERN)
    })
  })

  describe('AsyncLocalStorage isolation', () => {
    it('getRequestId() inside handler returns the request ID', async () => {
      let capturedId: string | undefined

      const app = buildApp((req, res) => {
        capturedId = getRequestId()
        res.json({ requestId: capturedId })
      })

      const res = await request(app).get('/test').set('X-Request-ID', 'handler-test-id')
      expect(capturedId).toBe('handler-test-id')
      expect(res.body.requestId).toBe('handler-test-id')
    })

    it('multiple concurrent requests get different requestIds', async () => {
      const capturedIds: string[] = []

      const app = buildApp((_req, res) => {
        const id = getRequestId()
        if (id) capturedIds.push(id)
        // Small delay to allow overlap
        setTimeout(() => res.json({ requestId: id }), 10)
      })

      // Fire two requests concurrently
      const [res1, res2] = await Promise.all([
        request(app).get('/test'),
        request(app).get('/test'),
      ])

      expect(res1.body.requestId).toMatch(UUID_PATTERN)
      expect(res2.body.requestId).toMatch(UUID_PATTERN)
      expect(res1.body.requestId).not.toBe(res2.body.requestId)
    })
  })

  describe('Logger requestId injection', () => {
    it('logger output includes requestId field when inside request context', async () => {
      const capturing = new CapturingFormatter()
      setFormatter(capturing)
      setMinLevel('debug')

      const { Logger } = await import('@utils/logger')

      const app = buildApp((_req, res) => {
        Logger.apiInfo('request handled')
        res.json({ ok: true })
      })

      await request(app).get('/test').set('X-Request-ID', 'logger-test-id')

      const logEntry = capturing.entries.find((e) => e.message === 'request handled')
      expect(logEntry).toBeDefined()
      expect(logEntry?.meta?.requestId).toBe('logger-test-id')

      // Restore default formatter
      const { PrettyFormatter } = await import('@utils/logger/pretty-formatter')
      setFormatter(new PrettyFormatter())
    })
  })
})
