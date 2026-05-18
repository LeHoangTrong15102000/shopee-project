import { IAuditLog, AuditLogStatus } from '@database/models/audit-log.model'

export interface IAuditLogRepository {
  create(data: {
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
  }): Promise<IAuditLog>

  findPaginated(filters: {
    action?: string
    resource?: string
    actorId?: string
    status?: string
    from?: Date
    to?: Date
    page: number
    limit: number
  }): Promise<{ logs: IAuditLog[]; total: number }>

  findById(id: string): Promise<IAuditLog | null>
}
