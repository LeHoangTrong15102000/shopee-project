import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { adminSearchAnalyticsController } from '@controllers/admin-search-analytics.controller'

const adminSearchAnalyticsRouter = Router()

adminSearchAnalyticsRouter.use(authMiddleware.verifyAccessToken, authMiddleware.verifyAdmin)

/**
 * GET /admin/search-analytics/overview
 * Aggregated stats: total searches, unique keywords, avg per day, zero-result rate
 * Query: ?period=7d|30d|90d
 */
adminSearchAnalyticsRouter.get(
  '/overview',
  asyncHandler(adminSearchAnalyticsController.getOverview),
)

/**
 * GET /admin/search-analytics/popular
 * Top 50 search terms by frequency
 * Query: ?period=7d|30d|90d
 */
adminSearchAnalyticsRouter.get(
  '/popular',
  asyncHandler(adminSearchAnalyticsController.getPopularSearches),
)

/**
 * GET /admin/search-analytics/trending
 * Terms with >50% frequency increase vs previous period
 */
adminSearchAnalyticsRouter.get(
  '/trending',
  asyncHandler(adminSearchAnalyticsController.getTrendingSearches),
)

/**
 * GET /admin/search-analytics/zero-results
 * Searches that returned 0 products (top 30)
 * Query: ?period=7d|30d
 */
adminSearchAnalyticsRouter.get(
  '/zero-results',
  asyncHandler(adminSearchAnalyticsController.getZeroResultSearches),
)

/**
 * GET /admin/search-analytics/volume
 * Daily search count for last 30/90 days
 * Query: ?period=30d|90d
 */
adminSearchAnalyticsRouter.get(
  '/volume',
  asyncHandler(adminSearchAnalyticsController.getSearchVolume),
)

export default adminSearchAnalyticsRouter
