import { z } from 'zod'
import { mongoIdSchema, paginationQuerySchema } from './common.schema'

// ─── Period Presets ───────────────────────────────────────────────

export const PERIOD_VALUES = ['today', '7d', '30d', '90d', '1y'] as const
export type PeriodValue = (typeof PERIOD_VALUES)[number]

export const periodSchema = z.enum(PERIOD_VALUES, {
  message: 'Period phải là: today, 7d, 30d, 90d, 1y',
})

// ─── Date Range ──────────────────────────────────────────────────

export const dateRangeQuerySchema = z.object({
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date phải có định dạng YYYY-MM-DD')
    .optional(),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date phải có định dạng YYYY-MM-DD')
    .optional(),
})

// ─── Admin Pagination (extends common, higher max) ───────────────

export const adminPaginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .int('Trang phải là số nguyên dương')
    .min(1, 'Trang phải là số nguyên dương')
    .optional()
    .default(1),
  limit: z.coerce
    .number()
    .int('Limit phải là số nguyên từ 1 đến 100')
    .min(1, 'Limit phải là số nguyên từ 1 đến 100')
    .max(100, 'Limit phải là số nguyên từ 1 đến 100')
    .optional()
    .default(20),
})

// ─── Period + Date Range combo (used by analytics endpoints) ─────

export const periodDateRangeQuerySchema = z
  .object({
    period: periodSchema.optional(),
  })
  .merge(dateRangeQuerySchema)
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return new Date(data.start_date) <= new Date(data.end_date)
      }
      return true
    },
    { message: 'start_date phải trước hoặc bằng end_date' }
  )

export type PeriodDateRangeQuery = z.infer<typeof periodDateRangeQuerySchema>

// ─── Limit param (for top-N queries) ─────────────────────────────

export const limitQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int('Limit phải là số nguyên dương')
    .min(1, 'Limit phải từ 1 đến 100')
    .max(100, 'Limit phải từ 1 đến 100')
    .optional()
    .default(10),
})

// ─── MongoDB ObjectId param (reusable for any :id param) ─────────

export const objectIdParamSchema = (paramName: string) =>
  z.object({
    params: z.object({
      [paramName]: mongoIdSchema,
    }),
  })

// ─── Sort ────────────────────────────────────────────────────────

export const sortQuerySchema = z.object({
  sort_by: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
})

// ─── Search ──────────────────────────────────────────────────────

export const searchQuerySchema = z.object({
  search: z.string().optional(),
})

// ─── Helper: build date range from period ────────────────────────

export function getDateRangeFromPeriod(period?: PeriodValue, startDate?: string, endDate?: string) {
  if (startDate && endDate) {
    return {
      start: new Date(startDate),
      end: new Date(endDate + 'T23:59:59.999Z'),
    }
  }

  const now = new Date()
  const end = new Date(now)
  let start: Date

  switch (period) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case '1y':
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // default 30d
      break
  }

  return { start, end }
}

/**
 * Get MongoDB $dateToString format and grouping interval based on period
 */
export function getGroupingForPeriod(period?: PeriodValue) {
  switch (period) {
    case 'today':
      return { format: '%Y-%m-%d %H:00', interval: 'hour' as const }
    case '7d':
    case '30d':
      return { format: '%Y-%m-%d', interval: 'day' as const }
    case '90d':
      return { format: '%Y-W%V', interval: 'week' as const }
    case '1y':
      return { format: '%Y-%m', interval: 'month' as const }
    default:
      return { format: '%Y-%m-%d', interval: 'day' as const }
  }
}

