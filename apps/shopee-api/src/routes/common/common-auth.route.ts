import authController from '@controllers/auth.controller'
import * as passwordResetController from '@controllers/password-reset.controller'
import sessionController from '@controllers/session.controller'
import totpController from '@controllers/totp.controller'
import authMiddleware from '@middleware/auth.middleware'
import { authRateLimit } from '@middleware/rateLimiter.middleware'
import { bruteForceProtectionMiddleware } from '@middleware/security.middleware'
import {
  forgotPasswordSchema,
  googleExchangeCodeSchema,
  googleLoginSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  validate,
} from '@schemas/index'
import {
  twoFactorBackupCodesSchema,
  twoFactorCompleteSchema,
  twoFactorDisableSchema,
  twoFactorVerifySetupSchema,
} from '@schemas/totp.schema'
import { asyncHandler } from '@utils/async-handler'
import { Router } from 'express'

const commonAuthRouter = Router()

commonAuthRouter.post(
  '/login',
  authRateLimit, // 15 req/min per IP+email (env: RATE_LIMIT_AUTH_MAX)
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
  authRateLimit, // 15 req/min per IP+email (env: RATE_LIMIT_AUTH_MAX)
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
  authRateLimit, // 15 req/min per IP+email (env: RATE_LIMIT_AUTH_MAX)
  bruteForceProtectionMiddleware, // Prevent password reset abuse
  validate(forgotPasswordSchema),
  asyncHandler(passwordResetController.forgotPassword),
)

commonAuthRouter.post(
  '/reset-password',
  authRateLimit, // 15 req/min per IP+email (env: RATE_LIMIT_AUTH_MAX)
  bruteForceProtectionMiddleware, // Prevent password reset abuse
  validate(resetPasswordSchema),
  asyncHandler(passwordResetController.resetPassword),
)

commonAuthRouter.post(
  '/google',
  authRateLimit,
  validate(googleLoginSchema),
  asyncHandler(authController.googleLoginController),
)

// ── Google OAuth server-side Authorization Code flow (web) ──────────────────
// Mobile POST /google is kept above, unchanged.

// Step 1: generate state, redirect to Google consent
commonAuthRouter.get(
  '/auth/google/url',
  authRateLimit,
  asyncHandler(authController.googleUrlController),
)

// Step 2: Google redirects here with ?code&state — no body validation needed
commonAuthRouter.get('/auth/google/callback', asyncHandler(authController.googleCallbackController))

// Step 3: SPA exchanges one-time `tmp` handle for AT/RT/user
commonAuthRouter.post(
  '/auth/google/exchange-code',
  authRateLimit,
  validate(googleExchangeCodeSchema),
  asyncHandler(authController.googleExchangeCodeController),
)

// ── 2FA routes ──────────────────────────────────────────────────────────────

commonAuthRouter.post(
  '/auth/2fa/setup',
  authMiddleware.verifyAccessToken,
  asyncHandler(totpController.setupTwoFactor),
)

commonAuthRouter.post(
  '/auth/2fa/verify-setup',
  authMiddleware.verifyAccessToken,
  validate(twoFactorVerifySetupSchema),
  asyncHandler(totpController.verifySetup),
)

commonAuthRouter.post(
  '/auth/2fa/disable',
  authMiddleware.verifyAccessToken,
  validate(twoFactorDisableSchema),
  asyncHandler(totpController.disableTwoFactor),
)

commonAuthRouter.post(
  '/auth/2fa/backup-codes',
  authMiddleware.verifyAccessToken,
  validate(twoFactorBackupCodesSchema),
  asyncHandler(totpController.regenerateBackupCodes),
)

commonAuthRouter.post(
  '/auth/2fa/complete',
  authRateLimit, // Protect against brute-force on partial tokens
  validate(twoFactorCompleteSchema),
  asyncHandler(totpController.completeTwoFactorLogin),
)

// ── Session management routes ────────────────────────────────────────────────

commonAuthRouter.get(
  '/sessions',
  authMiddleware.verifyAccessToken,
  asyncHandler(sessionController.listSessions),
)

commonAuthRouter.delete(
  '/sessions',
  authMiddleware.verifyAccessToken,
  asyncHandler(sessionController.revokeAllSessions),
)

commonAuthRouter.delete(
  '/sessions/:id',
  authMiddleware.verifyAccessToken,
  asyncHandler(sessionController.revokeSession),
)

// ── Login history route ──────────────────────────────────────────────────────

commonAuthRouter.get(
  '/login-history',
  authMiddleware.verifyAccessToken,
  asyncHandler(sessionController.getLoginHistory),
)

export default commonAuthRouter
