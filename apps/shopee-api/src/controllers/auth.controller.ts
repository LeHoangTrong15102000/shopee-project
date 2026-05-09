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

    // Đăng nhập thành công - reset login attempts
    resetLoginAttempts(clientIP, email)

    Logger.apiInfo('Đăng nhập thành công', {
      ip: clientIP,
      email,
      userId: result.user._id?.toString(),
    })

    const response = {
      message: AUTH_MESSAGES.LOGIN_SUCCESS,
      data: result,
    }
    return responseSuccess(res, response)
  } catch (error) {
    const clientIP = getClientIP(req)
    const { email } = req.body

    if (error instanceof ServiceValidationError) {
      recordFailedLogin(clientIP, email)
      Logger.apiWarn('Đăng nhập thất bại', { ip: clientIP, email })
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
  return responseSuccess(res, { message: AUTH_MESSAGES.LOGOUT_SUCCESS })
}

const googleLoginController = async (req: Request, res: Response) => {
  const { id_token } = req.body

  const { expireAccessTokenConfig, expireRefreshTokenConfig } = getExpire()

  const result = await authService.googleLogin(id_token, {
    expireAccessToken: expireAccessTokenConfig,
    expireRefreshToken: expireRefreshTokenConfig,
  })

  Logger.apiInfo('Google login thành công', { email: result.user.email })

  return responseSuccess(res, {
    message: AUTH_MESSAGES.GOOGLE_LOGIN_SUCCESS,
    data: result,
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
