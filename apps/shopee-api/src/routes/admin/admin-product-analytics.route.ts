import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { validate } from '@schemas/index'
import {
  adminTopSellingSchema,
  adminTopViewedSchema,
  adminTopRatedSchema,
  adminProductByCategorySchema,
} from '@schemas/admin-product-analytics.schema'
import * as ctrl from '@controllers/admin-product-analytics.controller'

const adminProductAnalyticsRouter = Router()

adminProductAnalyticsRouter.use(authMiddleware.verifyAccessToken, authMiddleware.verifyAdmin)

adminProductAnalyticsRouter.get(
  '/top-selling',
  validate(adminTopSellingSchema),
  asyncHandler(ctrl.adminGetTopSelling),
)
adminProductAnalyticsRouter.get(
  '/top-viewed',
  validate(adminTopViewedSchema),
  asyncHandler(ctrl.adminGetTopViewed),
)
adminProductAnalyticsRouter.get(
  '/top-rated',
  validate(adminTopRatedSchema),
  asyncHandler(ctrl.adminGetTopRated),
)
adminProductAnalyticsRouter.get(
  '/by-category',
  validate(adminProductByCategorySchema),
  asyncHandler(ctrl.adminGetStatsByCategory),
)

export default adminProductAnalyticsRouter
