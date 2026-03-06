import { z } from 'zod'
import { mongoIdSchema } from './common.schema'
import { adminPaginationQuerySchema, sortQuerySchema, dateRangeQuerySchema } from './admin-common.schema'

// ─── Admin Question List Query ────────────────────────────────

export const adminQuestionListSchema = z.object({
  query: adminPaginationQuerySchema
    .merge(sortQuerySchema)
    .merge(dateRangeQuerySchema)
    .extend({
      product_id: mongoIdSchema.optional(),
      unanswered: z.enum(['true', 'false']).optional(),
    }),
})

// ─── Question ID Param ────────────────────────────────────────

export const adminQuestionIdSchema = z.object({
  params: z.object({ id: mongoIdSchema }),
})

// ─── Delete Answer Params ─────────────────────────────────────

export const adminDeleteAnswerSchema = z.object({
  params: z.object({
    question_id: mongoIdSchema,
    answer_id: mongoIdSchema,
  }),
})

