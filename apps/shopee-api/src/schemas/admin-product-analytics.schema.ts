import { z } from 'zod'
import { periodSchema, limitQuerySchema } from './admin-common.schema'

// ─── Top Selling Query ────────────────────────────────────────

export const adminTopSellingSchema = z.object({
  query: limitQuerySchema.extend({
    period: periodSchema.optional().default('30d'),
  }),
})

// ─── Top Viewed Query ─────────────────────────────────────────

export const adminTopViewedSchema = z.object({
  query: limitQuerySchema,
})

// ─── Top Rated Query ──────────────────────────────────────────

export const adminTopRatedSchema = z.object({
  query: limitQuerySchema.extend({
    min_reviews: z.coerce.number().int().min(1).optional().default(1),
  }),
})

// ─── By Category Query ────────────────────────────────────────

export const adminProductByCategorySchema = z.object({
  query: z.object({}).optional(),
})
