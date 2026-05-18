import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import * as orderController from '@controllers/order.controller'
import { asyncHandler } from '@utils/async-handler'
import { validate, adminUpdateStatusSchema, adminGetOrderSchema } from '@schemas/index'
import { adminOrderListSchema, adminBulkUpdateStatusSchema } from '@schemas/admin-order-list.schema'
import { withAuditLog } from '@utils/audit-log.wrapper'
import { OrderModel } from '@database/models/order.model'

const adminOrderRouter = Router()

// List orders with filters (admin)
adminOrderRouter.get(
  '/',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(adminOrderListSchema),
  asyncHandler(orderController.adminGetOrders),
)

// Count orders by status (admin)
adminOrderRouter.get(
  '/count-by-status',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(orderController.adminGetOrderCountByStatus),
)

// Get order by ID (admin)
adminOrderRouter.get(
  '/:id',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(adminGetOrderSchema),
  asyncHandler(orderController.adminGetOrder),
)

// Bulk update order status (admin)
adminOrderRouter.put(
  '/bulk-status',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(adminBulkUpdateStatusSchema),
  asyncHandler(orderController.adminBulkUpdateStatus),
)

// Update order status (admin)
adminOrderRouter.put(
  '/:id/status',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(adminUpdateStatusSchema),
  asyncHandler(withAuditLog(orderController.adminUpdateStatus, {
    action: 'order.status_change',
    resource: 'order',
    getResourceId: (req) => req.params.id,
    getBeforeSnapshot: async (req) => OrderModel.findById(req.params.id).lean() as Promise<Record<string, unknown> | null>,
    getAfterSnapshot: async (req) => OrderModel.findById(req.params.id).lean() as Promise<Record<string, unknown> | null>,
  })),
)

export default adminOrderRouter
