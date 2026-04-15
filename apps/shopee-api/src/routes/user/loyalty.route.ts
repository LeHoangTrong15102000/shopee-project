import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import * as loyaltyController from '@controllers/loyalty.controller'
import { asyncHandler } from '@utils/async-handler'
import {
  validate,
  getPointsSchema,
  getTransactionsSchema,
  getRewardsSchema,
  redeemPointsSchema,
} from '@schemas/index'

export const userLoyaltyRouter = Router()

// Lấy thông tin điểm của user
userLoyaltyRouter.get(
  '/points',
  validate(getPointsSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(loyaltyController.getPoints),
)

// Lấy lịch sử giao dịch điểm
userLoyaltyRouter.get(
  '/transactions',
  validate(getTransactionsSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(loyaltyController.getTransactions),
)

// Lấy danh sách phần thưởng có thể đổi
userLoyaltyRouter.get(
  '/rewards',
  validate(getRewardsSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(loyaltyController.getRewards),
)

// Đổi điểm lấy phần thưởng
userLoyaltyRouter.post(
  '/redeem/:rewardId',
  validate(redeemPointsSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(loyaltyController.redeemPoints),
)
