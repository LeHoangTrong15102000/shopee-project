import { Router, Request, Response, NextFunction } from 'express'
import express from 'express'
import { asyncHandler } from '@utils/async-handler'
import { momoIpn, vnpayIpn } from '@controllers/ipn.controller'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { RateLimiterRedis } from 'rate-limiter-flexible'
import { redisClient } from '@utils/redis.client'
import { momoIpWhitelist } from '@middleware/momoIpWhitelist.middleware'

const ipnRouter = Router()

// IPN rate limiter: max 100 req/min per IP
const ipnLimiter = (() => {
  const points = 100
  const duration = 60
  if (redisClient) {
    return new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:ipn',
      points,
      duration,
      insuranceLimiter: new RateLimiterMemory({ points, duration }),
    })
  }
  return new RateLimiterMemory({ keyPrefix: 'rl:ipn', points, duration })
})()

function ipnRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || (req as any).connection?.remoteAddress || 'anonymous'
  ipnLimiter
    .consume(ip)
    .then(() => next())
    .catch(() => {
      res.status(429).json({ success: false, message: 'Too many IPN requests' })
    })
}

/**
 * Error handler for body-parser 413 (payload too large) on MoMo IPN.
 * MoMo spec: respond with HTTP 204 on oversized payloads.
 */
function momoPayloadErrorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  if (err.status === 413 || err.type === 'entity.too.large') {
    res.status(204).end()
    return
  }
  next(err)
}

/**
 * Error handler for body-parser 413 (payload too large) on VNPay IPN.
 * VNPay spec: respond with HTTP 200 + RspCode "99" on oversized payloads.
 */
function vnpayPayloadErrorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  if (err.status === 413 || err.type === 'entity.too.large') {
    res.status(200).json({ RspCode: '99', Message: 'Payload too large' })
    return
  }
  next(err)
}

/**
 * IPN routes — NO JWT auth.
 * Signature verification inside the controller is the auth mechanism.
 *
 * POST /payment/momo/ipn  — MoMo IPN (JSON body)
 * GET  /payment/vnpay/ipn — VNPay IPN (query params)
 */
ipnRouter.post(
  '/momo/ipn',
  ipnRateLimit,
  momoIpWhitelist,
  express.json({ limit: '1mb' }),
  momoPayloadErrorHandler,
  asyncHandler(momoIpn),
)

// VNPay IPN uses GET with query params — no JSON body to size-limit.
// The vnpayPayloadErrorHandler is registered for completeness but will not
// trigger on GET requests since body-parser does not run on them.
ipnRouter.get('/vnpay/ipn', ipnRateLimit, asyncHandler(vnpayIpn))

export default ipnRouter
