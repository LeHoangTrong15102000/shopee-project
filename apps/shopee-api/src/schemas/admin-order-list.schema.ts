import { z } from 'zod'
import { mongoIdSchema } from './common.schema'
import {
  adminPaginationQuerySchema,
  sortQuerySchema,
  searchQuerySchema,
  dateRangeQuerySchema,
} from './admin-common.schema'

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipping',
  'delivered',
  'cancelled',
  'returned',
] as const
const PAYMENT_METHODS = ['cod', 'bank_transfer', 'e_wallet', 'credit_card'] as const

// ─── Admin Order List Query ──────────────────────────────────────

export const adminOrderListSchema = z.object({
  query: adminPaginationQuerySchema
    .merge(sortQuerySchema)
    .merge(searchQuerySchema)
    .merge(dateRangeQuerySchema)
    .extend({
      status: z.enum(ORDER_STATUSES).optional(),
      payment_method: z.enum(PAYMENT_METHODS).optional(),
      user_id: mongoIdSchema.optional(),
    }),
})

export type AdminOrderListQuery = z.infer<typeof adminOrderListSchema>['query']

// ─── Bulk Status Update ──────────────────────────────────────────

export const adminBulkUpdateStatusSchema = z.object({
  body: z.object({
    order_ids: z
      .array(mongoIdSchema)
      .min(1, 'Cần ít nhất 1 đơn hàng')
      .max(50, 'Tối đa 50 đơn hàng mỗi lần'),
    status: z.enum(ORDER_STATUSES, { message: 'Trạng thái không hợp lệ' }),
    reason: z.string().max(500).optional(),
  }),
})

export type AdminBulkUpdateStatusBody = z.infer<typeof adminBulkUpdateStatusSchema>['body']
