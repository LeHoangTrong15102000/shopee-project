import { config } from '@constants/config'
import { verifyToken } from '@utils/jwt'
import { NextFunction, Request, Response } from 'express'
import { ROLE } from '@constants/role.enum'
import { responseError, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { AccessTokenModel } from '@database/models/access-token.model'
import { RefreshTokenModel } from '@database/models/refresh-token.model'
import { UserModel } from '@database/models/user.model'

// Local type definitions
interface PayloadToken {
  id: string
  email: string
  roles: string[]
  created_at: string
}

const verifyAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const access_token = req.headers.authorization?.replace('Bearer ', '')
  if (access_token) {
    try {
      const decoded = (await verifyToken(
        access_token,
        config.SECRET_KEY
      )) as PayloadToken
      req.jwtDecoded = decoded
      const accessTokenDB = await AccessTokenModel.findOne({
        token: access_token,
      }).exec()

      if (accessTokenDB) {
        return next()
      }
      responseError(
        res,
        new ErrorHandler(STATUS.UNAUTHORIZED, 'Không tồn tại token')
      )
      return
    } catch (error) {
      responseError(res, error as ErrorHandler | Error)
      return
    }
  }
  responseError(
    res,
    new ErrorHandler(STATUS.UNAUTHORIZED, 'Token không được gửi')
  )
}

const verifyRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const refresh_token = req.body.refresh_token
  if (refresh_token) {
    try {
      const decoded = (await verifyToken(
        refresh_token,
        config.SECRET_KEY
      )) as PayloadToken
      req.jwtDecoded = decoded
      const refreshTokenDB = await RefreshTokenModel.findOne({
        token: refresh_token,
      }).exec()

      if (refreshTokenDB) {
        return next()
      }
      responseError(
        res,
        new ErrorHandler(STATUS.UNAUTHORIZED, 'Không tồn tại token')
      )
      return
    } catch (error) {
      responseError(res, error as ErrorHandler | Error)
      return
    }
  }
  responseError(
    res,
    new ErrorHandler(STATUS.UNAUTHORIZED, 'Token không được gửi')
  )
}

const verifyAccessTokenOptional = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const access_token = req.headers.authorization?.replace('Bearer ', '')
  if (access_token) {
    try {
      const decoded = (await verifyToken(
        access_token,
        config.SECRET_KEY
      )) as PayloadToken
      req.jwtDecoded = decoded
      const accessTokenDB = await AccessTokenModel.findOne({
        token: access_token,
      }).exec()

      if (accessTokenDB) {
        return next()
      }
      // Nếu token invalid, vẫn tiếp tục nhưng không set jwtDecoded
      req.jwtDecoded = undefined as unknown as PayloadToken
      return next()
    } catch {
      // Nếu có lỗi, vẫn tiếp tục nhưng không set jwtDecoded
      req.jwtDecoded = undefined as unknown as PayloadToken
      return next()
    }
  }
  // Nếu không có token, vẫn tiếp tục
  req.jwtDecoded = undefined as unknown as PayloadToken
  return next()
}

const verifyAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userDB: any = await UserModel.findById(req.jwtDecoded.id).lean()
  if (userDB && userDB.roles.includes(ROLE.ADMIN)) {
    return next()
  }
  responseError(
    res,
    new ErrorHandler(STATUS.FORBIDDEN, 'Không có quyền truy cập')
  )
}

const authMiddleware = {
  verifyAccessToken,
  verifyAccessTokenOptional,
  verifyAdmin,
  verifyRefreshToken,
}

export default authMiddleware
