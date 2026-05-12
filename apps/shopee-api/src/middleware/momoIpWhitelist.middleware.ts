/**
 * MoMo IPN IP Whitelist Middleware
 *
 * Reads MOMO_WHITELIST_IPS env var (comma-separated).
 * Default whitelist: 118.69.210.244, 116.103.110.134 (MoMo production IPs).
 *
 * In production (NODE_ENV === 'production'):
 *   - Checks req.ip first, then the first IP in X-Forwarded-For.
 *   - Rejects non-whitelisted IPs with HTTP 403 and logs a warning.
 *
 * In non-production environments:
 *   - Skips the check entirely (allows all IPs).
 *
 * Apply ONLY to POST /payment/momo/ipn — do NOT apply to VNPay IPN.
 */

import { Request, Response, NextFunction } from 'express'
import { Logger } from '@utils/logger'

const DEFAULT_WHITELIST = ['118.69.210.244', '116.103.110.134']

function getWhitelist(): string[] {
  const envVal = process.env.MOMO_WHITELIST_IPS
  if (!envVal || envVal.trim() === '') return DEFAULT_WHITELIST
  return envVal
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean)
}

const LOOPBACK_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

function extractClientIp(req: Request): string | null {
  // If req.ip is absent or a loopback address, check X-Forwarded-For first
  if (req.ip && !LOOPBACK_IPS.has(req.ip)) return req.ip

  // Fall back to first IP in X-Forwarded-For
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]
    return first.trim()
  }

  // Return req.ip even if loopback when no X-Forwarded-For is present
  return req.ip || null
}

export function momoIpWhitelist(req: Request, res: Response, next: NextFunction): void {
  // Skip check in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    return next()
  }

  const whitelist = getWhitelist()
  const clientIp = extractClientIp(req)

  if (clientIp && whitelist.includes(clientIp)) {
    return next()
  }

  Logger.apiWarn('[MoMo IPN] Request rejected — IP not in whitelist', {
    clientIp: clientIp || 'unknown',
    whitelist,
    path: req.path,
    method: req.method,
  })

  res.status(403).json({ success: false, message: 'Forbidden: IP not whitelisted' })
}
