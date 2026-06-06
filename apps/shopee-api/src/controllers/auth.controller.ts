import { ErrorHandler, responseSuccess, ValidationError, UnauthorizedError } from '@utils/response'
import { config } from '@constants/config'
import { Request, Response } from 'express'
import { STATUS } from '@constants/status'
import { Logger } from '@utils/logger'
import { recordFailedLogin, resetLoginAttempts } from '@middleware/security.middleware'
import { AUTH_MESSAGES } from '@constants/messages'
import { authService } from '../container'
import {
  ConflictError,
  ValidationError as ServiceValidationError,
  UnauthorizedError as ServiceUnauthorizedError,
} from '@services/base.service'
import { AuthResult } from '@services/auth.service'

/**
 * Lấy IP thực của client
 */
const getClientIP = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.ip || req.socket.remoteAddress || 'unknown'
}

const getExpire = () => {
  // Server-controlled token expiry — no client override allowed
  return {
    expireAccessTokenConfig: config.EXPIRE_ACCESS_TOKEN,
    expireRefreshTokenConfig: config.EXPIRE_REFRESH_TOKEN,
  }
}

const registerController = async (req: Request, res: Response) => {
  try {
    const { expireAccessTokenConfig, expireRefreshTokenConfig } = getExpire()
    const { email, password } = req.body

    const result = await authService.register(
      { email, password },
      { expireAccessToken: expireAccessTokenConfig, expireRefreshToken: expireRefreshTokenConfig },
    )

    const userId = result.user._id!.toString()

    // Create session record (fire-and-forget — don't block response on session creation)
    const { sessionService, auditLogService } = await import('../container')
    sessionService.createSession(userId, result.accessJti, result.refreshJti, req).catch((err) => {
      Logger.apiWarn('session.create.failed_on_register', { error: err?.message })
    })

    // Audit log: user.register (fire-and-forget)
    auditLogService.writeLog({
      action: 'user.register',
      resource: 'user',
      resourceId: userId,
      actor: { userId, roles: result.user.roles ?? [] },
      ip: getClientIP(req),
      userAgent: req.headers['user-agent'] || '',
      status: 'success',
    })

    const response = {
      message: AUTH_MESSAGES.REGISTER_SUCCESS,
      data: result,
    }
    return responseSuccess(res, response)
  } catch (error) {
    if (error instanceof ConflictError) {
      throw new ValidationError({ email: AUTH_MESSAGES.EMAIL_EXISTS })
    }
    throw error
  }
}

const loginController = async (req: Request, res: Response) => {
  try {
    const { expireAccessTokenConfig, expireRefreshTokenConfig } = getExpire()
    const { email, password } = req.body
    const clientIP = getClientIP(req)

    const result = await authService.login(
      { email, password },
      { expireAccessToken: expireAccessTokenConfig, expireRefreshToken: expireRefreshTokenConfig },
    )

    // 2FA required — return partial token, do NOT issue full tokens yet
    if ('requires2FA' in result) {
      return responseSuccess(res, {
        message: '2FA verification required',
        data: {
          requires2FA: true,
          partial_token: result.partial_token,
        },
      })
    }

    // TypeScript narrowing: after early return above, result is narrowed to AuthResult
    const authResult = result

    // Đăng nhập thành công - reset login attempts
    resetLoginAttempts(clientIP, email)

    const userId = authResult.user._id!.toString()

    // Create session record (fire-and-forget)
    const { sessionService, auditLogService, loginHistoryService } = await import('../container')
    sessionService
      .createSession(userId, authResult.accessJti, authResult.refreshJti, req)
      .catch((err) => {
        Logger.apiWarn('session.create.failed_on_login', { error: err?.message })
      })

    // Record successful login (fire-and-forget)
    loginHistoryService.recordAttempt(userId, req, 'success', 'password')

    // Audit log: user.login (fire-and-forget)
    auditLogService.writeLog({
      action: 'user.login',
      resource: 'user',
      resourceId: userId,
      actor: { userId, roles: authResult.user.roles ?? [] },
      ip: clientIP,
      userAgent: req.headers['user-agent'] || '',
      status: 'success',
    })

    Logger.apiInfo('Đăng nhập thành công', {
      ip: clientIP,
      email,
      userId,
    })

    const response = {
      message: AUTH_MESSAGES.LOGIN_SUCCESS,
      data: authResult,
    }
    return responseSuccess(res, response)
  } catch (error) {
    const clientIP = getClientIP(req)
    const { email } = req.body

    if (error instanceof ServiceValidationError) {
      recordFailedLogin(clientIP, email)
      Logger.apiWarn('Đăng nhập thất bại', { ip: clientIP, email })
      // Record failed login attempt (fire-and-forget)
      const { loginHistoryService, auditLogService } = await import('../container')
      loginHistoryService.recordAttempt(null, req, 'failed', 'password')
      // Audit log: user.login_failed (fire-and-forget)
      auditLogService.writeLog({
        action: 'user.login_failed',
        resource: 'user',
        resourceId: null,
        actor: { userId: 'anonymous', roles: [] },
        ip: clientIP,
        userAgent: req.headers['user-agent'] || '',
        status: 'failed',
        errorMessage: 'Invalid credentials',
      })
      throw new ValidationError({ password: AUTH_MESSAGES.INVALID_CREDENTIALS })
    }
    throw error
  }
}

const refreshTokenController = async (req: Request, res: Response) => {
  try {
    const { expireAccessTokenConfig, expireRefreshTokenConfig } = getExpire()
    const oldRefreshToken: string = req.body.refresh_token
    const decoded = req.jwtDecoded

    const result = await authService.refreshTokenWithRotation(
      decoded.id,
      oldRefreshToken,
      decoded.jti,
      {
        expireAccessToken: expireAccessTokenConfig,
        expireRefreshToken: expireRefreshTokenConfig,
      },
    )

    // Update session with new JTIs (fire-and-forget)
    if (decoded.jti) {
      const { sessionService } = await import('../container')
      sessionService
        .updateSessionOnRefresh(decoded.jti, result.accessJti, result.refreshJti)
        .catch((err) => {
          Logger.apiWarn('session.update.failed_on_refresh', { error: err?.message })
        })
    }

    const response = {
      message: AUTH_MESSAGES.REFRESH_TOKEN_SUCCESS,
      data: result,
    }
    return responseSuccess(res, response)
  } catch (error) {
    if (error instanceof ServiceUnauthorizedError) {
      throw new UnauthorizedError(AUTH_MESSAGES.REFRESH_TOKEN_NOT_EXISTS)
    }
    throw error
  }
}

const logoutController = async (req: Request, res: Response) => {
  const { refresh_token } = req.body
  if (refresh_token) {
    await authService.logout(refresh_token)
  }
  // Graceful handling: if no RT provided, AT will expire naturally (15 min)

  // Audit log: user.logout (fire-and-forget)
  const userId = req.jwtDecoded?.id || 'anonymous'
  const { auditLogService } = await import('../container')
  auditLogService.writeLog({
    action: 'user.logout',
    resource: 'user',
    resourceId: userId !== 'anonymous' ? userId : null,
    actor: { userId, roles: req.jwtDecoded?.roles ?? [] },
    ip: getClientIP(req),
    userAgent: req.headers['user-agent'] || '',
    status: 'success',
  })

  return responseSuccess(res, { message: AUTH_MESSAGES.LOGOUT_SUCCESS })
}

const googleLoginController = async (req: Request, res: Response) => {
  const { id_token } = req.body
  const clientIP = getClientIP(req)

  const { expireAccessTokenConfig, expireRefreshTokenConfig } = getExpire()

  const result = await authService.googleLogin(id_token, {
    expireAccessToken: expireAccessTokenConfig,
    expireRefreshToken: expireRefreshTokenConfig,
  })

  // 2FA required — return partial token, do NOT issue full tokens yet
  if ('requires2FA' in result) {
    return responseSuccess(res, {
      message: '2FA verification required',
      data: {
        requires2FA: true,
        partial_token: result.partial_token,
      },
    })
  }

  // TypeScript narrowing: after early return above, result is narrowed to AuthResult
  const authResult = result

  const userId = authResult.user._id!.toString()

  // Fire-and-forget side effects — matching loginController
  const { sessionService, auditLogService, loginHistoryService } = await import('../container')

  // Create session record (fire-and-forget)
  sessionService
    .createSession(userId, authResult.accessJti, authResult.refreshJti, req)
    .catch((err) => {
      Logger.apiWarn('session.create.failed_on_google_login', { error: err?.message })
    })

  // Record successful login (fire-and-forget)
  loginHistoryService.recordAttempt(userId, req, 'success', 'google')

  // Audit log: user.login (fire-and-forget)
  auditLogService.writeLog({
    action: 'user.login',
    resource: 'user',
    resourceId: userId,
    actor: { userId, roles: authResult.user.roles ?? [] },
    ip: clientIP,
    userAgent: req.headers['user-agent'] || '',
    status: 'success',
  })

  Logger.apiInfo('Google login thành công', { email: authResult.user.email })

  return responseSuccess(res, {
    message: AUTH_MESSAGES.GOOGLE_LOGIN_SUCCESS,
    data: authResult,
  })
}

const authController = {
  registerController,
  loginController,
  logoutController,
  refreshTokenController,
  googleLoginController,
}

export default authController
