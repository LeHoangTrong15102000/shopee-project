import { IAuditLog, AuditLogStatus } from '@database/models/audit-log.model'
import { BaseService } from './base.service'
import { Logger } from '@utils/logger'
import { IAuditLogRepository } from '@repositories/interfaces/audit-log.repository.interface'

export interface AuditLogEntry {
  action: string
  resource: string
  resourceId?: string | null
  actor: {
    userId: string
    roles: string[]
  }
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  diff?: unknown[] | null
  ip: string
  userAgent: string
  status: AuditLogStatus
  errorMessage?: string | null
}

export class AuditLogService extends BaseService {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {
    super()
  }

  /**
   * Write an audit log entry. Fire-and-forget — never throws.
   * Errors are logged but do not propagate to the caller.
   */
  writeLog(entry: AuditLogEntry): void {
    this._persist(entry).catch((err) => {
      Logger.apiWarn('audit_log.write.failed', {
        action: entry.action,
        resource: entry.resource,
        error: err?.message,
      })
    })
  }

  private async _persist(entry: AuditLogEntry): Promise<void> {
    await this.auditLogRepository.create({
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId ?? null,
      actor: entry.actor,
      before: entry.before ?? null,
      after: entry.after ?? null,
      diff: entry.diff ?? null,
      ip: entry.ip,
      userAgent: entry.userAgent,
      status: entry.status,
      errorMessage: entry.errorMessage ?? null,
      timestamp: new Date(),
    })
  }

  /**
   * Get paginated audit logs with optional filters.
   * Used by the admin audit log API.
   */
  async getLogs(filters: {
    action?: string
    resource?: string
    actorId?: string
    status?: string
    from?: Date
    to?: Date
    page: number
    limit: number
  }): Promise<{ logs: IAuditLog[]; total: number }> {
    return this.auditLogRepository.findPaginated(filters)
  }

  /**
   * Get a single audit log entry by ID.
   */
  async getLogById(id: string): Promise<IAuditLog | null> {
    return this.auditLogRepository.findById(id)
  }
}
