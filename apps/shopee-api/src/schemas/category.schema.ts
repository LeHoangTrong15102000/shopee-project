import { z } from 'zod'
import { mongoIdSchema } from './common.schema'

/**
 * Add category schema
 * Validates name for creating a category
 */
export const addCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Tên không được để trống')
      .max(160, 'Tên phải ít hơn 160 kí tự'),
  }),
})

/**
 * Update category schema
 * Same validation as add category
 */
export const updateCategorySchema = addCategorySchema

/**
 * Get categories schema
 * Validates query params for listing categories
 */
export const getCategorySchema = z.object({
  query: z.object({
    exclude: mongoIdSchema.optional().or(z.literal('')),
  }).passthrough(),
})

/**
 * Category ID param schema
 */
export const categoryIdParamSchema = z.object({
  params: z.object({
    category_id: mongoIdSchema,
  }),
})

// Type exports
export type AddCategoryInput = z.infer<typeof addCategorySchema>['body']
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body']
export type GetCategoryQuery = z.infer<typeof getCategorySchema>['query']

