import { z } from 'zod'
import { mongoIdSchema } from './common.schema'

// ─── Admin Shipping Method ID Param ──────────────────────────────

export const adminShippingIdSchema = z.object({
  params: z.object({ id: mongoIdSchema }),
})

// ─── Create Shipping Method ───────────────────────────────────────

export const adminCreateShippingSchema = z.object({
  body: z
    .object({
      name: z.string().min(1, 'Tên phương thức vận chuyển là bắt buộc').max(100),
      description: z.string().max(500).optional(),
      price: z.number().min(0, 'Giá phải >= 0'),
      estimated_days_min: z.number().int().min(0, 'Ngày tối thiểu phải >= 0'),
      estimated_days_max: z.number().int().min(0, 'Ngày tối đa phải >= 0'),
      icon: z.string().max(50).optional(),
      is_active: z.boolean().optional().default(true),
      sort_order: z.number().int().min(0).optional().default(0),
    })
    .refine((data) => data.estimated_days_min <= data.estimated_days_max, {
      message: 'Ngày tối thiểu phải nhỏ hơn hoặc bằng ngày tối đa',
      path: ['estimated_days_min'],
    }),
})

export type AdminCreateShippingBody = z.infer<typeof adminCreateShippingSchema>['body']

// ─── Update Shipping Method ───────────────────────────────────────

export const adminUpdateShippingSchema = z.object({
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    price: z.number().min(0).optional(),
    estimated_days_min: z.number().int().min(0).optional(),
    estimated_days_max: z.number().int().min(0).optional(),
    icon: z.string().max(50).optional(),
    is_active: z.boolean().optional(),
    sort_order: z.number().int().min(0).optional(),
  }),
})

export type AdminUpdateShippingBody = z.infer<typeof adminUpdateShippingSchema>['body']

// ─── Reorder Shipping Methods ─────────────────────────────────────

export const adminReorderShippingSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          id: mongoIdSchema,
          sort_order: z.number().int().min(0),
        }),
      )
      .min(1),
  }),
})

export type AdminReorderShippingBody = z.infer<typeof adminReorderShippingSchema>['body']
