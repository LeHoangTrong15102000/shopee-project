import { z } from 'zod'
import { mongoIdSchema } from './common.schema'

export const PAYMENT_TYPES = ['cod', 'bank_transfer', 'e_wallet', 'credit_card'] as const

// ─── Admin Payment Method ID Param ───────────────────────────────

export const adminPaymentIdSchema = z.object({
  params: z.object({ id: mongoIdSchema }),
})

// ─── Create Payment Method ────────────────────────────────────────

export const adminCreatePaymentSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tên phương thức thanh toán là bắt buộc').max(100),
    description: z.string().max(500).optional(),
    icon: z.string().max(50).optional(),
    type: z.enum(PAYMENT_TYPES, { message: 'Loại thanh toán không hợp lệ' }),
    is_active: z.boolean().optional().default(true),
    sort_order: z.number().int().min(0).optional().default(0),
    instructions: z.string().max(1000).optional(),
  }),
})

export type AdminCreatePaymentBody = z.infer<typeof adminCreatePaymentSchema>['body']

// ─── Update Payment Method ────────────────────────────────────────

export const adminUpdatePaymentSchema = z.object({
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    icon: z.string().max(50).optional(),
    type: z.enum(PAYMENT_TYPES).optional(),
    is_active: z.boolean().optional(),
    sort_order: z.number().int().min(0).optional(),
    instructions: z.string().max(1000).optional(),
  }),
})

export type AdminUpdatePaymentBody = z.infer<typeof adminUpdatePaymentSchema>['body']

// ─── Reorder Payment Methods ──────────────────────────────────────

export const adminReorderPaymentSchema = z.object({
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

export type AdminReorderPaymentBody = z.infer<typeof adminReorderPaymentSchema>['body']
