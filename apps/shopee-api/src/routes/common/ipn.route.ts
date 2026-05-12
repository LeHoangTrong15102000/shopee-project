import { Router, Request, Response, NextFunction } from 'express'
import { asyncHandler } from '@utils/async-handler'
import { momoIpn, vnpayIpn } from '@controllers/ipn.controller'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { RateLimiterRedis } from 'rate-limiter-flexible'
import { redisClient } from '@utils/redis.client'

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
 * IPN routes — NO JWT auth.
 * Signature verification inside the controller is the auth mechanism.
 *
 * POST /payment/momo/ipn  — MoMo IPN (JSON body)
 * GET  /payment/vnpay/ipn — VNPay IPN (query params)
 */
ipnRouter.post('/momo/ipn', ipnRateLimit, asyncHandler(momoIpn))
ipnRouter.get('/vnpay/ipn', ipnRateLimit, asyncHandler(vnpayIpn))

export default ipnRouter
