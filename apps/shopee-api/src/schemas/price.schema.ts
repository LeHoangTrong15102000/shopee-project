import { z } from 'zod'
import { mongoIdSchema } from './common.schema'

/**
 * Product ID param schema for price routes
 * Validates productId in route params
 */
export const priceProductIdParamSchema = z.object({
  params: z.object({
    productId: mongoIdSchema.refine((val) => val, {
      message: 'Product ID không hợp lệ',
    }),
  }),
})

// Type exports
export type PriceProductIdParam = z.infer<typeof priceProductIdParamSchema>['params']

