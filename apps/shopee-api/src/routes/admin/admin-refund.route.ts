import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import * as adminRefundController from '@controllers/admin-refund.controller'
import { asyncHandler } from '@utils/async-handler'
import { validate } from '@schemas/index'
import {
  adminApproveRefundSchema,
  adminRejectRefundSchema,
  adminRetryRefundSchema,
} from '@schemas/refund.schema'

export const adminRefundRouter = Router()

// All routes require both verifyAccessToken and verifyAdmin

// GET /admin/refunds — list refunds with optional filters
adminRefundRouter.get(
  '',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(adminRefundController.listRefunds),
)

// GET /admin/refunds/stats — get refund stats by status
// Must be registered BEFORE /:id to avoid wildcard conflict
adminRefundRouter.get(
  '/stats',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(adminRefundController.getRefundStats),
)

// GET /admin/refunds/:id — get refund detail
adminRefundRouter.get(
  '/:id',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(adminRefundController.getRefundDetail),
)

// PUT /admin/refunds/:id/approve — approve a refund
adminRefundRouter.put(
  '/:id/approve',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(adminApproveRefundSchema),
  asyncHandler(adminRefundController.approveRefund),
)

// PUT /admin/refunds/:id/reject — reject a refund
adminRefundRouter.put(
  '/:id/reject',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(adminRejectRefundSchema),
  asyncHandler(adminRefundController.rejectRefund),
)

// PUT /admin/refunds/:id/complete — mark refund as completed
adminRefundRouter.put(
  '/:id/complete',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(adminRefundController.completeRefund),
)

// PUT /admin/refunds/:id/retry — retry a failed gateway refund
adminRefundRouter.put(
  '/:id/retry',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(adminRetryRefundSchema),
  asyncHandler(adminRefundController.retryGatewayRefund),
)
