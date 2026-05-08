import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { validate } from '@schemas/index'
import {
  adminShopListSchema,
  adminShopIdSchema,
  adminUpdateShopStatusSchema,
  adminShopProductsSchema,
  adminShopRevenueSchema,
} from '@schemas/admin-shops.schema'
import { adminShopsController } from '@controllers/admin-shops.controller'

const adminShopsRouter = Router()

adminShopsRouter.use(authMiddleware.verifyAccessToken, authMiddleware.verifyAdmin)

/**
 * GET /admin/shops
 * List all shops (paginated, filterable by status/search/sort)
 */
adminShopsRouter.get(
  '/',
  validate(adminShopListSchema),
  asyncHandler(adminShopsController.listShops),
)

/**
 * GET /admin/shops/:id
 * Shop detail with computed stats
 */
adminShopsRouter.get(
  '/:id',
  validate(adminShopIdSchema),
  asyncHandler(adminShopsController.getShopDetail),
)

/**
 * PATCH /admin/shops/:id/status
 * Update shop status (pending/active/suspended/banned)
 */
adminShopsRouter.patch(
  '/:id/status',
  validate(adminUpdateShopStatusSchema),
  asyncHandler(adminShopsController.updateShopStatus),
)

/**
 * GET /admin/shops/:id/products
 * Shop's products (paginated)
 */
adminShopsRouter.get(
  '/:id/products',
  validate(adminShopProductsSchema),
  asyncHandler(adminShopsController.getShopProducts),
)

/**
 * GET /admin/shops/:id/revenue
 * Shop revenue over time (period: 7d/30d/90d/1y)
 */
adminShopsRouter.get(
  '/:id/revenue',
  validate(adminShopRevenueSchema),
  asyncHandler(adminShopsController.getShopRevenue),
)

export default adminShopsRouter
