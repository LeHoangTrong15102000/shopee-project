export interface AuditLogActor {
  userId: string
  roles: string[]
}

export type AuditLogStatus = 'success' | 'failed'

export type AuditLogDiffKind = 'N' | 'D' | 'E' | 'A'

export interface AuditLogDiffEntry {
  kind: AuditLogDiffKind
  path: string[]
  lhs?: unknown
  rhs?: unknown
  index?: number
  item?: AuditLogDiffEntry
}

export interface AuditLogItem {
  _id: string
  action: string
  resource: string
  resourceId?: string
  actor: AuditLogActor
  ip: string
  status: AuditLogStatus
  timestamp: string
}

export interface AuditLogDetail extends AuditLogItem {
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  diff?: AuditLogDiffEntry[] | null
  userAgent?: string
  errorMessage?: string
}

export interface AuditLogListParams {
  page?: number
  limit?: number
  action?: string
  resource?: string
  actorId?: string
  status?: AuditLogStatus | 'all'
  from?: string
  to?: string
}

export interface AuditLogListResponse {
  items: AuditLogItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
