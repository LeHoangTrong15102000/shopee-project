import { z } from 'zod'
import { mongoIdSchema } from './common.schema'

/**
 * Cart item schema (used for add to cart and update)
 */
const cartItemSchema = z.object({
  product_id: mongoIdSchema.refine((val) => val, {
    message: 'product_id không đúng định dạng',
  }),
  buy_count: z.coerce
    .number()
    .int('buy_count phải là số nguyên lớn hơn 0')
    .min(1, 'buy_count phải là số nguyên lớn hơn 0'),
})

/**
 * Add to cart schema
 * Validates adding a single item to cart
 */
export const addToCartSchema = z.object({
  body: z.object({
    product_id: z
      .string()
      .min(1, 'product_id không được để trống')
      .refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
        message: 'product_id không đúng định dạng',
      }),
    buy_count: z.coerce
      .number()
      .int('buy_count phải là số nguyên lớn hơn 0')
      .min(1, 'buy_count phải là số nguyên lớn hơn 0'),
  }),
})

/**
 * Update purchase schema (same as add to cart)
 */
export const updatePurchaseSchema = addToCartSchema

/**
 * Buy products schema
 * Validates buying multiple products at once
 */
export const buyProductsSchema = z.object({
  body: z
    .array(cartItemSchema)
    .min(1, 'body không đúng định dạng')
    .refine(
      (items) =>
        items.every(
          (item) =>
            /^[0-9a-fA-F]{24}$/.test(item.product_id) &&
            Number.isInteger(item.buy_count) &&
            item.buy_count >= 1,
        ),
      { message: 'body không đúng định dạng' },
    ),
})

/**
 * Delete purchases schema
 * Validates deleting multiple purchases by ID
 */
export const deletePurchasesSchema = z.object({
  body: z
    .array(z.string())
    .min(1, 'body phải là array id')
    .refine((ids) => ids.every((id) => /^[0-9a-fA-F]{24}$/.test(id)), {
      message: 'body phải là array id',
    }),
})

// Type exports
export type AddToCartInput = z.infer<typeof addToCartSchema>['body']
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>['body']
export type BuyProductsInput = z.infer<typeof buyProductsSchema>['body']
export type DeletePurchasesInput = z.infer<typeof deletePurchasesSchema>['body']
