import { z } from 'zod'
import { mongoIdSchema } from './common.schema'

// ─── Conditions schema ────────────────────────────────────────────────────────

const featureFlagConditionsSchema = z.object({
  userIds: z.array(z.string()).optional(),
  userRoles: z.array(z.string()).optional(),
  platform: z.array(z.enum(['web', 'mobile', 'admin'])).optional(),
  startDate: z
    .string()
    .datetime({ message: 'startDate must be a valid ISO 8601 datetime' })
    .optional(),
  endDate: z.string().datetime({ message: 'endDate must be a valid ISO 8601 datetime' }).optional(),
})

// ─── Route schemas ────────────────────────────────────────────────────────────

/**
 * POST /admin/feature-flags
 */
export const createFeatureFlagSchema = z.object({
  body: z.object({
    key: z
      .string()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9-]+$/, 'key must be lowercase alphanumeric with hyphens'),
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    enabled: z.boolean().optional().default(false),
    rolloutPercentage: z.number().int().min(0).max(100).optional().default(100),
    conditions: featureFlagConditionsSchema.optional(),
  }),
})

/**
 * PUT /admin/feature-flags/:id
 */
export const updateFeatureFlagSchema = z.object({
  params: z.object({ id: mongoIdSchema }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    enabled: z.boolean().optional(),
    rolloutPercentage: z.number().int().min(0).max(100).optional(),
    conditions: featureFlagConditionsSchema.nullable().optional(),
  }),
})

/**
 * DELETE /admin/feature-flags/:id and PATCH /admin/feature-flags/:id/toggle
 */
export const featureFlagIdParamSchema = z.object({
  params: z.object({ id: mongoIdSchema }),
})

/**
 * GET /feature-flags?keys=...
 */
export const getFeatureFlagsSchema = z.object({
  query: z.object({
    keys: z.string().min(1),
  }),
})

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateFeatureFlagInput = z.infer<typeof createFeatureFlagSchema>['body']
export type UpdateFeatureFlagInput = z.infer<typeof updateFeatureFlagSchema>['body']
