import { z } from 'zod'
import { mongoIdSchema } from './common.schema'
import { adminPaginationQuerySchema, sortQuerySchema, searchQuerySchema, dateRangeQuerySchema } from './admin-common.schema'

const DISCOUNT_TYPES = ['percentage', 'fixed'] as const

// ─── Admin Voucher List Query ────────────────────────────────────

export const adminVoucherListSchema = z.object({
  query: adminPaginationQuerySchema
    .merge(sortQuerySchema)
    .merge(searchQuerySchema)
    .extend({
      is_active: z.enum(['true', 'false']).optional(),
      discount_type: z.enum(DISCOUNT_TYPES).optional(),
      status: z.enum(['active', 'expired', 'upcoming', 'used_up']).optional(),
    }),
})

export type AdminVoucherListQuery = z.infer<typeof adminVoucherListSchema>['query']

// ─── Create Voucher ──────────────────────────────────────────────

export const adminCreateVoucherSchema = z.object({
  body: z.object({
    code: z.string().min(3, 'Mã voucher tối thiểu 3 ký tự').max(50).regex(/^[A-Z0-9_-]+$/, 'Mã voucher chỉ chứa chữ hoa, số, _ và -'),
    discount_type: z.enum(DISCOUNT_TYPES, { message: 'Loại giảm giá không hợp lệ' }),
    discount_value: z.number().positive('Giá trị giảm phải lớn hơn 0'),
    min_order_value: z.number().min(0).optional().default(0),
    max_discount: z.number().positive().optional(),
    usage_limit: z.number().int().positive().optional().default(1),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'start_date phải có định dạng YYYY-MM-DD'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'end_date phải có định dạng YYYY-MM-DD'),
    applicable_products: z.array(mongoIdSchema).optional(),
    applicable_categories: z.array(mongoIdSchema).optional(),
    is_active: z.boolean().optional().default(true),
  }),
})

export type AdminCreateVoucherBody = z.infer<typeof adminCreateVoucherSchema>['body']

// ─── Update Voucher ──────────────────────────────────────────────

export const adminUpdateVoucherSchema = z.object({
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    discount_type: z.enum(DISCOUNT_TYPES).optional(),
    discount_value: z.number().positive().optional(),
    min_order_value: z.number().min(0).optional(),
    max_discount: z.number().positive().nullable().optional(),
    usage_limit: z.number().int().positive().optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
    applicable_products: z.array(mongoIdSchema).optional(),
    applicable_categories: z.array(mongoIdSchema).optional(),
    is_active: z.boolean().optional(),
  }),
})

// ─── Voucher ID Param ────────────────────────────────────────────

export const adminVoucherIdSchema = z.object({
  params: z.object({ id: mongoIdSchema }),
})

// ─── Usage Query ─────────────────────────────────────────────────

export const adminVoucherUsageSchema = z.object({
  params: z.object({ id: mongoIdSchema }),
  query: adminPaginationQuerySchema,
})

