import { z } from 'zod'
import { ORDER_STATUS } from '@database/models/order.model'

/**
 * Return order request body validation
 */
export const returnOrderSchema = z.object({
  body: z.object({
    reason: z.string('Lý do trả hàng là bắt buộc').min(1, 'Lý do trả hàng là bắt buộc'),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID đơn hàng không hợp lệ'),
  }),
})

export type ReturnOrderInput = z.infer<typeof returnOrderSchema>

/**
 * Admin update order status request body validation
 */
export const adminUpdateStatusSchema = z.object({
  body: z.object({
    status: z.enum(
      Object.values(ORDER_STATUS) as [string, ...string[]],
      'Trạng thái không hợp lệ',
    ),
    reason: z.string().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID đơn hàng không hợp lệ'),
  }),
})

export type AdminUpdateStatusInput = z.infer<typeof adminUpdateStatusSchema>

/**
 * Admin get order by ID param validation
 */
export const adminGetOrderSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID đơn hàng không hợp lệ'),
  }),
})

export type AdminGetOrderInput = z.infer<typeof adminGetOrderSchema>
