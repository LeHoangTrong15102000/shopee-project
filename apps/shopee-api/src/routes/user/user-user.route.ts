import { Router, Request, Response, NextFunction } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import userController from '@controllers/user.controller'
import { asyncHandler } from '@utils/async-handler'
import { validate, updateMeSchema } from '@schemas/index'
import { Logger } from '@utils/logger'

/**
 * Middleware that adds deprecation headers and logs a warning.
 * These /user routes are deprecated — use /me instead.
 * Sunset date: 2 weeks after deployment.
 */
const deprecationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Deprecation', 'true')
  res.setHeader('Sunset', 'Sat, 01 Jun 2026 00:00:00 GMT')
  res.setHeader('Link', '</me>; rel="successor-version"')
  Logger.apiWarn('deprecated_route.called', {
    path: req.path,
    method: req.method,
    replacement: req.path.replace('/user', '/me'),
    userAgent: req.headers['user-agent'] || '',
  })
  next()
}

export const userUserRouter = Router()
userUserRouter.put(
  '',
  deprecationMiddleware,
  validate(updateMeSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(userController.updateMe),
)
userUserRouter.post(
  '/upload-avatar',
  deprecationMiddleware,
  authMiddleware.verifyAccessToken,
  asyncHandler(userController.uploadAvatar),
)

userUserRouter.get(
  '',
  deprecationMiddleware,
  authMiddleware.verifyAccessToken,
  asyncHandler(userController.getDetailMySelf),
)
