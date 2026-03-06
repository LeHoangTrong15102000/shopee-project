import { z } from 'zod'
import { mongoIdSchema } from './common.schema'

/**
 * Get vouchers schema
 * Validates query params for listing vouchers
 */
export const getVouchersSchema = z.object({
  query: z.object({
    page: z.coerce
      .number()
      .int('Page phải là số nguyên dương')
      .min(1, 'Page phải là số nguyên dương')
      .optional(),
    limit: z.coerce
      .number()
      .int('Limit phải từ 1 đến 50')
      .min(1, 'Limit phải từ 1 đến 50')
      .max(50, 'Limit phải từ 1 đến 50')
      .optional(),
  }).passthrough(),
})

/**
 * Get voucher by code schema
 * Validates code param
 */
export const getVoucherByCodeSchema = z.object({
  params: z.object({
    code: z
      .string()
      .min(1, 'Mã voucher là bắt buộc'),
  }),
})

/**
 * Apply voucher schema
 * Validates voucher application data
 */
export const applyVoucherSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(1, 'Mã voucher là bắt buộc'),
    order_value: z.coerce
      .number()
      .min(0, 'Giá trị đơn hàng phải là số dương'),
    product_ids: z
      .array(mongoIdSchema.refine((val) => val, { message: 'Product ID không hợp lệ' }))
      .optional(),
    category_ids: z
      .array(mongoIdSchema.refine((val) => val, { message: 'Category ID không hợp lệ' }))
      .optional(),
  }),
})

/**
 * Save voucher schema
 * Validates voucher ID param
 */
export const saveVoucherSchema = z.object({
  params: z.object({
    id: mongoIdSchema.refine((val) => val, {
      message: 'Voucher ID không hợp lệ',
    }),
  }),
})

/**
 * Get saved vouchers schema
 * Same as get vouchers schema
 */
export const getSavedVouchersSchema = getVouchersSchema

/**
 * Get available vouchers schema
 * Validates query params for listing available vouchers
 */
export const getAvailableVouchersSchema = z.object({
  query: z.object({
    page: z.coerce
      .number()
      .int('Page phải là số nguyên dương')
      .min(1, 'Page phải là số nguyên dương')
      .optional(),
    limit: z.coerce
      .number()
      .int('Limit phải từ 1 đến 50')
      .min(1, 'Limit phải từ 1 đến 50')
      .max(50, 'Limit phải từ 1 đến 50')
      .optional(),
    discount_type: z
      .enum(['fixed_amount', 'percentage', 'shipping'])
      .optional(),
  }).passthrough(),
})

/**
 * Get my vouchers schema
 * Validates query params for listing user's collected vouchers
 */
export const getMyVouchersSchema = z.object({
  query: z.object({
    page: z.coerce
      .number()
      .int('Page phải là số nguyên dương')
      .min(1, 'Page phải là số nguyên dương')
      .optional(),
    limit: z.coerce
      .number()
      .int('Limit phải từ 1 đến 50')
      .min(1, 'Limit phải từ 1 đến 50')
      .max(50, 'Limit phải từ 1 đến 50')
      .optional(),
    status: z
      .enum(['available', 'used', 'expired', 'all'])
      .optional(),
  }).passthrough(),
})

/**
 * Collect voucher schema
 * Validates voucher ID param
 */
export const collectVoucherSchema = z.object({
  params: z.object({
    id: mongoIdSchema.refine((val) => val, {
      message: 'Voucher ID không hợp lệ',
    }),
  }),
})

/**
 * Validate voucher schema
 * Validates voucher code and order total
 */
export const validateVoucherSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(1, 'Mã voucher là bắt buộc'),
    order_total: z.coerce
      .number()
      .min(0, 'Giá trị đơn hàng phải là số dương'),
  }),
})

// Type exports
export type GetVouchersQuery = z.infer<typeof getVouchersSchema>['query']
export type ApplyVoucherInput = z.infer<typeof applyVoucherSchema>['body']
export type GetAvailableVouchersQuery = z.infer<typeof getAvailableVouchersSchema>['query']
export type GetMyVouchersQuery = z.infer<typeof getMyVouchersSchema>['query']
export type ValidateVoucherInput = z.infer<typeof validateVoucherSchema>['body']

