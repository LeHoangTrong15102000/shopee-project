/**
 * RecommendationService — provides product recommendations.
 *
 * Three recommendation types:
 *   1. Similar products — content-based (same category, overlapping tags, price ±30%)
 *   2. Frequently bought together — derived from order co-occurrence
 *
 * Results are cached in Redis to avoid repeated heavy queries.
 */
import { Types } from 'mongoose'
import { ProductModel } from '@database/models/product.model'
import { OrderModel } from '@database/models/order.model'
import { redisClient } from '@utils/redis.client'
import { Logger } from '@utils/logger'
import { IProduct } from '../@types/models.type'
import { NotFoundError } from './base.service'

const SIMILAR_TTL = 3600       // 1 hour
const BOUGHT_TOGETHER_TTL = 86400  // 24 hours

export class RecommendationService {
  // ─── Similar Products ─────────────────────────────────────────────────────

  /**
   * Get up to 12 products similar to the given product.
   * Algorithm: same category + overlapping tags + price within ±30%.
   * Sorted by tag overlap count → rating → sold_count.
   * Cached in Redis key `similar:{productId}` for 1 hour.
   */
  async getSimilarProducts(productId: string): Promise<IProduct[]> {
    const cacheKey = `similar:${productId}`

    // Try cache first
    const cached = await this.getFromCache<IProduct[]>(cacheKey)
    if (cached !== null) return cached

    const product = await ProductModel.findById(productId).lean<IProduct>()
    if (!product) throw new NotFoundError('Product not found')

    const categoryId = product.category instanceof Types.ObjectId
      ? product.category
      : product.category
        ? new Types.ObjectId(product.category.toString())
        : null

    if (!categoryId) {
      await this.setCache(cacheKey, [], SIMILAR_TTL)
      return []
    }

    const price = product.price ?? 0
    const minPrice = price * 0.7
    const maxPrice = price * 1.3

    // Fetch candidates: same category, price range, exclude self
    const candidates = await ProductModel.find({
      _id: { $ne: new Types.ObjectId(productId) },
      category: categoryId,
      price: { $gte: minPrice, $lte: maxPrice },
    })
      .lean<IProduct[]>()
      .limit(100)

    // Score by tag overlap (products don't have tags in current schema — use 0)
    // Sort by rating desc, then sold desc
    const scored = candidates.map((p) => ({
      product: p,
      tagOverlap: 0,
    }))

    scored.sort((a, b) => {
      if (b.tagOverlap !== a.tagOverlap) return b.tagOverlap - a.tagOverlap
      const ratingDiff = (b.product.rating ?? 0) - (a.product.rating ?? 0)
      if (ratingDiff !== 0) return ratingDiff
      return (b.product.sold ?? 0) - (a.product.sold ?? 0)
    })

    const results = scored.slice(0, 12).map((s) => s.product)
    await this.setCache(cacheKey, results, SIMILAR_TTL)
    return results
  }

  // ─── Frequently Bought Together ───────────────────────────────────────────

  /**
   * Get products frequently bought together with the given product.
   * Uses MongoDB aggregation over the orders collection.
   * Cached in Redis key `bought-together:{productId}` for 24 hours.
   */
  async getBoughtTogether(productId: string): Promise<IProduct[]> {
    const cacheKey = `bought-together:${productId}`

    const cached = await this.getFromCache<IProduct[]>(cacheKey)
    if (cached !== null) return cached

    let productObjectId: Types.ObjectId
    try {
      productObjectId = new Types.ObjectId(productId)
    } catch {
      return []
    }

    // Aggregate: find orders containing this product, collect co-purchased product IDs
    const pipeline = [
      // Match orders that contain the target product
      { $match: { 'items.product': productObjectId } },
      // Unwind items to get individual product refs
      { $unwind: '$items' },
      // Exclude the target product itself
      { $match: { 'items.product': { $ne: productObjectId } } },
      // Group by co-purchased product, count occurrences
      {
        $group: {
          _id: '$items.product',
          count: { $sum: 1 },
        },
      },
      // Sort by co-occurrence count descending
      { $sort: { count: -1 } },
      // Limit to top 12
      { $limit: 12 },
    ]

    const coProducts = await OrderModel.aggregate(pipeline)
    if (coProducts.length === 0) {
      await this.setCache(cacheKey, [], BOUGHT_TOGETHER_TTL)
      return []
    }

    const ids = coProducts.map((r: { _id: Types.ObjectId }) => r._id)
    const products = await ProductModel.find({ _id: { $in: ids } }).lean<IProduct[]>()

    // Preserve the co-occurrence order
    const idOrder = ids.map((id: Types.ObjectId) => id.toString())
    products.sort(
      (a, b) =>
        idOrder.indexOf(a._id!.toString()) - idOrder.indexOf(b._id!.toString()),
    )

    await this.setCache(cacheKey, products, BOUGHT_TOGETHER_TTL)
    return products
  }

  /**
   * Invalidate bought-together cache for a list of product IDs.
   * Called when a new order is created.
   */
  async invalidateBoughtTogetherCache(productIds: string[]): Promise<void> {
    if (!redisClient) return
    try {
      const keys = productIds.map((id) => `bought-together:${id}`)
      if (keys.length > 0) {
        await redisClient.del(...keys)
      }
    } catch (err) {
      Logger.apiWarn('[RecommendationService] Failed to invalidate bought-together cache', {
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // ─── Redis helpers ────────────────────────────────────────────────────────

  private async getFromCache<T>(key: string): Promise<T | null> {
    if (!redisClient) return null
    try {
      const raw = await redisClient.get(key)
      if (raw === null) return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  private async setCache<T>(key: string, value: T, ttl: number): Promise<void> {
    if (!redisClient) return
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttl)
    } catch (err) {
      Logger.apiWarn('[RecommendationService] Failed to set cache', {
        key,
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }
}
