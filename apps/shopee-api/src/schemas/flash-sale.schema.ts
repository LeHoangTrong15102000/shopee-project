import { z } from 'zod'
import { mongoIdSchema } from './common.schema'
import { adminPaginationQuerySchema } from './admin-common.schema'

const FLASH_SALE_STATUSES = ['DRAFT', 'SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED'] as const

const flashSaleProductSchema = z.object({
  productId: mongoIdSchema,
  skuId: mongoIdSchema.optional(),
  originalPrice: z.number().min(0, 'originalPrice must be >= 0'),
  flashPrice: z.number().min(0, 'flashPrice must be >= 0'),
  totalQuantity: z.number().int().min(1, 'totalQuantity must be >= 1'),
  limitPerUser: z.number().int().min(1, 'limitPerUser must be >= 1'),
})

/**
 * Body validation for POST /admin/flash-sales
 */
export const createFlashSaleSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'name is required').max(200),
    description: z.string().max(1000).optional(),
    startTime: z.string().datetime({ message: 'startTime must be a valid ISO 8601 datetime' }),
    endTime: z.string().datetime({ message: 'endTime must be a valid ISO 8601 datetime' }),
    status: z.enum(['DRAFT', 'SCHEDULED']).optional().default('DRAFT'),
    products: z.array(flashSaleProductSchema).min(1, 'At least one product is required'),
  }),
})

/**
 * Body validation for PUT /admin/flash-sales/:id
 */
export const updateFlashSaleSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    startTime: z
      .string()
      .datetime({ message: 'startTime must be a valid ISO 8601 datetime' })
      .optional(),
    endTime: z
      .string()
      .datetime({ message: 'endTime must be a valid ISO 8601 datetime' })
      .optional(),
    products: z.array(flashSaleProductSchema).min(1).optional(),
  }),
})

/**
 * Query validation for GET /admin/flash-sales
 */
export const listFlashSalesSchema = z.object({
  query: adminPaginationQuerySchema.extend({
    status: z.enum(FLASH_SALE_STATUSES).optional(),
  }),
})

/**
 * Param validation for routes with :id
 */
export const flashSaleIdParamSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
})

// Inferred types
export type CreateFlashSaleInput = z.infer<typeof createFlashSaleSchema>['body']
export type UpdateFlashSaleInput = z.infer<typeof updateFlashSaleSchema>['body']
export type ListFlashSalesQuery = z.infer<typeof listFlashSalesSchema>['query']
