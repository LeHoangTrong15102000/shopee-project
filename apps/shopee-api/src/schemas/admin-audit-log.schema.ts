import { z } from 'zod'
import { mongoIdSchema } from './common.schema'
import { adminPaginationQuerySchema } from './admin-common.schema'

const AUDIT_LOG_STATUSES = ['success', 'failed'] as const

/**
 * Query parameter validation schema for GET /admin/audit-logs
 * Supports filtering by action, resource, actorId, status, date range, and pagination.
 */
export const adminAuditLogListSchema = z.object({
  query: adminPaginationQuerySchema.extend({
    action: z.string().max(100).optional(),
    resource: z.string().max(100).optional(),
    actorId: mongoIdSchema.optional(),
    status: z.enum(AUDIT_LOG_STATUSES).optional(),
    from: z
      .string()
      .datetime({ message: 'from must be a valid ISO 8601 datetime string' })
      .optional(),
    to: z
      .string()
      .datetime({ message: 'to must be a valid ISO 8601 datetime string' })
      .optional(),
  }),
})

export type AdminAuditLogListQuery = z.infer<typeof adminAuditLogListSchema>['query']

/**
 * Path parameter validation schema for GET /admin/audit-logs/:id
 */
export const adminAuditLogIdSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
})
