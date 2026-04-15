import { Router } from 'express'
import { analyticsController } from '@controllers/analytics.controller'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'

const adminAnalyticsRouter = Router()

/**
 * Lấy thống kê tổng quan chatbot
 * GET /admin/analytics/chatbot-overview
 */
adminAnalyticsRouter.get(
  '/chatbot-overview',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(analyticsController.getChatbotOverview),
)

/**
 * Lấy thống kê performance chatbot theo thời gian
 * GET /admin/analytics/chatbot-performance?period=7d
 */
adminAnalyticsRouter.get(
  '/chatbot-performance',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(analyticsController.getChatbotPerformance),
)

/**
 * Health check endpoint - không cần auth để monitoring systems sử dụng
 * GET /admin/analytics/health
 */
adminAnalyticsRouter.get('/health', asyncHandler(analyticsController.getHealthCheck))

export default adminAnalyticsRouter
