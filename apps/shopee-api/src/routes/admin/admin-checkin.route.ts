import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import {
  adminGetCheckinUsers,
  adminGetCheckinLeaderboard,
  adminGetCheckinDailyStats,
  adminGetCheckinStats,
} from '@controllers/admin-checkin.controller'

const adminCheckinRouter = Router()

adminCheckinRouter.use(authMiddleware.verifyAccessToken, authMiddleware.verifyAdmin)

adminCheckinRouter.get('/', asyncHandler(adminGetCheckinStats))
adminCheckinRouter.get('/users', asyncHandler(adminGetCheckinUsers))
adminCheckinRouter.get('/leaderboard', asyncHandler(adminGetCheckinLeaderboard))
adminCheckinRouter.get('/daily-stats', asyncHandler(adminGetCheckinDailyStats))

export default adminCheckinRouter
