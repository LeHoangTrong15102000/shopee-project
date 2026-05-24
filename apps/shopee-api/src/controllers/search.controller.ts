/**
 * SearchController — Meilisearch-backed product search and suggestions.
 *
 * GET /search/products  — full-text search with filters, sorting, facets
 * GET /search/suggestions — autocomplete prefix search
 */
import { Request, Response } from 'express'
import { responseSuccess } from '@utils/response'
import { SearchHistoryModel } from '@database/models/search-history.model'
import { Logger } from '@utils/logger'

// Services are imported from container to avoid circular deps at module load
// They are resolved lazily on first request.
let _meilisearchService: import('@services/meilisearch.service').MeilisearchService | null = null

function getMeilisearchService() {
  if (!_meilisearchService) {
    // Lazy import to avoid circular dependency at module load time
    const { container } = require('../container') as { container: { services: { meilisearch: import('@services/meilisearch.service').MeilisearchService } } }
    _meilisearchService = container.services.meilisearch
  }
  return _meilisearchService
}

/**
 * GET /search/products
 *
 * Query params:
 *   q         — search query (default: '')
 *   category  — category_id filter
 *   minPrice  — minimum price filter
 *   maxPrice  — maximum price filter
 *   rating    — minimum rating filter
 *   sort      — sort field:direction (price:asc, price:desc, rating:desc, sold_count:desc, createdAt:desc)
 *   page      — page number (default: 1)
 *   limit     — results per page (default: 20, max: 100)
 */
const searchProducts = async (req: Request, res: Response): Promise<void> => {
  const {
    q = '',
    category,
    minPrice,
    maxPrice,
    rating,
    sort,
    page = '1',
    limit = '20',
  } = req.query as Record<string, string>

  const parsedPage = Math.max(1, parseInt(page, 10) || 1)
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20))

  const meilisearch = getMeilisearchService()
  const result = await meilisearch.search({
    q: q || '',
    category: category || undefined,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    rating: rating ? parseFloat(rating) : undefined,
    sort: sort || undefined,
    page: parsedPage,
    limit: parsedLimit,
  })

  // Log search query for analytics (fire-and-forget)
  if (q && q.trim().length > 0) {
    const userId = req.jwtDecoded?.id
    SearchHistoryModel.findOneAndUpdate(
      { keyword: q.trim(), ...(userId ? { user: userId } : {}) },
      {
        $inc: { searchCount: 1 },
        $set: {
          lastSearched: new Date(),
          resultsCount: result.totalHits,
          ...(userId ? { user: userId } : {}),
        },
        $setOnInsert: { keyword: q.trim() },
      },
      { upsert: true, new: true },
    ).catch((err: Error) => {
      Logger.apiWarn('[SearchController] Failed to log search history', { message: err.message })
    })
  }

  responseSuccess(res, {
    message: 'Tìm kiếm sản phẩm thành công',
    data: result,
  })
}

/**
 * GET /search/suggestions
 *
 * Query params:
 *   q     — prefix query (required, min 1 char)
 *   limit — max suggestions (default: 8, max: 20)
 */
const getSearchSuggestions = async (req: Request, res: Response): Promise<void> => {
  const { q = '', limit = '8' } = req.query as Record<string, string>

  if (!q || q.trim().length === 0) {
    responseSuccess(res, {
      message: 'Lấy gợi ý tìm kiếm thành công',
      data: { suggestions: [] },
    })
    return
  }

  const parsedLimit = Math.min(20, Math.max(1, parseInt(limit, 10) || 8))
  const meilisearch = getMeilisearchService()
  const suggestions = await meilisearch.suggest(q.trim(), parsedLimit)

  responseSuccess(res, {
    message: 'Lấy gợi ý tìm kiếm thành công',
    data: { suggestions },
  })
}

const SearchController = {
  searchProducts,
  getSearchSuggestions,
}

export default SearchController
