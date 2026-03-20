import { z } from 'zod'
import { mongoIdSchema } from './common.schema'

/**
 * Price product ID param schema
 * Validates productId route parameter
 */
export const priceProductIdParamSchema = z.object({
  params: z.object({
    productId: mongoIdSchema,
  }),
})

export type PriceProductIdParam = z.infer<typeof priceProductIdParamSchema>
