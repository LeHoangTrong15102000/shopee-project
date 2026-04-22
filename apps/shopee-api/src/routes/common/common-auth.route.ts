import { Router } from 'express'
import authController from '@controllers/auth.controller'
import * as passwordResetController from '@controllers/password-reset.controller'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { bruteForceProtectionMiddleware } from '@middleware/security.middleware'
import {
  validate,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@schemas/index'

const commonAuthRouter = Router()

commonAuthRouter.post(
  '/login',
  bruteForceProtectionMiddleware, // Chống brute force - max 5 attempts per 15 minutes
  validate(loginSchema),
  asyncHandler(authController.loginController),
)

commonAuthRouter.post(
  '/logout',
  authMiddleware.verifyAccessToken,
  asyncHandler(authController.logoutController),
)

commonAuthRouter.post(
  '/register',
  bruteForceProtectionMiddleware, // Prevent registration spam and abuse
  validate(registerSchema),
  asyncHandler(authController.registerController),
)
commonAuthRouter.post(
  '/refresh-access-token',
  bruteForceProtectionMiddleware, // Prevent token refresh abuse
  authMiddleware.verifyRefreshToken,
  asyncHandler(authController.refreshTokenController),
)

commonAuthRouter.post(
  '/forgot-password',
  bruteForceProtectionMiddleware, // Prevent password reset abuse
  validate(forgotPasswordSchema),
  asyncHandler(passwordResetController.forgotPassword),
)

commonAuthRouter.post(
  '/reset-password',
  bruteForceProtectionMiddleware, // Prevent password reset abuse
  validate(resetPasswordSchema),
  asyncHandler(passwordResetController.resetPassword),
)

export default commonAuthRouter
