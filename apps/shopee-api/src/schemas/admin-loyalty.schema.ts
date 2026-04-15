import { z } from 'zod'
import { mongoIdSchema } from './common.schema'
import {
  adminPaginationQuerySchema,
  sortQuerySchema,
  searchQuerySchema,
  dateRangeQuerySchema,
} from './admin-common.schema'

const REWARD_TYPES = ['voucher', 'gift', 'discount'] as const
const TRANSACTION_TYPES = ['earn', 'redeem', 'bonus'] as const

// ─── Admin Reward List Query ──────────────────────────────────

export const adminRewardListSchema = z.object({
  query: adminPaginationQuerySchema.merge(sortQuerySchema).extend({
    reward_type: z.enum(REWARD_TYPES).optional(),
    is_active: z.enum(['true', 'false']).optional(),
  }),
})

// ─── Create Reward ────────────────────────────────────────────

export const adminCreateRewardSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tên phần thưởng không được để trống').max(200, 'Tên tối đa 200 ký tự'),
    description: z.string().max(1000).optional().default(''),
    points_required: z.number().int().positive('Điểm yêu cầu phải lớn hơn 0'),
    reward_type: z.enum(REWARD_TYPES, { message: 'Loại phần thưởng không hợp lệ' }),
    reward_value: z.number().positive('Giá trị phần thưởng phải lớn hơn 0'),
    stock: z.number().int().min(0, 'Số lượng không được âm'),
    image: z.string().optional(),
  }),
})

// ─── Update Reward ────────────────────────────────────────────

export const adminUpdateRewardSchema = z.object({
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    points_required: z.number().int().positive().optional(),
    reward_type: z.enum(REWARD_TYPES).optional(),
    reward_value: z.number().positive().optional(),
    stock: z.number().int().min(0).optional(),
    image: z.string().optional(),
    is_active: z.boolean().optional(),
  }),
})

// ─── Reward ID Param ──────────────────────────────────────────

export const adminRewardIdSchema = z.object({
  params: z.object({ id: mongoIdSchema }),
})

// ─── Points Adjustment ────────────────────────────────────────

export const adminAdjustPointsSchema = z.object({
  body: z.object({
    user_id: mongoIdSchema,
    points: z
      .number()
      .int()
      .refine((v) => v !== 0, 'Điểm phải khác 0'),
    type: z.enum(TRANSACTION_TYPES, { message: 'Loại giao dịch không hợp lệ' }),
    description: z.string().min(1, 'Mô tả không được để trống').max(500, 'Mô tả tối đa 500 ký tự'),
  }),
})

// ─── Transaction List Query ───────────────────────────────────

export const adminTransactionListSchema = z.object({
  query: adminPaginationQuerySchema
    .merge(sortQuerySchema)
    .merge(dateRangeQuerySchema)
    .extend({
      type: z.enum(TRANSACTION_TYPES).optional(),
      user_id: mongoIdSchema.optional(),
    }),
})
