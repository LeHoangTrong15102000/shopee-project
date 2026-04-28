import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import * as orderController from '@controllers/order.controller'
import { asyncHandler } from '@utils/async-handler'
import { validate, returnOrderSchema } from '@schemas/index'
import { GpsTrackingService } from '@services/gps-tracking.service'
import { NotFoundError, ValidationError } from '@services/base.service'
import { STATUS } from '@constants/status'

export const userOrderRouter = Router()

const gpsTrackingService = new GpsTrackingService()

// Get shipping methods
userOrderRouter.get('/shipping/methods', asyncHandler(orderController.getShippingMethods))

// Get payment methods
userOrderRouter.get('/payment/methods', asyncHandler(orderController.getPaymentMethods))

// Get all orders
userOrderRouter.get('', authMiddleware.verifyAccessToken, asyncHandler(orderController.getOrders))

// Get order by ID
userOrderRouter.get(
  '/:id',
  authMiddleware.verifyAccessToken,
  asyncHandler(orderController.getOrderById),
)

// Create new order
userOrderRouter.post(
  '',
  authMiddleware.verifyAccessToken,
  asyncHandler(orderController.createOrder),
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
