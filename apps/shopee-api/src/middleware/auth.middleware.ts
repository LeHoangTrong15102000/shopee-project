import { config } from '@constants/config'
import { verifyToken } from '@utils/jwt'
import { NextFunction, Request, Response } from 'express'
import { ROLE } from '@constants/role.enum'
import { responseError, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { RefreshTokenModel } from '@database/models/refresh-token.model'
import { UserModel } from '@database/models/user.model'
import { Logger } from '@utils/logger'

// Local type definitions
interface PayloadToken {
  id: string
  email: string
  roles: string[]
  created_at: string
  /** JWT ID — for reuse detection */
  jti?: string
  /** Token scope — "2fa_pending" for partial tokens issued mid-login when 2FA is required */
  scope?: string
}

const verifyAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const access_token = req.headers.authorization?.replace('Bearer ', '')
  if (access_token) {
    try {
      const decoded = (await verifyToken(access_token, config.SECRET_KEY)) as PayloadToken
      // Reject partial tokens — they are only valid for /auth/2fa/complete
      if (decoded.scope === '2fa_pending') {
        responseError(
          res,
          new ErrorHandler(
            STATUS.UNAUTHORIZED,
            'Partial token cannot be used to access protected routes',
          ),
        )
        return
      }
      req.jwtDecoded = decoded
      // Pure JWT verification — no database lookup needed
      return next()
    } catch (error) {
      responseError(res, error as ErrorHandler | Error)
      return
    }
  }
  responseError(res, new ErrorHandler(STATUS.UNAUTHORIZED, 'Token không được gửi'))
}

const verifyRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const refresh_token = req.body.refresh_token
  if (refresh_token) {
    try {
      const decoded = (await verifyToken(refresh_token, config.SECRET_KEY)) as PayloadToken
      req.jwtDecoded = decoded

      // New flow: validate by jti in DB (rotation-aware)
      if (decoded.jti) {
        const refreshTokenDB = await RefreshTokenModel.findOne({
          jti: decoded.jti,
          revokedAt: null,
        }).exec()

        if (refreshTokenDB) {
          return next()
        }
        responseError(
          res,
          new ErrorHandler(STATUS.UNAUTHORIZED, 'Refresh token đã hết hạn hoặc bị thu hồi'),
        )
        return
      }

      // Legacy flow: validate by token string (backward compatible)
      const refreshTokenDB = await RefreshTokenModel.findOne({
        token: refresh_token,
      }).exec()

      if (refreshTokenDB) {
        return next()
      }
      responseError(res, new ErrorHandler(STATUS.UNAUTHORIZED, 'Không tồn tại token'))
      return
    } catch (error) {
      responseError(res, error as ErrorHandler | Error)
      return
    }
  }
  responseError(res, new ErrorHandler(STATUS.UNAUTHORIZED, 'Token không được gửi'))
}

const verifyAccessTokenOptional = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const access_token = req.headers.authorization?.replace('Bearer ', '')
  if (access_token) {
    try {
      const decoded = (await verifyToken(access_token, config.SECRET_KEY)) as PayloadToken
      req.jwtDecoded = decoded
      // Pure JWT verification — no database lookup needed
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

/**
 * Verify admin access.
 *
 * Happy path: roles are embedded in JWT — no DB call required.
 * Legacy path: token has no roles → fall back to DB lookup (backward compatible) + warn.
 * Opt-in re-verify: route metadata REQUIRE_FRESH_ROLE_CHECK → always DB lookup.
 */
const verifyAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const decoded = req.jwtDecoded
  const requireFreshCheck = (req as any).requireFreshRoleCheck === true

  // Happy path: roles in JWT and no forced fresh check required
  if (!requireFreshCheck && decoded.roles && decoded.roles.length > 0) {
    if (decoded.roles.includes(ROLE.ADMIN)) {
      // No DB call needed — trust the JWT claim
      return next()
    }
    responseError(res, new ErrorHandler(STATUS.FORBIDDEN, 'Không có quyền truy cập'))
    return
  }

  // Legacy / forced-fresh path: DB lookup
  Logger.apiWarn('auth.admin.db_fallback', {
    userId: decoded.id,
    jti: decoded.jti,
    reason: requireFreshCheck ? 'REQUIRE_FRESH_ROLE_CHECK' : 'legacy token (no roles in JWT)',
  })

  const userDB: any = await UserModel.findById(decoded.id).lean()
  if (userDB && userDB.roles.includes(ROLE.ADMIN)) {
    return next()
  }
  responseError(res, new ErrorHandler(STATUS.FORBIDDEN, 'Không có quyền truy cập'))
}

const authMiddleware = {
  verifyAccessToken,
  verifyAccessTokenOptional,
  verifyAdmin,
  verifyRefreshToken,
  /**
   * Route-level middleware: flags the request as requiring a fresh DB role check
   * even when the JWT already contains roles.
   *
   * Use on endpoints that are sensitive to role changes (e.g. role-assignment endpoints).
   * Apply BEFORE verifyAdmin in the middleware chain.
   *
   * Example usage in a route:
   *   router.patch('/users/:id/role',
   *     authMiddleware.verifyAccessToken,
   *     authMiddleware.requireFreshRoleCheck,
   *     authMiddleware.verifyAdmin,
   *     handler)
   */
  requireFreshRoleCheck: (req: Request, _res: Response, next: NextFunction): void => {
    ;(req as any).requireFreshRoleCheck = true
    next()
  },
}

export default authMiddleware
