/**
 * Search routes — Meilisearch-backed product search and suggestions.
 *
 * GET /search/products     — full-text search with filters, sorting, facets
 * GET /search/suggestions  — autocomplete prefix search
 */
import { Router } from 'express'
import SearchController from '@controllers/search.controller'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import { expensiveRateLimit } from '@middleware/rateLimiter.middleware'

const searchRouter = Router()

/**
 * GET /search/products
 * Full-text product search backed by Meilisearch.
 * Optional auth — user ID used for search history logging if present.
 */
searchRouter.get(
  '/products',
  authMiddleware.verifyAccessTokenOptional,
  asyncHandler(SearchController.searchProducts),
)

/**
 * GET /search/suggestions
 * Autocomplete prefix search — expensive query, apply stricter rate limit.
 */
searchRouter.get(
  '/suggestions',
  expensiveRateLimit,
  asyncHandler(SearchController.getSearchSuggestions),
)

export default searchRouter
