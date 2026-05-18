import { Request } from 'express'
import { Types } from 'mongoose'
import { ISession } from '@database/models/session.model'
import { RefreshTokenModel } from '@database/models/refresh-token.model'
import { BaseService, NotFoundError, ForbiddenError } from './base.service'
import { hashJti, parseUserAgent } from '@utils/session.util'
import { getLocation, formatLocation } from '@utils/geoip.util'
import { config } from '@constants/config'
import { Logger } from '@utils/logger'
import { ISessionRepository } from '@repositories/interfaces/session.repository.interface'

export interface SessionView {
  id: string
  device: string
  ip: string
  location: string
  lastActive: Date
  createdAt?: Date
  isCurrent: boolean
}

/**
 * Extract the real client IP from an Express request.
 */
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.ip || req.socket?.remoteAddress || 'unknown'
}

export class SessionService extends BaseService {
  constructor(private readonly sessionRepository: ISessionRepository) {
    super()
  }

  /**
   * Create a new session record after a successful login or token issue.
   * Called by loginController, registerController, and completeTwoFactorLogin.
   */
  async createSession(
    userId: string,
    accessJti: string,
    refreshJti: string,
    req: Request,
  ): Promise<ISession> {
    const ip = getClientIp(req)
    const ua = req.headers['user-agent'] || ''
    const parsed = parseUserAgent(ua)
    const device = `${parsed.browser} on ${parsed.os} (${parsed.device})`
    const location = formatLocation(getLocation(ip))
    const refreshTokenHash = hashJti(refreshJti)
    const expiresAt = new Date(Date.now() + config.EXPIRE_REFRESH_TOKEN * 1000)

    const session = await this.sessionRepository.create({
      user_id: new Types.ObjectId(userId),
      refreshTokenHash,
      accessJti,
      refreshJti,
      device,
      ip,
      location,
      lastActive: new Date(),
      expiresAt,
      isRevoked: false,
    })

    Logger.apiInfo('session.created', { userId, sessionId: session._id?.toString() })
    return session
  }

  /**
   * Update session metadata after a token refresh.
   * Replaces the old JTIs with the new ones and refreshes lastActive + expiresAt.
   */
  async updateSessionOnRefresh(
    oldRefreshJti: string,
    newAccessJti: string,
    newRefreshJti: string,
  ): Promise<void> {
    const oldHash = hashJti(oldRefreshJti)
    const newHash = hashJti(newRefreshJti)
    const expiresAt = new Date(Date.now() + config.EXPIRE_REFRESH_TOKEN * 1000)

    await this.sessionRepository.updateByRefreshTokenHash(oldHash, {
      refreshTokenHash: newHash,
      accessJti: newAccessJti,
      refreshJti: newRefreshJti,
      lastActive: new Date(),
      expiresAt,
    })
  }

  /**
   * List active (non-revoked, non-expired) sessions for a user.
   * Marks the session whose accessJti matches currentAccessJti as isCurrent.
   */
  async listActiveSessions(
    userId: string,
    currentAccessJti: string | undefined,
    page: number,
    limit: number,
  ): Promise<{ sessions: SessionView[]; total: number }> {
    const { sessions, total } = await this.sessionRepository.findActiveByUserIdPaginated(
      new Types.ObjectId(userId),
      page,
      limit,
    )

    return {
      sessions: sessions.map((s) => ({
        id: s._id!.toString(),
        device: s.device,
        ip: s.ip,
        location: s.location,
        lastActive: s.lastActive,
        createdAt: s.createdAt,
        isCurrent: !!currentAccessJti && s.accessJti === currentAccessJti,
      })),
      total,
    }
  }

  /**
   * Revoke a single session by ID.
   * Also deletes the corresponding RefreshToken document.
   * Throws NotFoundError if the session doesn't belong to the user.
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    if (!Types.ObjectId.isValid(sessionId)) {
      throw new NotFoundError('Session', sessionId)
    }

    const session = await this.sessionRepository.findByIdAndUserId(
      sessionId,
      new Types.ObjectId(userId),
    )

    if (!session) {
      throw new NotFoundError('Session', sessionId)
    }

    // Mark session as revoked
    await this.sessionRepository.revokeById(sessionId)

    // Delete the corresponding RefreshToken document by refreshJti
    await RefreshTokenModel.findOneAndDelete({ jti: session.refreshJti })

    Logger.apiInfo('session.revoked', { userId, sessionId })
  }

  /**
   * Revoke all sessions for a user EXCEPT the current one.
   * Deletes the corresponding RefreshToken documents for all revoked sessions.
   *
   * currentAccessJti is the JTI from req.jwtDecoded.jti — identifies the current session
   * via Session.accessJti.
   */
  async revokeAllSessions(userId: string, currentAccessJti: string | undefined): Promise<number> {
    // Find all active sessions for this user
    const allSessions = await this.sessionRepository.findByUserId(
      new Types.ObjectId(userId),
      false, // isRevoked = false
    )

    // Separate current session from others
    const sessionsToRevoke = allSessions.filter(
      (s) => !currentAccessJti || s.accessJti !== currentAccessJti,
    )

    if (sessionsToRevoke.length === 0) {
      return 0
    }

    const sessionIds = sessionsToRevoke.map((s) => s._id!)
    const refreshJtis = sessionsToRevoke.map((s) => s.refreshJti)

    // Revoke sessions
    await this.sessionRepository.revokeManyByIds(sessionIds)

    // Delete corresponding RefreshToken documents (do NOT use deleteAllUserTokens — that kills current session too)
    await RefreshTokenModel.deleteMany({ jti: { $in: refreshJtis } })

    Logger.apiInfo('session.revoke_all', { userId, revokedCount: sessionsToRevoke.length })
    return sessionsToRevoke.length
  }
}
