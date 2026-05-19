import { z } from 'zod'
import { mongoIdSchema, paginationQuerySchema } from './common.schema'

// ─── Shop Status ─────────────────────────────────────────────────

export const SHOP_STATUS_VALUES = ['pending', 'active', 'suspended', 'banned'] as const
export type ShopStatusValue = (typeof SHOP_STATUS_VALUES)[number]

export const shopStatusSchema = z.enum(SHOP_STATUS_VALUES, {
  message: 'Status phải là: pending, active, suspended, banned',
})

// ─── Admin Shop List Query ────────────────────────────────────────

export const adminShopListSchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional().default(1),
      limit: z.coerce.number().int().min(1).max(100).optional().default(20),
      status: shopStatusSchema.optional(),
      search: z.string().optional(),
      sort_by: z
        .enum(['createdAt', 'revenue', 'products_count', 'followers_count'])
        .optional()
        .default('createdAt'),
      order: z.enum(['asc', 'desc']).optional().default('desc'),
    })
    .optional()
    .default({ page: 1, limit: 20, sort_by: 'createdAt' as const, order: 'desc' as const }),
})

// ─── Admin Shop ID Param ──────────────────────────────────────────

export const adminShopIdSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
})

// ─── Admin Shop Status Update ─────────────────────────────────────

export const adminUpdateShopStatusSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
  body: z
    .object({
      status: shopStatusSchema,
      reason: z.string().max(500).optional(),
    })
    .refine(
      (data) => {
        // reason is required when suspending or banning
        if (data.status === 'suspended' || data.status === 'banned') {
          return !!data.reason && data.reason.trim().length > 0
        }
        return true
      },
      { message: 'Lý do là bắt buộc khi tạm ngưng hoặc cấm shop' },
    ),
})

// ─── Admin Shop Products Query ────────────────────────────────────

export const adminShopProductsSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional().default(1),
      limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    })
    .optional()
    .default({ page: 1, limit: 20 }),
})

// ─── Admin Shop Revenue Query ─────────────────────────────────────

export const adminShopRevenueSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
  query: z
    .object({
      period: z.enum(['7d', '30d', '90d', '1y']).optional().default('30d'),
    })
    .optional()
    .default({ period: '30d' as const }),
})
