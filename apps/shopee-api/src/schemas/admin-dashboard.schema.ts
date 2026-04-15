import { z } from 'zod'
import { periodSchema, dateRangeQuerySchema, limitQuerySchema } from './admin-common.schema'

// ─── Overview (no query params needed) ───────────────────────────

export const dashboardOverviewSchema = z.object({
  query: z.object({}).optional(),
})

// ─── Revenue ─────────────────────────────────────────────────────

export const dashboardRevenueSchema = z.object({
  query: z
    .object({
      period: periodSchema.optional(),
    })
    .merge(dateRangeQuerySchema),
})

export type DashboardRevenueQuery = z.infer<typeof dashboardRevenueSchema>['query']

// ─── Revenue by Category ────────────────────────────────────────

export const dashboardRevenueByCategorySchema = z.object({
  query: z.object({
    period: periodSchema.optional(),
  }),
})

// ─── Revenue by Product ─────────────────────────────────────────

export const dashboardRevenueByProductSchema = z.object({
  query: z
    .object({
      period: periodSchema.optional(),
    })
    .merge(limitQuerySchema.pick({ limit: true })),
})

// ─── Order Trend ────────────────────────────────────────────────

export const dashboardOrderTrendSchema = z.object({
  query: z.object({
    period: periodSchema.optional(),
  }),
})

// ─── User Growth ────────────────────────────────────────────────

export const dashboardUserGrowthSchema = z.object({
  query: z.object({
    period: periodSchema.optional(),
  }),
})

// ─── Top Buyers ─────────────────────────────────────────────────

export const dashboardTopBuyersSchema = z.object({
  query: z
    .object({
      period: periodSchema.optional(),
    })
    .merge(limitQuerySchema.pick({ limit: true })),
})
