import { Request, Response } from 'express'
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { ValidationError, UnauthorizedError } from '@services/base.service'
import { config } from '@constants/config'

const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.ip || req.socket?.remoteAddress || 'unknown'
}

/**
 * POST /auth/2fa/setup
 * Initiates 2FA setup — returns QR code data URL, plaintext secret, and backup codes.
 * Requires authenticated user (verifyAccessToken middleware).
 */
export const setupTwoFactor = async (req: Request, res: Response) => {
  const { totpService } = await import('../container')
  const userId = req.jwtDecoded.id
  const result = await totpService.setupTwoFactor(userId)
  return responseSuccess(res, {
    message:
      '2FA setup initiated. Scan the QR code with your authenticator app, then call /auth/2fa/verify-setup to enable.',
    data: {
      secret: result.secret,
      qr_code: result.qrCodeDataUrl,
      backup_codes: result.backupCodes,
    },
  })
}

/**
 * POST /auth/2fa/verify-setup
 * Verifies a TOTP code during setup and enables 2FA.
 */
export const verifySetup = async (req: Request, res: Response) => {
  const { totpService } = await import('../container')
  const userId = req.jwtDecoded.id
  const { code } = req.body

  try {
    await totpService.verifySetup(userId, code)

    // Invalidate profile cache so GET /me reflects updated twoFactorEnabled
    const { userService } = await import('../container')
    userService.invalidateProfileCache(userId)

    // Audit log: user.2fa_enable (fire-and-forget)
    const { auditLogService } = await import('../container')
    auditLogService.writeLog({
      action: 'user.2fa_enable',
      resource: 'user',
      resourceId: userId,
      actor: { userId, roles: req.jwtDecoded.roles ?? [] },
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
      status: 'success',
    })

    return responseSuccess(res, { message: '2FA enabled successfully' })
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.UNPROCESSABLE_ENTITY, error.message)
    }
    throw error
  }
}

/**
 * POST /auth/2fa/disable
 * Disables 2FA after verifying a TOTP code or backup code.
 */
export const disableTwoFactor = async (req: Request, res: Response) => {
  const { totpService } = await import('../container')
  const userId = req.jwtDecoded.id
  const { code } = req.body

  try {
    await totpService.disableTwoFactor(userId, code)

    // Invalidate profile cache so GET /me reflects updated twoFactorEnabled
    const { userService } = await import('../container')
    userService.invalidateProfileCache(userId)

    // Audit log: user.2fa_disable (fire-and-forget)
    const { auditLogService } = await import('../container')
    auditLogService.writeLog({
      action: 'user.2fa_disable',
      resource: 'user',
      resourceId: userId,
      actor: { userId, roles: req.jwtDecoded.roles ?? [] },
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
      status: 'success',
    })

    return responseSuccess(res, { message: '2FA disabled successfully' })
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.UNPROCESSABLE_ENTITY, error.message)
    }
    throw error
  }
}

/**
 * POST /auth/2fa/backup-codes
 * Regenerates backup codes after verifying a TOTP code.
 */
export const regenerateBackupCodes = async (req: Request, res: Response) => {
  const { totpService } = await import('../container')
  const userId = req.jwtDecoded.id
  const { code } = req.body

  try {
    const backupCodes = await totpService.regenerateBackupCodes(userId, code)

    // Invalidate profile cache so GET /me reflects current state
    const { userService } = await import('../container')
    userService.invalidateProfileCache(userId)

    return responseSuccess(res, {
      message: 'Backup codes regenerated. Save these codes — they will not be shown again.',
      data: { backup_codes: backupCodes },
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.UNPROCESSABLE_ENTITY, error.message)
    }
    throw error
  }
}

/**
 * POST /auth/2fa/complete
 * Completes the 2FA login flow: verifies partial token + TOTP/backup code, issues full tokens.
 */
export const completeTwoFactorLogin = async (req: Request, res: Response) => {
  const { totpService, sessionService, loginHistoryService, authService } =
    await import('../container')
  const { partial_token, code } = req.body

  try {
    const result = await totpService.completeTwoFactorLogin(partial_token, code)

    // Persist refresh token via authRepository
    const expiresAt = new Date(Date.now() + config.EXPIRE_REFRESH_TOKEN * 1000)
    await authService.createRefreshTokenForSession(
      result.userId,
      result.refreshToken,
      result.refreshJti,
      expiresAt,
    )

    // Create session
    await sessionService.createSession(result.userId, result.accessJti, result.refreshJti, req)

    // Record login history (fire-and-forget)
    const method = result.usedBackupCode ? ('backup-code' as const) : ('2fa' as const)
    loginHistoryService.recordAttempt(result.userId, req, 'success', method)

    // Invalidate profile cache so GET /me reflects current twoFactorEnabled state
    const { userService } = await import('../container')
    userService.invalidateProfileCache(result.userId)

    return responseSuccess(res, {
      message: '2FA verification successful',
      data: {
        access_token: 'Bearer ' + result.accessToken,
        expires: config.EXPIRE_ACCESS_TOKEN,
        refresh_token: result.refreshToken,
        expires_refresh_token: config.EXPIRE_REFRESH_TOKEN,
      },
    })
  } catch (error) {
    // Record failed 2FA attempt (fire-and-forget)
    const { loginHistoryService } = await import('../container')
    loginHistoryService.recordAttempt(null, req, 'failed', '2fa')

    if (error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.UNPROCESSABLE_ENTITY, error.message)
    }
    if (error instanceof UnauthorizedError) {
      throw new ErrorHandler(STATUS.UNAUTHORIZED, error.message)
    }
    throw error
  }
}

const totpController = {
  setupTwoFactor,
  verifySetup,
  disableTwoFactor,
  regenerateBackupCodes,
  completeTwoFactorLogin,
}

export default totpController
