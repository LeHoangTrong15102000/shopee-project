import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import * as refundController from '@controllers/refund.controller'
import { asyncHandler } from '@utils/async-handler'

export const userRefundRouter = Router()

// GET /refunds — list all refund requests for the authenticated user
userRefundRouter.get(
  '',
  authMiddleware.verifyAccessToken,
  asyncHandler(refundController.listMyRefunds),
)
