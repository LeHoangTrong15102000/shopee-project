/**
 * RecommendationController — product recommendation endpoints.
 *
 * GET /products/:id/similar        — similar products (content-based)
 * GET /products/:id/bought-together — frequently bought together
 * POST /products/:id/view          — record a product view (auth required)
 * GET /products/recently-viewed    — get recently viewed products (auth required)
 */
import { Request, Response } from 'express'
import { responseSuccess, ErrorHandler } from '@utils/response'
import { STATUS } from '@constants/status'
import { redisClient } from '@utils/redis.client'
import { ProductModel } from '@database/models/product.model'
import { Logger } from '@utils/logger'

const RECENTLY_VIEWED_CAP = 50

// Lazy service resolution to avoid circular deps
let _recommendationService:
  | import('@services/recommendation.service').RecommendationService
  | null = null

function getRecommendationService() {
  if (!_recommendationService) {
    const { container } = require('../container') as {
      container: {
        services: {
          recommendation: import('@services/recommendation.service').RecommendationService
        }
      }
    }
    _recommendationService = container.services.recommendation
  }
  return _recommendationService
}

/**
 * GET /products/:id/similar
 */
const getSimilarProducts = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string
  const service = getRecommendationService()
  const products = await service.getSimilarProducts(id)

  responseSuccess(res, {
    message: 'Lấy sản phẩm tương tự thành công',
    data: products,
  })
}

/**
 * GET /products/:id/bought-together
 */
const getBoughtTogether = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string
  const service = getRecommendationService()
  const products = await service.getBoughtTogether(id)

  responseSuccess(res, {
    message: 'Lấy sản phẩm thường mua cùng thành công',
    data: products,
  })
}

/**
 * POST /products/:id/view
 * Auth required. Records a product view in Redis sorted set.
 */
const recordView = async (req: Request, res: Response): Promise<void> => {
  const userId = req.jwtDecoded?.id
  if (!userId) {
    throw new ErrorHandler(STATUS.UNAUTHORIZED, 'Yêu cầu đăng nhập')
  }

  const productId = req.params.id as string

  if (!redisClient) {
    // Redis unavailable — silently succeed
    responseSuccess(res, { message: 'Đã ghi nhận lượt xem', data: null })
    return
  }

  const key = `recently-viewed:${userId}`
  const score = Date.now()

  try {
    // Add product to sorted set with score = timestamp
    // ioredis overload resolution requires spread for score-member pairs
    const args: [string, ...Array<string | number>] = [key, score, productId]
    await redisClient.zadd(...args)
    // Cap at RECENTLY_VIEWED_CAP items — remove oldest (lowest scores)
    // ZREMRANGEBYRANK key 0 -(cap+1) removes all but the top `cap` items
    await redisClient.zremrangebyrank(key, 0, -(RECENTLY_VIEWED_CAP + 1))
  } catch (err) {
    Logger.apiWarn('[RecommendationController] Failed to record view', {
      userId,
      productId,
      message: err instanceof Error ? err.message : String(err),
    })
  }

  responseSuccess(res, { message: 'Đã ghi nhận lượt xem', data: null })
}

/**
 * GET /products/recently-viewed
 * Auth required. Returns recently viewed products newest-first.
 */
const getRecentlyViewed = async (req: Request, res: Response): Promise<void> => {
  const userId = req.jwtDecoded?.id
  if (!userId) {
    throw new ErrorHandler(STATUS.UNAUTHORIZED, 'Yêu cầu đăng nhập')
  }

  if (!redisClient) {
    responseSuccess(res, { message: 'Lấy sản phẩm đã xem thành công', data: [] })
    return
  }

  const key = `recently-viewed:${userId}`

  // ZREVRANGE returns members sorted by score descending (newest first)
  const productIds = await redisClient.zrevrange(key, 0, -1)

  if (productIds.length === 0) {
    responseSuccess(res, { message: 'Lấy sản phẩm đã xem thành công', data: [] })
    return
  }

  // Batch-fetch from MongoDB, omit deleted products
  const products = await ProductModel.find({
    _id: { $in: productIds },
  }).lean()

  // Preserve the Redis order (newest first)
  const productMap = new Map(products.map((p) => [p._id.toString(), p]))
  const ordered = productIds
    .map((id) => productMap.get(id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined)

  responseSuccess(res, {
    message: 'Lấy sản phẩm đã xem thành công',
    data: ordered,
  })
}

const RecommendationController = {
  getSimilarProducts,
  getBoughtTogether,
  recordView,
  getRecentlyViewed,
}

export default RecommendationController
