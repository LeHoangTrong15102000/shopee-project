import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { validate } from '@schemas/index'
import {
  adminRewardListSchema,
  adminCreateRewardSchema,
  adminUpdateRewardSchema,
  adminRewardIdSchema,
  adminAdjustPointsSchema,
  adminTransactionListSchema,
} from '@schemas/admin-loyalty.schema'
import * as ctrl from '@controllers/admin-loyalty.controller'

const adminLoyaltyRouter = Router()

adminLoyaltyRouter.use(authMiddleware.verifyAccessToken, authMiddleware.verifyAdmin)

adminLoyaltyRouter.get(
  '/rewards',
  validate(adminRewardListSchema),
  asyncHandler(ctrl.adminGetRewards),
)
adminLoyaltyRouter.post(
  '/rewards',
  validate(adminCreateRewardSchema),
  asyncHandler(ctrl.adminCreateReward),
)
adminLoyaltyRouter.put(
  '/rewards/:id',
  validate(adminUpdateRewardSchema),
  asyncHandler(ctrl.adminUpdateReward),
)
adminLoyaltyRouter.delete(
  '/rewards/:id',
  validate(adminRewardIdSchema),
  asyncHandler(ctrl.adminDeleteReward),
)
adminLoyaltyRouter.patch(
  '/rewards/:id/toggle',
  validate(adminRewardIdSchema),
  asyncHandler(ctrl.adminToggleReward),
)
adminLoyaltyRouter.post(
  '/points/adjust',
  validate(adminAdjustPointsSchema),
  asyncHandler(ctrl.adminAdjustPoints),
)
adminLoyaltyRouter.get(
  '/transactions',
  validate(adminTransactionListSchema),
  asyncHandler(ctrl.adminGetTransactions),
)
adminLoyaltyRouter.get('/stats', asyncHandler(ctrl.adminGetLoyaltyStats))

export default adminLoyaltyRouter
