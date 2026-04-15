import { z } from 'zod'
import { mongoIdSchema } from './common.schema'

/**
 * Create SKU schema
 */
export const createSKUSchema = z.object({
  body: z.object({
    value: z.string().min(1, 'Mã SKU không được để trống').max(500, 'Mã SKU phải ít hơn 500 ký tự'),
    price: z.coerce.number().min(0, 'Giá phải lớn hơn hoặc bằng 0'),
    stock: z.coerce
      .number()
      .int('Tồn kho phải là số nguyên')
      .min(0, 'Tồn kho phải lớn hơn hoặc bằng 0'),
    image: z.string().max(1000, 'URL ảnh phải ít hơn 1000 ký tự').optional(),
    variant_values: z.record(z.string(), z.string()).optional(),
  }),
})

/**
 * Update SKU schema (all fields optional)
 */
export const updateSKUSchema = z.object({
  body: z.object({
    value: z.string().min(1).max(500).optional(),
    price: z.coerce.number().min(0).optional(),
    stock: z.coerce.number().int().min(0).optional(),
    image: z.string().max(1000).optional(),
    variant_values: z.record(z.string(), z.string()).optional(),
  }),
})

/**
 * SKU ID param schema
 */
export const skuIdParamSchema = z.object({
  params: z.object({
    sku_id: mongoIdSchema,
  }),
})

// Type exports
export type CreateSKUInput = z.infer<typeof createSKUSchema>['body']
export type UpdateSKUInput = z.infer<typeof updateSKUSchema>['body']
