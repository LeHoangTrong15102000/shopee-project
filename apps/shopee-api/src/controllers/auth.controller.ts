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
import { AuthResult, TwoFactorRequiredResult } from '@services/auth.service'
import { redisClient } from '@utils/redis.client'
import type Redis from 'ioredis'
import crypto from 'crypto'

/**
 * Atomically GET then DELETE a Redis key, returning the string value or null.
 *
 * Uses the native `getdel` command when available (ioredis >= 5 / Redis >= 6.2).
 * Falls back to a MULTI/EXEC pipeline on older clients.  In the pipeline path
 * the per-command error slot (results[0][0]) is checked so a Redis-level error
 * on the GET does not silently return null instead of propagating.
 */
async function atomicGetDel(client: Redis, key: string): Promise<string | null> {
  if (typeof (client as unknown as Record<string, unknown>).getdel === 'function') {
    return (client as unknown as { getdel(key: string): Promise<string | null> }).getdel(key)
  }
  const pipeline = client.multi()
  pipeline.get(key)
  pipeline.del(key)
  const results = await pipeline.exec()
  return results && results[0] && results[0][0] === null ? (results[0][1] as string | null) : null
}

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

// ── Google OAuth server-side Authorization Code flow ─────────────────────────

/**
 * GET /auth/google/url
 *
 * Generate a CSRF state, store it in Redis (~300s TTL), build the Google
 * consent URL, and 302-redirect the browser to Google.
 *
 * Redis null-guard: if Redis is unavailable the server cannot safely store
 * state, so we respond with a 503 instead of redirecting without CSRF protection.
 */
const googleUrlController = async (req: Request, res: Response) => {
  if (redisClient === null) {
    Logger.apiWarn('auth.google.url.redis_unavailable')
    res.status(503).json({
      message: 'Google Sign-In is temporarily unavailable (Redis required)',
    })
    return
  }

  const { OAuth2Client } = await import('google-auth-library')
  const oAuth2Client = new OAuth2Client(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    config.GOOGLE_REDIRECT_URI,
  )

  const state = crypto.randomBytes(32).toString('hex')

  // Store state with ~300s TTL (5 minutes) — single use
  await redisClient.set(`google:state:${state}`, '1', 'EX', 300)

  const authorizeUrl = oAuth2Client.generateAuthUrl({
    scope: ['openid', 'email', 'profile'],
    state,
    access_type: 'offline',
  })

  res.redirect(302, authorizeUrl)
}

/**
 * GET /auth/google/callback
 *
 * Google redirects here with ?code=&state=.
 * 1. Verify + delete state (CSRF protection, one-time use).
 * 2. Exchange code → id_token server-side via googleAuthCodeExchange.
 * 3. Store AuthResult under a one-time opaque `tmp` key (~60s TTL).
 * 4. Redirect to GOOGLE_CLIENT_REDIRECT_URI?tmp=... (or ?error=... on failure).
 *
 * Side effects (session/loginHistory/auditLog) are NOT fired here — they fire
 * at /exchange-code when the real SPA client completes the login.
 */
const googleCallbackController = async (req: Request, res: Response) => {
  const clientRedirectUri = config.GOOGLE_CLIENT_REDIRECT_URI
  const errorRedirect = (reason: string) =>
    res.redirect(302, `${clientRedirectUri}?error=${encodeURIComponent(reason)}`)

  if (redisClient === null) {
    Logger.apiWarn('auth.google.callback.redis_unavailable')
    return errorRedirect('service_unavailable')
  }

  const { code, state } = req.query as { code?: string; state?: string }

  if (!code || !state) {
    return errorRedirect('missing_params')
  }

  // Verify + delete state atomically (one-time CSRF token)
  const stateKey = `google:state:${state}`
  let stateValue: string | null
  try {
    stateValue = await atomicGetDel(redisClient, stateKey)
  } catch (err) {
    Logger.apiError('auth.google.callback.state_check_failed', {
      message: err instanceof Error ? err.message : String(err),
    })
    return errorRedirect('state_error')
  }

  if (!stateValue) {
    // State not found, expired, or already consumed — CSRF / replay
    Logger.apiWarn('auth.google.callback.invalid_state', { state })
    return errorRedirect('invalid_state')
  }

  // Exchange code → AuthResult | TwoFactorRequiredResult
  let exchangeResult
  const { expireAccessTokenConfig, expireRefreshTokenConfig } = getExpire()
  try {
    exchangeResult = await authService.googleAuthCodeExchange(code, {
      expireAccessToken: expireAccessTokenConfig,
      expireRefreshToken: expireRefreshTokenConfig,
    })
  } catch (err) {
    Logger.apiWarn('auth.google.callback.exchange_failed', {
      message: err instanceof Error ? err.message : String(err),
    })
    return errorRedirect('exchange_failed')
  }

  // Generate opaque one-time handle and store result (~60s TTL)
  const tmp = crypto.randomBytes(32).toString('hex')
  try {
    await redisClient.set(`google:tmp:${tmp}`, JSON.stringify(exchangeResult), 'EX', 60)
  } catch (err) {
    Logger.apiError('auth.google.callback.tmp_store_failed', {
      message: err instanceof Error ? err.message : String(err),
    })
    return errorRedirect('store_failed')
  }

  res.redirect(302, `${clientRedirectUri}?tmp=${encodeURIComponent(tmp)}`)
}

/**
 * POST /auth/google/exchange-code
 *
 * The SPA sends { tmp } (the opaque handle from the redirect URL).
 * 1. Atomically GETDEL google:tmp:<tmp> (single-use).
 * 2. 401 when missing/expired/already redeemed.
 * 3. Handle requires2FA result (return partial_token, no side effects).
 * 4. On AuthResult: fire-and-forget side effects + return AT/RT/user.
 */
const googleExchangeCodeController = async (req: Request, res: Response) => {
  if (redisClient === null) {
    Logger.apiWarn('auth.google.exchange_code.redis_unavailable')
    res.status(503).json({
      message: 'Google Sign-In is temporarily unavailable (Redis required)',
    })
    return
  }

  const { tmp } = req.body as { tmp: string }
  const tmpKey = `google:tmp:${tmp}`

  // Atomically read + delete so the handle can be used exactly once
  let rawResult: string | null
  try {
    rawResult = await atomicGetDel(redisClient, tmpKey)
  } catch (err) {
    Logger.apiError('auth.google.exchange_code.redis_error', {
      message: err instanceof Error ? err.message : String(err),
    })
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal error' })
    return
  }

  if (!rawResult) {
    // Missing, expired past 60s, or already redeemed — single-use enforced
    res.status(STATUS.UNAUTHORIZED).json({ message: 'Invalid or expired token handle' })
    return
  }

  let result: AuthResult | TwoFactorRequiredResult
  try {
    result = JSON.parse(rawResult) as AuthResult | TwoFactorRequiredResult
  } catch {
    res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Internal error' })
    return
  }

  // 2FA case — return partial_token; do NOT fire session/loginHistory/auditLog
  if ('requires2FA' in result) {
    return responseSuccess(res, {
      message: '2FA verification required',
      data: {
        requires2FA: true,
        partial_token: result.partial_token,
      },
    })
  }

  // Full AuthResult — fire-and-forget side effects (matching googleLoginController)
  const authResult = result
  const userId = authResult.user._id!.toString()
  const clientIP = getClientIP(req)

  const { sessionService, auditLogService, loginHistoryService } = await import('../container')

  sessionService
    .createSession(userId, authResult.accessJti, authResult.refreshJti, req)
    .catch((err: unknown) => {
      Logger.apiWarn('session.create.failed_on_google_web_login', {
        error: err instanceof Error ? err.message : String(err),
      })
    })

  loginHistoryService.recordAttempt(userId, req, 'success', 'google')

  auditLogService.writeLog({
    action: 'user.login',
    resource: 'user',
    resourceId: userId,
    actor: { userId, roles: authResult.user.roles ?? [] },
    ip: clientIP,
    userAgent: req.headers['user-agent'] || '',
    status: 'success',
  })

  Logger.apiInfo('Google web login thành công', { email: authResult.user.email })

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
  googleUrlController,
  googleCallbackController,
  googleExchangeCodeController,
}

export default authController
