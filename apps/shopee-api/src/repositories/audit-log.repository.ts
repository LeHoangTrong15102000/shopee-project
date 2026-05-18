import { AuditLogModel, IAuditLog, AuditLogStatus } from '@database/models/audit-log.model'
import { IAuditLogRepository } from './interfaces/audit-log.repository.interface'

export class AuditLogRepository implements IAuditLogRepository {
  async create(data: {
    action: string
    resource: string
    resourceId?: string | null
    actor: { userId: string; roles: string[] }
    before?: Record<string, unknown> | null
    after?: Record<string, unknown> | null
    diff?: unknown[] | null
    ip: string
    userAgent: string
    status: AuditLogStatus
    errorMessage?: string | null
    timestamp: Date
  }): Promise<IAuditLog> {
    return AuditLogModel.create(data)
  }

  async findPaginated(filters: {
    action?: string
    resource?: string
    actorId?: string
    status?: string
    from?: Date
    to?: Date
    page: number
    limit: number
  }): Promise<{ logs: IAuditLog[]; total: number }> {
    const query: Record<string, unknown> = {}

    if (filters.action) query.action = filters.action
    if (filters.resource) query.resource = filters.resource
    if (filters.actorId) query['actor.userId'] = filters.actorId
    if (filters.status && ['success', 'failed'].includes(filters.status)) {
      query.status = filters.status
    }
    if (filters.from || filters.to) {
      const tsFilter: Record<string, Date> = {}
      if (filters.from) tsFilter.$gte = filters.from
      if (filters.to) tsFilter.$lte = filters.to
      query.timestamp = tsFilter
    }

    const [logs, total] = await Promise.all([
      AuditLogModel.find(query)
        .sort({ timestamp: -1 })
        .skip((filters.page - 1) * filters.limit)
        .limit(filters.limit)
        .lean(),
      AuditLogModel.countDocuments(query),
    ])

    return { logs, total }
  }

  async findById(id: string): Promise<IAuditLog | null> {
    return AuditLogModel.findById(id).lean()
  }
}
