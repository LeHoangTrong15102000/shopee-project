import http from 'src/utils/http'
import type { SuccessResponse } from 'src/types'
import type { AuditLogListParams, AuditLogListResponse, AuditLogDetail } from 'src/types/audit-log'

const auditLogApi = {
  getList: (params?: AuditLogListParams) =>
    http.get<SuccessResponse<AuditLogListResponse>>('admin/audit-logs', { params }),

  getDetail: (id: string) =>
    http.get<SuccessResponse<AuditLogDetail>>(`admin/audit-logs/${id}`),
}

export default auditLogApi
