import { z } from 'zod'

/**
 * MongoDB ObjectId validation schema
 * Validates 24-character hexadecimal string
 */
export const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Không đúng định dạng MongoDB ObjectId')

/**
 * Create a MongoDB ID param schema for route parameters
 * @param paramName - The name of the route parameter
 */
export const mongoIdParamSchema = (paramName: string) =>
  z.object({
    params: z.object({
      [paramName]: mongoIdSchema.describe(`${paramName} không đúng định dạng MongoDB ObjectId`),
    }),
  })

/**
 * Pagination query schema
 * Validates page and limit query parameters
 */
export const paginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .int('Trang phải là số nguyên dương')
    .min(1, 'Trang phải là số nguyên dương')
    .optional(),
  limit: z.coerce
    .number()
    .int('Limit phải là số nguyên từ 1 đến 100')
    .min(1, 'Limit phải là số nguyên từ 1 đến 100')
    .max(100, 'Limit phải là số nguyên từ 1 đến 100')
    .optional(),
})

/**
 * Full pagination schema with query wrapper
 */
export const paginationSchema = z.object({
  query: paginationQuerySchema,
})

// Type exports for use in controllers
export type PaginationQuery = z.infer<typeof paginationQuerySchema>

