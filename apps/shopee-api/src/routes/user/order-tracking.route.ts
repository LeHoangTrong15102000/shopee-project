import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import * as orderTrackingController from '@controllers/order-tracking.controller'
import { asyncHandler } from '@utils/async-handler'

export const userOrderTrackingRouter = Router()

// Lấy tracking của đơn hàng (yêu cầu đăng nhập)
userOrderTrackingRouter.get(
  '',
  authMiddleware.verifyAccessToken,
  asyncHandler(orderTrackingController.getTracking)
)

// Lấy tracking theo số tracking (public)
userOrderTrackingRouter.get(
  '/:trackingNumber',
  asyncHandler(orderTrackingController.getTrackingByNumber)
)

