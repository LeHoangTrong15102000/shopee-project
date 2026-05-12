import { Router } from 'express'
import { asyncHandler } from '@utils/async-handler'
import {
  adminListPayments,
  adminReconcilePayment,
  adminManualConfirmPayment,
} from '@controllers/admin-gateway-payment.controller'

const adminGatewayPaymentRouter = Router()

// GET /admin/gateway-payments — list payments with filters
adminGatewayPaymentRouter.get('', asyncHandler(adminListPayments))

// POST /admin/gateway-payments/:id/reconcile — query provider, sync local status
adminGatewayPaymentRouter.post('/:id/reconcile', asyncHandler(adminReconcilePayment))

// POST /admin/gateway-payments/:id/manual-confirm — admin override with audit log
adminGatewayPaymentRouter.post('/:id/manual-confirm', asyncHandler(adminManualConfirmPayment))

export default adminGatewayPaymentRouter
