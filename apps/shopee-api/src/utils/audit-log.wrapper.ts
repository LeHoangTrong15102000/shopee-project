import { Request, Response, NextFunction } from 'express'
import { diff as deepDiff } from 'deep-diff'
import { Logger } from '@utils/logger'

export interface AuditLogOptions {
  action: string
  resource: string
  /**
   * Extract the resource ID from the request.
   * Called before the handler runs (for update/delete) and after (for create).
   */
  getResourceId?: (req: Request, result?: unknown) => string | string[] | null
  /**
   * Fetch the "before" snapshot of the resource.
   * Called before the handler runs. Return a plain object (use .lean() or .toObject()).
   * Return null if not applicable (e.g., create operations).
   */
  getBeforeSnapshot?: (req: Request) => Promise<Record<string, unknown> | null>
  /**
   * Fetch the "after" snapshot of the resource.
   * Called after the handler runs successfully.
   * Return null if not applicable (e.g., delete operations).
   */
  getAfterSnapshot?: (req: Request) => Promise<Record<string, unknown> | null>
}

/**
 * Extract the real client IP from an Express request.
 */
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.ip || req.socket?.remoteAddress || 'unknown'
}

/**
 * Strip sensitive fields from a snapshot before storing in the audit log.
 */
const sanitizeSnapshot = (obj: Record<string, unknown> | null): Record<string, unknown> | null => {
  if (!obj) return null
  const sanitized = { ...obj }
  delete sanitized.password
  delete sanitized.twoFactorSecret
  delete sanitized.backupCodes
  return sanitized
}

/** Coerce a param value (string | string[] | null) to string | null. */
const toStringId = (v: string | string[] | null | undefined): string | null =>
  Array.isArray(v) ? (v[0] ?? null) : (v ?? null)

/**
 * HOF that wraps an Express route handler with audit logging.
 *
 * Usage:
 *   router.put('/products/:id',
 *     authMiddleware.verifyAccessToken,
 *     asyncHandler(withAuditLog(updateProductHandler, {
 *       action: 'product.update',
 *       resource: 'product',
 *       getResourceId: (req) => req.params.id,
 *       getBeforeSnapshot: async (req) => ProductModel.findById(req.params.id).lean(),
 *       getAfterSnapshot: async (req) => ProductModel.findById(req.params.id).lean(),
 *     }))
 *   )
 */
export const withAuditLog = (
  handler: (req: any, res: Response, next?: NextFunction) => Promise<unknown>,
  options: AuditLogOptions,
) => {
  return async (req: Request, res: Response, next?: NextFunction): Promise<unknown> => {
    const ip = getClientIp(req)
    const userAgent = req.headers['user-agent'] || ''
    const actor = {
      userId: req.jwtDecoded?.id || 'anonymous',
      roles: req.jwtDecoded?.roles || [],
    }

    // Capture "before" snapshot
    let before: Record<string, unknown> | null = null
    if (options.getBeforeSnapshot) {
      try {
        before = sanitizeSnapshot(await options.getBeforeSnapshot(req))
      } catch (err) {
        Logger.apiWarn('audit_log.before_snapshot.failed', {
          action: options.action,
          error: (err as Error)?.message,
        })
      }
    }

    try {
      // Run the actual handler
      const result = await handler(req, res, next)

      // Capture "after" snapshot
      let after: Record<string, unknown> | null = null
      if (options.getAfterSnapshot) {
        try {
          after = sanitizeSnapshot(await options.getAfterSnapshot(req))
        } catch (err) {
          Logger.apiWarn('audit_log.after_snapshot.failed', {
            action: options.action,
            error: (err as Error)?.message,
          })
        }
      }

      // Compute diff
      let diffResult: unknown[] | null = null
      if (before && after) {
        const changes = deepDiff(before, after)
        diffResult = changes ? (changes as unknown[]) : null
      }

      const rawResourceId = options.getResourceId ? options.getResourceId(req, result) : null
      const resourceId = toStringId(rawResourceId)

      // Write audit log (fire-and-forget via service)
      const { auditLogService } = await import('../container')
      auditLogService.writeLog({
        action: options.action,
        resource: options.resource,
        resourceId,
        actor,
        before,
        after,
        diff: diffResult,
        ip,
        userAgent,
        status: 'success',
      })

      return result
    } catch (error) {
      // Log failed operation
      const { auditLogService } = await import('../container')
      auditLogService.writeLog({
        action: options.action,
        resource: options.resource,
        resourceId: toStringId(options.getResourceId ? options.getResourceId(req) : null),
        actor,
        before,
        after: null,
        diff: null,
        ip,
        userAgent,
        status: 'failed',
        errorMessage: (error as Error)?.message || 'Unknown error',
      })

      throw error
    }
  }
}
