/**
 * Product recommendation routes.
 *
 * GET  /products/:id/similar         — similar products (content-based)
 * GET  /products/:id/bought-together — frequently bought together
 * POST /products/:id/view            — record a product view (auth required)
 * GET  /products/recently-viewed     — get recently viewed products (auth required)
 */
import { Router } from 'express'
import RecommendationController from '@controllers/recommendation.controller'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'

const productRecommendationRouter = Router()

/**
 * GET /products/recently-viewed
 * Must be registered BEFORE /:id routes to avoid being matched as an ID.
 */
productRecommendationRouter.get(
  '/recently-viewed',
  authMiddleware.verifyAccessToken,
  asyncHandler(RecommendationController.getRecentlyViewed),
)

/**
 * POST /products/:id/view
 */
productRecommendationRouter.post(
  '/:id/view',
  authMiddleware.verifyAccessToken,
  asyncHandler(RecommendationController.recordView),
)

/**
 * GET /products/:id/similar
 */
productRecommendationRouter.get(
  '/:id/similar',
  asyncHandler(RecommendationController.getSimilarProducts),
)

/**
 * GET /products/:id/bought-together
 */
productRecommendationRouter.get(
  '/:id/bought-together',
  asyncHandler(RecommendationController.getBoughtTogether),
)

export default productRecommendationRouter
