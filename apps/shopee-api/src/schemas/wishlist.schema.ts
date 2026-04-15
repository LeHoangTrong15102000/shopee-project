import { z } from 'zod'
import { mongoIdSchema } from './common.schema'

/**
 * Get wishlist schema
 * Validates query params for listing wishlist items
 */
export const getWishlistSchema = z.object({
  query: z
    .object({
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
    })
    .passthrough(),
})

/**
 * Add to wishlist schema
 * Validates product_id in body
 */
export const addToWishlistSchema = z.object({
  body: z.object({
    product_id: z
      .string()
      .min(1, 'Product ID là bắt buộc')
      .regex(/^[0-9a-fA-F]{24}$/, 'Product ID không hợp lệ'),
  }),
})

/**
 * Product ID param schema for wishlist
 */
export const wishlistProductIdParamSchema = z.object({
  params: z.object({
    product_id: mongoIdSchema.refine((val) => val, {
      message: 'Product ID không hợp lệ',
    }),
  }),
})

/**
 * Remove from wishlist schema
 * Same as product ID param schema
 */
export const removeFromWishlistSchema = wishlistProductIdParamSchema

/**
 * Check in wishlist schema
 * Same as product ID param schema
 */
export const checkInWishlistSchema = wishlistProductIdParamSchema

// Type exports
export type GetWishlistQuery = z.infer<typeof getWishlistSchema>['query']
export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>['body']
