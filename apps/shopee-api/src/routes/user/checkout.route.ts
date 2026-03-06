import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import * as checkoutController from '@controllers/checkout.controller'
import { asyncHandler } from '@utils/async-handler'
import { validate } from '@schemas/index'
import { z } from 'zod'
import { mongoIdSchema } from '@schemas/common.schema'
import { PAYMENT_METHOD } from '@database/models/order.model'

// Checkout summary schema
const checkoutSummarySchema = z.object({
  body: z.object({
    purchase_ids: z.array(mongoIdSchema).min(1, 'Phải có ít nhất 1 sản phẩm'),
    voucher_code: z.string().optional(),
    coins_used: z.coerce.number().min(0).optional(),
    shipping_method_id: z.string().optional(),
  }),
})

// Create order schema
const createOrderSchema = z.object({
  body: z.object({
    purchase_ids: z.array(mongoIdSchema).min(1, 'Phải có ít nhất 1 sản phẩm'),
    shipping_address_id: mongoIdSchema,
    shipping_method_id: z.string().min(1, 'Phương thức vận chuyển là bắt buộc'),
    payment_method: z.enum(Object.values(PAYMENT_METHOD) as [string, ...string[]]),
    voucher_code: z.string().optional(),
    coins_used: z.coerce.number().min(0).optional(),
    note: z.string().max(500).optional(),
  }),
})

export const userCheckoutRouter = Router()

// Get checkout summary
userCheckoutRouter.post(
  '/summary',
  validate(checkoutSummarySchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(checkoutController.getCheckoutSummary)
)

// Create order from checkout
userCheckoutRouter.post(
  '/create-order',
  validate(createOrderSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(checkoutController.createCheckoutOrder)
)

