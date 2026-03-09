import { Router } from 'express'
import ProductController from '@controllers/product.controller'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import {
  validate,
  getProductsSchema,
  productIdParamSchema,
} from '@schemas/index'

const commonProductRouter = Router()
/**
 * [Get products paginate]
 * @queryParam type: string, page: number, limit: number, category:mongoId, exclude: mongoId product
 * @route products
 * @method get
 */
commonProductRouter.get(
  '',
  validate(getProductsSchema),
  asyncHandler(ProductController.getProducts)
)

commonProductRouter.get(
  '/:product_id',
  validate(productIdParamSchema),
  asyncHandler(ProductController.getProduct)
)

commonProductRouter.get('/search', asyncHandler(ProductController.searchProduct))

// get search suggestions
commonProductRouter.get(
  '/search/suggestions',
  asyncHandler(ProductController.getSearchSuggestions)
)

// get search history (optional auth - returns empty if not logged in)
commonProductRouter.get(
  '/search/history',
  authMiddleware.verifyAccessTokenOptional,
  asyncHandler(ProductController.getSearchHistory)
)

// save search history (requires auth)
commonProductRouter.post(
  '/search/save-history',
  authMiddleware.verifyAccessToken,
  asyncHandler(ProductController.saveSearchHistory)
)

// delete all search history (requires auth)
commonProductRouter.delete(
  '/search/history',
  authMiddleware.verifyAccessToken,
  asyncHandler(ProductController.deleteSearchHistory)
)

// delete specific search history item (requires auth)
commonProductRouter.delete(
  '/search/history/:keyword',
  authMiddleware.verifyAccessToken,
  asyncHandler(ProductController.deleteSearchHistoryItem)
)

export default commonProductRouter
