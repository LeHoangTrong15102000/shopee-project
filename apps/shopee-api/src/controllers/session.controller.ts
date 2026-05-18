import { Request, Response } from 'express'
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { NotFoundError } from '@services/base.service'

const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.ip || req.socket?.remoteAddress || 'unknown'
}

/**
 * GET /auth/sessions
 * List active sessions for the authenticated user.
 * Query params: page (default 1), limit (default 20)
 */
export const listSessions = async (req: Request, res: Response) => {
  const { sessionService } = await import('../container')
  const userId = req.jwtDecoded.id
  const currentAccessJti = req.jwtDecoded.jti
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20))

  const { sessions, total } = await sessionService.listActiveSessions(userId, currentAccessJti, page, limit)

  return responseSuccess(res, {
    message: 'Sessions retrieved successfully',
    data: {
      sessions,
      pagination: {
        page,
        limit,
        total,
        page_size: Math.ceil(total / limit),
      },
    },
  })
}

/**
 * DELETE /auth/sessions/:id
 * Revoke a specific session by ID.
 */
export const revokeSession = async (req: Request, res: Response) => {
  const { sessionService, auditLogService } = await import('../container')
  const userId = req.jwtDecoded.id
  const sessionId = req.params.id as string

  try {
    await sessionService.revokeSession(userId, sessionId)

    // Audit log: session.revoke (fire-and-forget)
    auditLogService.writeLog({
      action: 'session.revoke',
      resource: 'session',
      resourceId: sessionId,
      actor: { userId, roles: req.jwtDecoded.roles ?? [] },
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
      status: 'success',
    })

    return responseSuccess(res, { message: 'Session revoked successfully' })
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new ErrorHandler(STATUS.NOT_FOUND, error.message)
    }
    throw error
  }
}

/**
 * DELETE /auth/sessions
 * Revoke all sessions except the current one.
 */
export const revokeAllSessions = async (req: Request, res: Response) => {
  const { sessionService, auditLogService } = await import('../container')
  const userId = req.jwtDecoded.id
  const currentAccessJti = req.jwtDecoded.jti

  const revokedCount = await sessionService.revokeAllSessions(userId, currentAccessJti)

  // Audit log: session.revoke_all (fire-and-forget)
  auditLogService.writeLog({
    action: 'session.revoke_all',
    resource: 'session',
    resourceId: userId,
    actor: { userId, roles: req.jwtDecoded.roles ?? [] },
    ip: getClientIp(req),
    userAgent: req.headers['user-agent'] || '',
    status: 'success',
  })

  return responseSuccess(res, {
    message: `${revokedCount} session(s) revoked successfully`,
    data: { revoked_count: revokedCount },
  })
}

/**
 * GET /auth/login-history
 * Get login history for the authenticated user.
 * Query params: page (default 1), limit (default 20), status (optional: success|failed|blocked)
 */
export const getLoginHistory = async (req: Request, res: Response) => {
  const { loginHistoryService } = await import('../container')
  const userId = req.jwtDecoded.id
  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20))
  const status = req.query.status as string | undefined

  const { entries, total } = await loginHistoryService.getHistory(userId, { page, limit, status })

  return responseSuccess(res, {
    message: 'Login history retrieved successfully',
    data: {
      entries,
      pagination: {
        page,
        limit,
        total,
        page_size: Math.ceil(total / limit),
      },
    },
  })
}

const sessionController = {
  listSessions,
  revokeSession,
  revokeAllSessions,
  getLoginHistory,
}

export default sessionController
