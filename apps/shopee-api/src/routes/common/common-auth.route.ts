import { Router } from 'express'
import authController from '@controllers/auth.controller'
import * as passwordResetController from '@controllers/password-reset.controller'
import authMiddleware from '@middleware/auth.middleware'
import { wrapAsync } from '@utils/response'
import { bruteForceProtectionMiddleware } from '@middleware/security.middleware'
import { validate, loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '@schemas/index'

const commonAuthRouter = Router()

commonAuthRouter.post(
  '/login',
  bruteForceProtectionMiddleware, // Chống brute force - max 5 attempts per 15 minutes
  validate(loginSchema),
  wrapAsync(authController.loginController)
)

commonAuthRouter.post(
  '/logout',
  authMiddleware.verifyAccessToken,
  wrapAsync(authController.logoutController)
)

commonAuthRouter.post(
  '/register',
  validate(registerSchema),
  wrapAsync(authController.registerController)
)
commonAuthRouter.post(
  '/refresh-access-token',
  authMiddleware.verifyRefreshToken,
  wrapAsync(authController.refreshTokenController)
)

commonAuthRouter.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  wrapAsync(passwordResetController.forgotPassword)
)

commonAuthRouter.post(
  '/reset-password',
  validate(resetPasswordSchema),
  wrapAsync(passwordResetController.resetPassword)
)

export default commonAuthRouter
