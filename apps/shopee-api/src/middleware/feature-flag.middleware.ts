import { Request, Response, NextFunction } from 'express'
import { ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { FeatureFlagContext } from '@services/feature-flag.service'

/**
 * Middleware factory that gates a route behind a feature flag.
 *
 * Usage:
 *   router.get('/new-feature', featureFlag('new-search'), asyncHandler(handler))
 *
 * Returns 403 if the flag is disabled for the current request context.
 * Extracts context from req.jwtDecoded if the user is authenticated.
 */
export function featureFlag(key: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { featureFlagService } = await import('../container')

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

      const enabled = await featureFlagService.isEnabled(key, context)
      if (!enabled) {
        res
          .status(STATUS.FORBIDDEN)
          .send({ message: `Feature '${key}' is not available` })
        return
      }

      next()
    } catch (err) {
      next(err)
    }
  }
}
