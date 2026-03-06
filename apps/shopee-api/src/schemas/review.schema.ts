import { z } from 'zod'
import { mongoIdSchema } from './common.schema'

/**
 * Review sort enum
 */
const reviewSortEnum = z.enum(
  ['newest', 'oldest', 'highest_rating', 'lowest_rating', 'most_helpful']
).catch('newest')

/**
 * Create review schema
 * Validates review creation data
 */
export const createReviewSchema = z.object({
  body: z.object({
    purchase_id: mongoIdSchema.refine((val) => val, {
      message: 'Purchase ID là bắt buộc',
    }),
    rating: z.coerce
      .number()
      .int('Rating phải từ 1 đến 5')
      .min(1, 'Rating phải từ 1 đến 5')
      .max(5, 'Rating phải từ 1 đến 5'),
    comment: z
      .string()
      .min(10, 'Bình luận phải từ 10 đến 2000 ký tự')
      .max(2000, 'Bình luận phải từ 10 đến 2000 ký tự'),
    images: z
      .array(z.string().max(1000, 'URL hình ảnh không hợp lệ'))
      .max(10, 'Tối đa 10 hình ảnh')
      .optional(),
  }),
})

/**
 * Get product reviews schema
 * Validates product_id param and query params
 */
export const getProductReviewsSchema = z.object({
  params: z.object({
    product_id: mongoIdSchema.refine((val) => val, {
      message: 'Product ID không hợp lệ',
    }),
  }),
  query: z.object({
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
    rating: z.coerce
      .number()
      .int('Rating phải từ 1 đến 5')
      .min(1, 'Rating phải từ 1 đến 5')
      .max(5, 'Rating phải từ 1 đến 5')
      .optional(),
    sort: reviewSortEnum.optional(),
  }).passthrough(),
})

/**
 * Review ID param schema
 * Validates review_id in route params
 */
export const reviewIdParamSchema = z.object({
  params: z.object({
    review_id: mongoIdSchema.refine((val) => val, {
      message: 'Review ID không hợp lệ',
    }),
  }),
})

/**
 * Toggle review like schema (same as reviewIdParamSchema)
 */
export const toggleReviewLikeSchema = reviewIdParamSchema

/**
 * Create review comment schema
 * Validates comment creation data
 */
export const createReviewCommentSchema = z.object({
  body: z.object({
    review_id: mongoIdSchema.refine((val) => val, {
      message: 'Review ID là bắt buộc',
    }),
    content: z
      .string()
      .min(1, 'Nội dung bình luận phải từ 1 đến 1000 ký tự')
      .max(1000, 'Nội dung bình luận phải từ 1 đến 1000 ký tự'),
    parent_comment_id: mongoIdSchema
      .refine((val) => val, { message: 'Parent comment ID không hợp lệ' })
      .optional(),
  }),
})

/**
 * Get review comments schema
 * Validates review_id param and pagination query
 */
export const getReviewCommentsSchema = z.object({
  params: z.object({
    review_id: mongoIdSchema.refine((val) => val, {
      message: 'Review ID không hợp lệ',
    }),
  }),
  query: z.object({
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
  }).passthrough(),
})

/**
 * Can review purchase schema
 * Validates purchase_id param
 */
export const canReviewPurchaseSchema = z.object({
  params: z.object({
    purchase_id: mongoIdSchema.refine((val) => val, {
      message: 'Purchase ID không hợp lệ',
    }),
  }),
})

/**
 * Update review schema
 * Validates review update data - at least one field required
 */
export const updateReviewSchema = z.object({
  params: z.object({
    review_id: mongoIdSchema.refine((val) => val, {
      message: 'Review ID không hợp lệ',
    }),
  }),
  body: z.object({
    rating: z.coerce
      .number()
      .int('Rating phải từ 1 đến 5')
      .min(1, 'Rating phải từ 1 đến 5')
      .max(5, 'Rating phải từ 1 đến 5')
      .optional(),
    comment: z
      .string()
      .min(10, 'Bình luận phải từ 10 đến 2000 ký tự')
      .max(2000, 'Bình luận phải từ 10 đến 2000 ký tự')
      .optional(),
    images: z
      .array(z.string().max(1000, 'URL hình ảnh không hợp lệ'))
      .max(10, 'Tối đa 10 hình ảnh')
      .optional(),
  }).refine(
    (data) => data.rating !== undefined || data.comment !== undefined || data.images !== undefined,
    { message: 'Cần ít nhất một trường để cập nhật' }
  ),
})

/**
 * Delete review schema
 * Validates review_id param for deletion
 */
export const deleteReviewSchema = z.object({
  params: z.object({
    review_id: mongoIdSchema.refine((val) => val, {
      message: 'Review ID không hợp lệ',
    }),
  }),
})

// Type exports
export type CreateReviewInput = z.infer<typeof createReviewSchema>['body']
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>['body']
export type GetProductReviewsQuery = z.infer<typeof getProductReviewsSchema>['query']
export type CreateReviewCommentInput = z.infer<typeof createReviewCommentSchema>['body']
export type GetReviewCommentsQuery = z.infer<typeof getReviewCommentsSchema>['query']

