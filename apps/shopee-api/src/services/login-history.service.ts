import { Request } from 'express'
import { LoginStatus, LoginMethod } from '@database/models/login-history.model'
import { BaseService } from './base.service'
import { parseUserAgent } from '@utils/session.util'
import { getLocation, formatLocation } from '@utils/geoip.util'
import { Logger } from '@utils/logger'
import { ILoginHistoryRepository } from '@repositories/interfaces/login-history.repository.interface'
import { Types } from 'mongoose'

const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.ip || req.socket?.remoteAddress || 'unknown'
}

export interface LoginHistoryEntry {
  id: string
  ip: string
  device: string
  location: string
  status: LoginStatus
  method: LoginMethod
  timestamp: Date
}

export class LoginHistoryService extends BaseService {
  constructor(private readonly loginHistoryRepository: ILoginHistoryRepository) {
    super()
  }

  /**
   * Record a login attempt. Fire-and-forget — never throws.
   * userId is null for blocked/failed attempts where the user cannot be identified.
   */
  recordAttempt(
    userId: string | null,
    req: Request,
    status: LoginStatus,
    method: LoginMethod,
  ): void {
    // Intentionally not awaited — fire-and-forget
    this._writeRecord(userId, req, status, method).catch((err) => {
      Logger.apiWarn('login_history.write.failed', { error: err?.message })
    })
  }

  private async _writeRecord(
    userId: string | null,
    req: Request,
    status: LoginStatus,
    method: LoginMethod,
  ): Promise<void> {
    const ip = getClientIp(req)
    const ua = req.headers?.['user-agent'] || ''
    const parsed = parseUserAgent(ua)
    const device = `${parsed.browser} on ${parsed.os} (${parsed.device})`
    const location = formatLocation(getLocation(ip))

    await this.loginHistoryRepository.create({
      user_id: userId ? new Types.ObjectId(userId) : null,
      ip,
      userAgent: ua,
      device,
      location,
      status,
      method,
      timestamp: new Date(),
    })
  }

  /**
   * Get paginated login history for a user.
   * Optionally filter by status.
   */
  async getHistory(
    userId: string,
    options: { page: number; limit: number; status?: string },
  ): Promise<{ entries: LoginHistoryEntry[]; total: number }> {
    const { entries, total } = await this.loginHistoryRepository.findByUserId(
      new Types.ObjectId(userId),
      {
        page: options.page,
        limit: options.limit,
        status: options.status as LoginStatus | undefined,
      },
    )

    return {
      entries: entries.map((d) => ({
        id: d._id!.toString(),
        ip: d.ip,
        device: d.device,
        location: d.location,
        status: d.status,
        method: d.method,
        timestamp: d.timestamp,
      })),
      total,
    }
  }
}
