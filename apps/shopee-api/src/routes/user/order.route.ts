import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import * as orderController from '@controllers/order.controller'
import { asyncHandler } from '@utils/async-handler'
import { validate, returnOrderSchema } from '@schemas/index'
import { GpsTrackingService } from '@services/gps-tracking.service'
import { NotFoundError, ValidationError } from '@services/base.service'
import { STATUS } from '@constants/status'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { RateLimiterRedis } from 'rate-limiter-flexible'
import { redisClient } from '@utils/redis.client'
import { Request, Response, NextFunction } from 'express'

export const userOrderRouter = Router()

const gpsTrackingService = new GpsTrackingService()

// Payment status rate limiter: 20 req/min per user
const paymentStatusLimiter = (() => {
  const points = 20
  const duration = 60
  if (redisClient) {
    return new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: 'rl:paymentStatus',
      points,
      duration,
      insuranceLimiter: new RateLimiterMemory({ points, duration }),
    })
  }
  return new RateLimiterMemory({ keyPrefix: 'rl:paymentStatus', points, duration })
})()

function paymentStatusRateLimit(req: Request, res: Response, next: NextFunction): void {
  const key = (req as any).jwtDecoded?.id || req.ip || 'anonymous'
  paymentStatusLimiter
    .consume(key)
    .then(() => next())
    .catch(() => {
      res.status(429).json({ success: false, message: 'Too many payment status requests' })
    })
}

// Get shipping methods
userOrderRouter.get('/shipping/methods', asyncHandler(orderController.getShippingMethods))

// Get payment methods
userOrderRouter.get('/payment/methods', asyncHandler(orderController.getPaymentMethods))

// Get all orders
userOrderRouter.get('', authMiddleware.verifyAccessToken, asyncHandler(orderController.getOrders))

// GET /orders/pending-payment — must be registered BEFORE /:id to avoid route conflict
userOrderRouter.get(
  '/pending-payment',
  authMiddleware.verifyAccessToken,
  asyncHandler(orderController.getPendingPaymentOrder),
)

// Get order by ID
userOrderRouter.get(
  '/:id',
  authMiddleware.verifyAccessToken,
  asyncHandler(orderController.getOrderById),
)

// GET /orders/:id/payment-status — must be registered BEFORE /:id/cancel etc.
userOrderRouter.get(
  '/:id/payment-status',
  authMiddleware.verifyAccessToken,
  paymentStatusRateLimit,
  asyncHandler(orderController.getOrderPaymentStatus),
)

// Create new order
userOrderRouter.post(
  '',
  authMiddleware.verifyAccessToken,
  asyncHandler(orderController.createOrder),
)

// POST /orders/:id/retry-payment — generate a new payment URL for a failed/expired payment
userOrderRouter.post(
  '/:id/retry-payment',
  authMiddleware.verifyAccessToken,
  asyncHandler(orderController.retryOrderPayment),
)

// Cancel order
userOrderRouter.put(
  '/:id/cancel',
  authMiddleware.verifyAccessToken,
  asyncHandler(orderController.cancelOrder),
)

// Confirm received order
userOrderRouter.put(
  '/:id/confirm-received',
  authMiddleware.verifyAccessToken,
  asyncHandler(orderController.confirmReceived),
)

// Return order
userOrderRouter.put(
  '/:id/return',
  authMiddleware.verifyAccessToken,
  validate(returnOrderSchema),
  asyncHandler(orderController.returnOrder),
)

// GET /orders/:id/tracking — GPS realtime tracking
userOrderRouter.get(
  '/:id/tracking',
  authMiddleware.verifyAccessToken,
  asyncHandler(async (req, res) => {
    try {
      const tracking = await gpsTrackingService.getOrderTracking(req.params.id)
      res.status(STATUS.OK).json({ message: 'Lấy thông tin tracking thành công', data: tracking })
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(STATUS.BAD_REQUEST).json({ message: error.message })
        return
      }
      if (error instanceof NotFoundError) {
        res.status(STATUS.NOT_FOUND).json({ message: 'Không tìm thấy thông tin tracking' })
        return
      }
      res.status(STATUS.INTERNAL_SERVER_ERROR).json({ message: 'Lỗi server' })
    }
  }),
)
