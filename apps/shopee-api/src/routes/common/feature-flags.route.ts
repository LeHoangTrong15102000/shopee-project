import { Router, Request, Response } from 'express'
import { asyncHandler } from '@utils/async-handler'
import { validate } from '@schemas/index'
import { getFeatureFlagsSchema } from '@schemas/feature-flag.schema'
import { responseSuccess } from '@utils/response'
import { FeatureFlagContext } from '@services/feature-flag.service'

const featureFlagsRouter = Router()

/**
 * GET /feature-flags?keys=key1,key2,key3
 *
 * Evaluates each requested flag key for the current user context.
 * Auth is optional — if a valid JWT is present, user context is extracted.
 * Unknown keys return false.
 */
featureFlagsRouter.get(
  '/',
  validate(getFeatureFlagsSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { featureFlagService } = await import('../../container')

    const keysParam = req.query.keys as string
    const keys = keysParam
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)

    // Build context from optional auth
    const context: FeatureFlagContext = {}
    if (req.jwtDecoded) {
      if (req.jwtDecoded.id) context.userId = String(req.jwtDecoded.id)
      if (req.jwtDecoded.roles && req.jwtDecoded.roles.length > 0) {
        context.userRole = req.jwtDecoded.roles[0]
      }
    }

    const platform = req.headers['x-platform']
    if (typeof platform === 'string') {
      context.platform = platform
    }

    // Evaluate all keys in parallel
    const results = await Promise.all(
      keys.map(async (key) => {
        try {
          const enabled = await featureFlagService.isEnabled(key, context)
          return [key, enabled] as [string, boolean]
        } catch {
          return [key, false] as [string, boolean]
        }
      }),
    )

    const data: Record<string, boolean> = {}
    for (const [key, enabled] of results) {
      data[key] = enabled
    }

    return responseSuccess(res, { message: 'Feature flags evaluated successfully', data })
  }),
)

export default featureFlagsRouter
