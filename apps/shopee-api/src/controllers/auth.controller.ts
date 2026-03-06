import { ErrorHandler, responseSuccess, ValidationError, UnauthorizedError } from '@utils/response'
import { config } from '@constants/config'
import { Request, Response } from 'express'
import { STATUS } from '@constants/status'
import { Logger } from '@utils/logger'
import {
  recordFailedLogin,
  resetLoginAttempts,
} from '@middleware/security.middleware'
import { AUTH_MESSAGES } from '@constants/messages'
import { authService } from '../container'
import { ConflictError, ValidationError as ServiceValidationError, UnauthorizedError as ServiceUnauthorizedError } from '@services/base.service'

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

const getExpire = (req: Request) => {
  let expireAccessTokenConfig = Number(req.headers['expire-access-token'])
  expireAccessTokenConfig = Number.isInteger(expireAccessTokenConfig)
    ? expireAccessTokenConfig
    : config.EXPIRE_ACCESS_TOKEN
  let expireRefreshTokenConfig = Number(req.headers['expire-refresh-token'])
  expireRefreshTokenConfig = Number.isInteger(expireRefreshTokenConfig)
    ? expireRefreshTokenConfig
    : config.EXPIRE_REFRESH_TOKEN
  return {
    expireAccessTokenConfig,
    expireRefreshTokenConfig,
  }
}

const registerController = async (req: Request, res: Response) => {
  try {
    const { expireAccessTokenConfig, expireRefreshTokenConfig } = getExpire(req)
    const { email, password } = req.body

    const result = await authService.register(
      { email, password },
      { expireAccessToken: expireAccessTokenConfig, expireRefreshToken: expireRefreshTokenConfig }
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
    const { expireAccessTokenConfig, expireRefreshTokenConfig } = getExpire(req)
    const { email, password } = req.body
    const clientIP = getClientIP(req)

    const result = await authService.login(
      { email, password },
      { expireAccessToken: expireAccessTokenConfig, expireRefreshToken: expireRefreshTokenConfig }
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
    const { expireAccessTokenConfig } = getExpire(req)
    const result = await authService.refreshToken(req.jwtDecoded.id, expireAccessTokenConfig)

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
  const access_token = req.headers.authorization?.replace('Bearer ', '') || ''
  await authService.logout(access_token)
  return responseSuccess(res, { message: AUTH_MESSAGES.LOGOUT_SUCCESS })
}

const authController = {
  registerController,
  loginController,
  logoutController,
  refreshTokenController,
}

export default authController
