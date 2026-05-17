import { useQuery, keepPreviousData } from '@tanstack/react-query'
import auditLogApi from 'src/apis/audit-log.api'
import type { AuditLogListParams } from 'src/types/audit-log'

export const AUDIT_LOG_KEYS = {
  all: ['admin-audit-logs'] as const,
  list: (params?: AuditLogListParams) => ['admin-audit-logs', 'list', params] as const,
  detail: (id: string) => ['admin-audit-logs', 'detail', id] as const,
}

export function useAuditLogList(params?: AuditLogListParams) {
  return useQuery({
    queryKey: AUDIT_LOG_KEYS.list(params),
    queryFn: () => auditLogApi.getList(params).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  })
}

export function useAuditLogDetail(id: string | undefined) {
  return useQuery({
    queryKey: AUDIT_LOG_KEYS.detail(id ?? ''),
    queryFn: () => auditLogApi.getDetail(id!).then((r) => r.data.data),
    enabled: !!id,
  })
}
