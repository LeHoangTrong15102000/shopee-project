import { Router } from 'express'
import { adminDashboardController } from '@controllers/admin-dashboard.controller'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { validate } from '@schemas/index'
import {
  dashboardRevenueSchema,
  dashboardRevenueByCategorySchema,
  dashboardRevenueByProductSchema,
  dashboardOrderTrendSchema,
  dashboardUserGrowthSchema,
  dashboardTopBuyersSchema,
} from '@schemas/admin-dashboard.schema'

const adminDashboardRouter = Router()

// All dashboard routes require admin auth
adminDashboardRouter.use(authMiddleware.verifyAccessToken, authMiddleware.verifyAdmin)

/**
 * GET /admin/dashboard/overview
 * Tổng quan dashboard
 */
adminDashboardRouter.get('/overview', asyncHandler(adminDashboardController.getOverview))

/**
 * GET /admin/dashboard/revenue?period=30d&start_date=&end_date=
 * Doanh thu theo thời gian
 */
adminDashboardRouter.get(
  '/revenue',
  validate(dashboardRevenueSchema),
  asyncHandler(adminDashboardController.getRevenue),
)

/**
 * GET /admin/dashboard/revenue/by-category?period=30d
 * Doanh thu theo danh mục
 */
adminDashboardRouter.get(
  '/revenue/by-category',
  validate(dashboardRevenueByCategorySchema),
  asyncHandler(adminDashboardController.getRevenueByCategory),
)

/**
 * GET /admin/dashboard/revenue/by-product?period=30d&limit=10
 * Top sản phẩm theo doanh thu
 */
adminDashboardRouter.get(
  '/revenue/by-product',
  validate(dashboardRevenueByProductSchema),
  asyncHandler(adminDashboardController.getRevenueByProduct),
)

/**
 * GET /admin/dashboard/orders/trend?period=30d
 * Xu hướng đơn hàng
 */
adminDashboardRouter.get(
  '/orders/trend',
  validate(dashboardOrderTrendSchema),
  asyncHandler(adminDashboardController.getOrderTrend),
)

/**
 * GET /admin/dashboard/users/growth?period=30d
 * Tăng trưởng người dùng
 */
adminDashboardRouter.get(
  '/users/growth',
  validate(dashboardUserGrowthSchema),
  asyncHandler(adminDashboardController.getUserGrowth),
)

/**
 * GET /admin/dashboard/users/top-buyers?period=30d&limit=10
 * Top người mua
 */
adminDashboardRouter.get(
  '/users/top-buyers',
  validate(dashboardTopBuyersSchema),
  asyncHandler(adminDashboardController.getTopBuyers),
)

export default adminDashboardRouter
