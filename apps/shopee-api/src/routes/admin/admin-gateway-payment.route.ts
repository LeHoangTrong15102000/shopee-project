import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import {
  adminListPayments,
  adminReconcilePayment,
  adminManualConfirmPayment,
  adminReconcileAll,
} from '@controllers/admin-gateway-payment.controller'

const adminGatewayPaymentRouter = Router()

adminGatewayPaymentRouter.use(authMiddleware.verifyAccessToken, authMiddleware.verifyAdmin)

// GET /admin/gateway-payments — list payments with filters
adminGatewayPaymentRouter.get('', asyncHandler(adminListPayments))

// POST /admin/gateway-payments/reconcile-all — trigger full reconciliation run
adminGatewayPaymentRouter.post('/reconcile-all', asyncHandler(adminReconcileAll))

// POST /admin/gateway-payments/:id/reconcile — query provider, sync local status
adminGatewayPaymentRouter.post('/:id/reconcile', asyncHandler(adminReconcilePayment))

// POST /admin/gateway-payments/:id/manual-confirm — admin override with audit log
adminGatewayPaymentRouter.post('/:id/manual-confirm', asyncHandler(adminManualConfirmPayment))

export default adminGatewayPaymentRouter
