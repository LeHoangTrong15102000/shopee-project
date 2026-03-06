import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import * as checkinController from '@controllers/checkin.controller'
import { asyncHandler } from '@utils/async-handler'

export const userCheckinRouter = Router()

// Điểm danh hàng ngày
userCheckinRouter.post(
  '/',
  authMiddleware.verifyAccessToken,
  asyncHandler(checkinController.checkIn)
)

// Lấy thông tin streak hiện tại
userCheckinRouter.get(
  '/streak',
  authMiddleware.verifyAccessToken,
  asyncHandler(checkinController.getStreak)
)

// Lấy lịch sử điểm danh
userCheckinRouter.get(
  '/history',
  authMiddleware.verifyAccessToken,
  asyncHandler(checkinController.getHistory)
)

