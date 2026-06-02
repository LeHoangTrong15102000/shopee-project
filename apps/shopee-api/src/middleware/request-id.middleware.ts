import { Request, Response, NextFunction } from 'express'
import { AsyncLocalStorage } from 'node:async_hooks'

/**
 * AsyncLocalStorage store for propagating request ID across async call chains.
 * Zero changes needed in consumer files — they read from this store via getRequestId().
 */
export const requestIdStorage = new AsyncLocalStorage<string>()

/**
 * Get the current request ID from AsyncLocalStorage.
 * Returns undefined when called outside a request context.
 */
export function getRequestId(): string | undefined {
  return requestIdStorage.getStore()
}

/**
 * Extend Express Request type to carry requestId.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId: string
    }
  }
}

/**
 * Request ID Middleware
 *
 * - Checks for incoming X-Request-ID header (distributed tracing support).
 * - Generates a new UUID via crypto.randomUUID() if none is present.
 * - Attaches the ID to req.requestId.
 * - Sets X-Request-ID response header.
 * - Runs the rest of the request inside AsyncLocalStorage so any code
 *   downstream can call getRequestId() without receiving the ID explicitly.
 *
 * Register this middleware BEFORE the request logger and all routes.
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const incoming = req.headers['x-request-id']
  const requestId =
    typeof incoming === 'string' && incoming.trim().length > 0
      ? incoming.trim()
      : crypto.randomUUID()

  req.requestId = requestId
  res.setHeader('X-Request-ID', requestId)

  requestIdStorage.run(requestId, next)
}

export default requestIdMiddleware
