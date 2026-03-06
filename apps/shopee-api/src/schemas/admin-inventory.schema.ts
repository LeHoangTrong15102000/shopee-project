import { z } from 'zod'
import { mongoIdSchema } from './common.schema'
import { adminPaginationQuerySchema } from './admin-common.schema'

// ─── Low Stock Query ──────────────────────────────────────────

export const adminLowStockSchema = z.object({
  query: adminPaginationQuerySchema.extend({
    threshold: z.coerce.number().int().min(1).optional().default(10),
  }),
})

// ─── Out of Stock Query ───────────────────────────────────────

export const adminOutOfStockSchema = z.object({
  query: adminPaginationQuerySchema,
})

// ─── Stock Update ─────────────────────────────────────────────

export const adminUpdateStockSchema = z.object({
  params: z.object({ product_id: mongoIdSchema }),
  body: z.object({
    quantity: z.number().int().min(0, 'Số lượng không được âm'),
  }),
})

// ─── Bulk Stock Update ────────────────────────────────────────

export const adminBulkStockUpdateSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          product_id: mongoIdSchema,
          quantity: z.number().int().min(0, 'Số lượng không được âm'),
        })
      )
      .min(1, 'Danh sách sản phẩm không được rỗng'),
  }),
})

