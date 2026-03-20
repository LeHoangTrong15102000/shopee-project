import { z } from 'zod'
import { mongoIdSchema } from './common.schema'
import { SORT_BY, ORDER } from '@constants/product'
import {
  validateNoDuplicateVariantTypes,
  validateNoDuplicateOptions,
  validateVariantLimits,
  generateSKUCombinations,
  VariantInput,
} from '@utils/variant.helper'

/**
 * Sort by enum for products
 */
const sortByEnum = z.enum(SORT_BY).catch('createdAt')

/**
 * Order enum
 */
const orderEnum = z.enum(ORDER).catch('desc')

/**
 * Variant option schema with name, value, and optional image.
 */
const variantOptionSchema = z.object({
  name: z.string()
    .min(1, 'Tên tùy chọn không được để trống')
    .max(100, 'Tên tùy chọn phải ít hơn 100 ký tự')
    .refine((val) => val.trim().length > 0, { message: 'Tên tùy chọn không được chỉ chứa khoảng trắng' }),
  value: z.string()
    .min(1, 'Giá trị tùy chọn không được để trống')
    .max(100, 'Giá trị tùy chọn phải ít hơn 100 ký tự')
    .refine((val) => val.trim().length > 0, { message: 'Giá trị tùy chọn không được chỉ chứa khoảng trắng' }),
  image: z.string().max(1000, 'URL ảnh phải ít hơn 1000 ký tự').optional(),
})

/**
 * Allowed variant types - must match frontend ProductVariant.type
 */
const VARIANT_TYPES = ['color', 'size', 'style', 'material'] as const

/**
 * Reusable variant validation schema with custom refinements.
 * Validates individual variant structure (type, name, options).
 */
const variantItemSchema = z.object({
  type: z.enum(VARIANT_TYPES, { message: 'Loại biến thể phải là: color, size, style, hoặc material' }),
  name: z.string().min(1, 'Tên biến thể không được để trống').max(100, 'Tên biến thể phải ít hơn 100 ký tự'),
  options: z.array(variantOptionSchema).min(1, 'Biến thể phải có ít nhất 1 tùy chọn'),
})

/**
 * Variants array schema with cross-variant validation.
 * Uses superRefine for multi-step validation:
 * 1. Check for duplicate variant types (case-insensitive)
 * 2. Check for duplicate options within each variant
 * 3. Validate limits (max 5 variants, max 20 options, max 100 SKU combinations)
 */
const variantsArraySchema = z
  .array(variantItemSchema)
  .superRefine((variants, ctx) => {
    // Step 1: Validate no duplicate variant types
    const dupTypeErr = validateNoDuplicateVariantTypes(variants)
    if (dupTypeErr) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: dupTypeErr })
      return
    }
    // Step 2: Validate no duplicate options within each variant
    const dupOptErr = validateNoDuplicateOptions(variants)
    if (dupOptErr) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: dupOptErr })
      return
    }
    // Step 3: Validate variant limits
    const limitsErr = validateVariantLimits(variants)
    if (limitsErr) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: limitsErr })
    }
  })

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
    variants: variantsArraySchema.optional(),
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
  }).superRefine((data, ctx) => {
    // Cross-field validation: if variants provided, validate SKUs match
    if (data.variants && data.variants.length > 0 && data.skus && data.skus.length > 0) {
      const expectedCombinations = generateSKUCombinations(data.variants as VariantInput[])
      if (data.skus.length !== expectedCombinations.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Số lượng SKU không khớp: cần ${expectedCombinations.length}, nhận được ${data.skus.length}`,
          path: ['skus'],
        })
      } else {
        for (let i = 0; i < expectedCombinations.length; i++) {
          if (data.skus[i].value !== expectedCombinations[i]) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `SKU tại vị trí ${i} không khớp: cần "${expectedCombinations[i]}", nhận được "${data.skus[i].value}"`,
              path: ['skus', i, 'value'],
            })
            break
          }
        }
      }
    }
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
    variants: variantsArraySchema.optional(),
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
  }).superRefine((data, ctx) => {
    // Cross-field validation: if both variants and skus provided, validate SKUs match
    if (data.variants && data.variants.length > 0 && data.skus && data.skus.length > 0) {
      const expectedCombinations = generateSKUCombinations(data.variants as VariantInput[])
      if (data.skus.length !== expectedCombinations.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Số lượng SKU không khớp: cần ${expectedCombinations.length}, nhận được ${data.skus.length}`,
          path: ['skus'],
        })
      } else {
        for (let i = 0; i < expectedCombinations.length; i++) {
          if (data.skus[i].value !== expectedCombinations[i]) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `SKU tại vị trí ${i} không khớp: cần "${expectedCombinations[i]}", nhận được "${data.skus[i].value}"`,
              path: ['skus', i, 'value'],
            })
            break
          }
        }
      }
    }
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
