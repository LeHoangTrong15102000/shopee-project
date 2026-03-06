import { z } from 'zod'
import { mongoIdSchema } from './common.schema'
import { SORT_BY, ORDER } from '@constants/product'

/**
 * Sort by enum for products
 */
const sortByEnum = z.enum(SORT_BY).catch('createdAt')

/**
 * Order enum
 */
const orderEnum = z.enum(ORDER).catch('desc')

/**
 * Add product schema
 * Validates product creation data
 */
export const addProductSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Tên sản phẩm không được để trống')
      .max(160, 'Tên sản phẩm phải ít hơn 160 ký tự'),
    price: z.coerce
      .number()
      .min(0, 'Giá sản phẩm phải lớn hơn hoặc bằng 0'),
    quantity: z.coerce
      .number()
      .int('Số lượng phải là số nguyên không âm')
      .min(0, 'Số lượng phải là số nguyên không âm'),
    category: mongoIdSchema.refine((val) => val, {
      message: 'Danh mục không đúng định dạng',
    }),
    image: z
      .string()
      .min(1, 'Ảnh sản phẩm không được để trống')
      .max(1000, 'URL ảnh phải ít hơn 1000 ký tự'),
    images: z
      .array(z.string().max(1000, 'Mỗi URL ảnh phải ít hơn 1000 ký tự'))
      .optional(),
    description: z
      .string()
      .max(10000, 'Mô tả phải ít hơn 10000 ký tự')
      .optional(),
    price_before_discount: z.coerce
      .number()
      .min(0, 'Giá gốc phải lớn hơn hoặc bằng 0')
      .optional(),
    view: z.coerce.number().optional(),
    sold: z.coerce.number().optional(),
    rating: z.coerce.number().optional(),
    variants: z
      .array(
        z.object({
          type: z.string().max(50, 'Loại biến thể phải ít hơn 50 ký tự'),
          name: z.string().max(100, 'Tên biến thể phải ít hơn 100 ký tự'),
          options: z.array(z.string().max(100, 'Tùy chọn phải ít hơn 100 ký tự')),
        })
      )
      .optional(),
    skus: z
      .array(
        z.object({
          value: z.string().min(1).max(500),
          price: z.coerce.number().min(0),
          stock: z.coerce.number().int().min(0),
          image: z.string().max(1000).optional(),
          variant_values: z.record(z.string(), z.string()).optional(),
        })
      )
      .optional(),
  }),
})

/**
 * Update product schema
 * All fields optional for partial updates
 */
export const updateProductSchema = z.object({
  body: z.object({
    name: z
      .string()
      .max(160, 'Tên sản phẩm phải ít hơn 160 ký tự')
      .optional(),
    price: z.coerce
      .number()
      .min(0, 'Giá sản phẩm phải lớn hơn hoặc bằng 0')
      .optional(),
    quantity: z.coerce
      .number()
      .int('Số lượng phải là số nguyên không âm')
      .min(0, 'Số lượng phải là số nguyên không âm')
      .optional(),
    category: mongoIdSchema
      .refine((val) => val, { message: 'Danh mục không đúng định dạng' })
      .optional(),
    image: z
      .string()
      .max(1000, 'URL ảnh phải ít hơn 1000 ký tự')
      .optional(),
    images: z
      .array(z.string().max(1000, 'Mỗi URL ảnh phải ít hơn 1000 ký tự'))
      .optional(),
    description: z
      .string()
      .max(10000, 'Mô tả phải ít hơn 10000 ký tự')
      .optional(),
    price_before_discount: z.coerce
      .number()
      .min(0, 'Giá gốc phải lớn hơn hoặc bằng 0')
      .optional(),
    view: z.coerce.number().optional(),
    sold: z.coerce.number().optional(),
    rating: z.coerce.number().optional(),
    variants: z
      .array(
        z.object({
          type: z.string().max(50),
          name: z.string().max(100),
          options: z.array(z.string().max(100)),
        })
      )
      .optional(),
  }),
})

/**
 * Get products schema
 * Validates query params for product listing
 */
export const getProductsSchema = z.object({
  query: z.object({
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
    sort_by: sortByEnum.optional(),
    order: orderEnum.optional(),
    price_min: z.coerce
      .number()
      .min(0, 'Giá tối thiểu phải lớn hơn hoặc bằng 0')
      .optional(),
    price_max: z.coerce
      .number()
      .min(0, 'Giá tối đa phải lớn hơn hoặc bằng 0')
      .optional(),
    category: mongoIdSchema
      .refine((val) => val, { message: 'Danh mục không đúng định dạng' })
      .optional(),
    exclude: mongoIdSchema
      .refine((val) => val, { message: 'exclude không đúng định dạng' })
      .optional(),
    name: z.string().optional(),
    rating_filter: z.coerce
      .number()
      .int('Rating filter phải là số từ 1 đến 5')
      .min(1, 'Rating filter phải là số từ 1 đến 5')
      .max(5, 'Rating filter phải là số từ 1 đến 5')
      .optional(),
  }).passthrough(),
})

/**
 * Get all products schema (simpler query)
 */
export const getAllProductsSchema = z.object({
  query: z.object({
    category: mongoIdSchema
      .refine((val) => val, { message: 'category không đúng định dạng' })
      .optional(),
  }).passthrough(),
})

/**
 * Get pages schema
 */
export const getPagesSchema = z.object({
  query: z.object({
    limit: z.coerce
      .number()
      .int('limit không đúng định dạng'),
    category: mongoIdSchema
      .refine((val) => val, { message: 'category không đúng định dạng' })
      .optional(),
  }).passthrough(),
})

/**
 * Product ID param schema
 */
export const productIdParamSchema = z.object({
  params: z.object({
    product_id: mongoIdSchema.refine((val) => val, {
      message: 'product_id không đúng định dạng MongoDB ObjectId',
    }),
  }),
})

// Type exports
export type AddProductInput = z.infer<typeof addProductSchema>['body']
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body']
export type GetProductsQuery = z.infer<typeof getProductsSchema>['query']
