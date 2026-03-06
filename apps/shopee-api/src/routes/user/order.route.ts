import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import * as orderController from '@controllers/order.controller'
import { asyncHandler } from '@utils/async-handler'
import { validate, returnOrderSchema } from '@schemas/index'

export const userOrderRouter = Router()

// Get shipping methods
userOrderRouter.get(
  '/shipping/methods',
  asyncHandler(orderController.getShippingMethods)
)

// Get payment methods
userOrderRouter.get(
  '/payment/methods',
  asyncHandler(orderController.getPaymentMethods)
)

// Get all orders
userOrderRouter.get(
  '',
  authMiddleware.verifyAccessToken,
  asyncHandler(orderController.getOrders)
)

// Get order by ID
userOrderRouter.get(
  '/:id',
  authMiddleware.verifyAccessToken,
  asyncHandler(orderController.getOrderById)
)

// Create new order
userOrderRouter.post(
  '',
  authMiddleware.verifyAccessToken,
  asyncHandler(orderController.createOrder)
)

// Cancel order
userOrderRouter.put(
  '/:id/cancel',
  authMiddleware.verifyAccessToken,
  asyncHandler(orderController.cancelOrder)
)

// Confirm received order
userOrderRouter.put(
  '/:id/confirm-received',
  authMiddleware.verifyAccessToken,
  asyncHandler(orderController.confirmReceived)
)

// Return order
userOrderRouter.put(
  '/:id/return',
  authMiddleware.verifyAccessToken,
  validate(returnOrderSchema),
  asyncHandler(orderController.returnOrder)
)

