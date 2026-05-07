import { z } from 'zod'
import { mongoIdSchema } from './common.schema'
import {
  adminPaginationQuerySchema,
  sortQuerySchema,
  searchQuerySchema,
} from './admin-common.schema'

// ─── Admin Review List Query ─────────────────────────────────────

export const adminReviewListSchema = z.object({
  query: adminPaginationQuerySchema
    .merge(sortQuerySchema)
    .merge(searchQuerySchema)
    .extend({
      rating: z.coerce.number().int().min(1).max(5).optional(),
      product_id: mongoIdSchema.optional(),
      user_id: mongoIdSchema.optional(),
      moderation_status: z.enum(['pending', 'approved', 'flagged']).optional(),
    }),
})

export type AdminReviewListQuery = z.infer<typeof adminReviewListSchema>['query']

// ─── Review ID Param ─────────────────────────────────────────────

export const adminReviewIdSchema = z.object({
  params: z.object({ id: mongoIdSchema }),
})

// ─── Comment ID Param ────────────────────────────────────────────

export const adminCommentIdSchema = z.object({
  params: z.object({ id: mongoIdSchema }),
})

// ─── Moderate Review Body ─────────────────────────────────────────

export const adminModerateReviewSchema = z.object({
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    status: z.enum(['pending', 'approved', 'flagged']),
  }),
})

export type AdminModerateReviewBody = z.infer<typeof adminModerateReviewSchema>['body']
