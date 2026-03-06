import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import * as orderController from '@controllers/order.controller'
import { asyncHandler } from '@utils/async-handler'
import { validate, adminUpdateStatusSchema, adminGetOrderSchema } from '@schemas/index'
import { adminOrderListSchema, adminBulkUpdateStatusSchema } from '@schemas/admin-order-list.schema'

const adminOrderRouter = Router()

// List orders with filters (admin)
adminOrderRouter.get(
  '/',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(adminOrderListSchema),
  asyncHandler(orderController.adminGetOrders)
)

// Count orders by status (admin)
adminOrderRouter.get(
  '/count-by-status',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(orderController.adminGetOrderCountByStatus)
)

// Get order by ID (admin)
adminOrderRouter.get(
  '/:id',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(adminGetOrderSchema),
  asyncHandler(orderController.adminGetOrder)
)

// Bulk update order status (admin)
adminOrderRouter.put(
  '/bulk-status',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(adminBulkUpdateStatusSchema),
  asyncHandler(orderController.adminBulkUpdateStatus)
)

// Update order status (admin)
adminOrderRouter.put(
  '/:id/status',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(adminUpdateStatusSchema),
  asyncHandler(orderController.adminUpdateStatus)
)

export default adminOrderRouter

