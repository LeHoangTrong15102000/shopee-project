import { Request, Response } from 'express'
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'

/**
 * GET /admin/audit-logs
 * Paginated, filterable list of audit log entries.
 * Query params: action, resource, actorId, status, from, to, page, limit
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  const { auditLogService } = await import('../container')

  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))

  const filters = {
    action: req.query.action as string | undefined,
    resource: req.query.resource as string | undefined,
    actorId: req.query.actorId as string | undefined,
    status: req.query.status as string | undefined,
    from: req.query.from ? new Date(req.query.from as string) : undefined,
    to: req.query.to ? new Date(req.query.to as string) : undefined,
    page,
    limit,
  }

  const { logs, total } = await auditLogService.getLogs(filters)

  return responseSuccess(res, {
    message: 'Audit logs retrieved successfully',
    data: {
      logs,
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
 * GET /admin/audit-logs/:id
 * Get a single audit log entry by ID, including the diff field.
 */
export const getAuditLogById = async (req: Request, res: Response) => {
  const { auditLogService } = await import('../container')
  const id = req.params.id as string

  const log = await auditLogService.getLogById(id)
  if (!log) {
    throw new ErrorHandler(STATUS.NOT_FOUND, `Audit log with id '${id}' not found`)
  }

  return responseSuccess(res, {
    message: 'Audit log retrieved successfully',
    data: log,
  })
}

const adminAuditLogController = {
  getAuditLogs,
  getAuditLogById,
}

export default adminAuditLogController
