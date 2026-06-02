/// <reference types="jest" />

/**
 * Unit tests for RecommendationService.
 *
 * Covers:
 *   - Task 6.6: Similarity scoring logic (rating desc, sold desc, limit 12)
 *   - Task 7.3: Redis sorted set operations (recordView / getRecentlyViewed via controller)
 *   - Task 8.5: Aggregation pipeline logic for getBoughtTogether
 *
 * All external dependencies (ProductModel, OrderModel, redisClient) are mocked.
 */

// ── Mock ProductModel ─────────────────────────────────────────────────────────
const mockProductFindById = jest.fn()
const mockProductFind = jest.fn()

jest.mock('@database/models/product.model', () => ({
  ProductModel: {
    findById: jest.fn().mockImplementation((id: string) => mockProductFindById(id)),
    find: jest.fn().mockImplementation((query: unknown) => mockProductFind(query)),
  },
}))

// ── Mock OrderModel ───────────────────────────────────────────────────────────
const mockOrderAggregate = jest.fn()

jest.mock('@database/models/order.model', () => ({
  OrderModel: {
    aggregate: jest.fn().mockImplementation((pipeline: unknown) => mockOrderAggregate(pipeline)),
  },
}))

// ── Mock redisClient ──────────────────────────────────────────────────────────
const mockRedisGet = jest.fn()
const mockRedisSet = jest.fn()
const mockRedisDel = jest.fn()

jest.mock('@utils/redis.client', () => ({
  redisClient: {
    get: jest.fn().mockImplementation((key: string) => mockRedisGet(key)),
    set: jest.fn().mockImplementation((...args: unknown[]) => mockRedisSet(...args)),
    del: jest.fn().mockImplementation((...keys: string[]) => mockRedisDel(...keys)),
  },
}))

// ── Mock Logger ───────────────────────────────────────────────────────────────
jest.mock('@utils/logger', () => ({
  Logger: {
    apiWarn: jest.fn(),
    apiError: jest.fn(),
    apiInfo: jest.fn(),
  },
}))

// ── Import after mocks ────────────────────────────────────────────────────────
import { RecommendationService } from '../../services/recommendation.service'
import { NotFoundError } from '../../services/base.service'
import { Types } from 'mongoose'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeProduct(overrides: Record<string, unknown> = {}) {
  return {
    _id: new Types.ObjectId(),
    name: 'Product',
    price: 100000,
    rating: 4.0,
    sold: 10,
    quantity: 5,
    category: new Types.ObjectId(),
    image: 'img.jpg',
    images: ['img.jpg'],
    description: 'desc',
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RecommendationService', () => {
  let service: RecommendationService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new RecommendationService()
    // Default: cache miss
    mockRedisGet.mockResolvedValue(null)
    mockRedisSet.mockResolvedValue('OK')
  })

  // ── Task 6.6: Similarity scoring ──────────────────────────────────────────

  describe('getSimilarProducts — similarity scoring', () => {
    const productId = new Types.ObjectId().toString()
    const categoryId = new Types.ObjectId()

    const baseProduct = makeProduct({
      _id: new Types.ObjectId(productId),
      price: 100000,
      category: categoryId,
    })

    it('throws NotFoundError when product is not found', async () => {
      mockProductFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) })

      await expect(service.getSimilarProducts(productId)).rejects.toThrow(NotFoundError)
      expect(mockProductFind).not.toHaveBeenCalled()
    })

    it('returns empty array and caches it when product has no category', async () => {
      const noCategoryProduct = makeProduct({ _id: new Types.ObjectId(productId), category: null })
      mockProductFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(noCategoryProduct) })

      const result = await service.getSimilarProducts(productId)

      expect(result).toEqual([])
      expect(mockRedisSet).toHaveBeenCalledWith(`similar:${productId}`, '[]', 'EX', 3600)
    })

    it('returns cached result without hitting the database', async () => {
      const cached = [makeProduct()]
      mockRedisGet.mockResolvedValue(JSON.stringify(cached))

      const result = await service.getSimilarProducts(productId)

      // Result is JSON-deserialized, so compare serialized form
      expect(JSON.stringify(result)).toBe(JSON.stringify(cached))
      expect(mockProductFindById).not.toHaveBeenCalled()
      expect(mockProductFind).not.toHaveBeenCalled()
    })

    it('sorts candidates by rating descending', async () => {
      mockProductFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(baseProduct) })

      const lowRated = makeProduct({ rating: 2.0, sold: 100 })
      const highRated = makeProduct({ rating: 5.0, sold: 1 })
      const midRated = makeProduct({ rating: 3.5, sold: 50 })

      mockProductFind.mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([lowRated, highRated, midRated]),
      })

      const result = await service.getSimilarProducts(productId)

      expect(result[0].rating).toBe(5.0)
      expect(result[1].rating).toBe(3.5)
      expect(result[2].rating).toBe(2.0)
    })

    it('uses sold count as tiebreaker when ratings are equal', async () => {
      mockProductFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(baseProduct) })

      const lowSold = makeProduct({ rating: 4.0, sold: 5 })
      const highSold = makeProduct({ rating: 4.0, sold: 200 })
      const midSold = makeProduct({ rating: 4.0, sold: 50 })

      mockProductFind.mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([lowSold, highSold, midSold]),
      })

      const result = await service.getSimilarProducts(productId)

      expect(result[0].sold).toBe(200)
      expect(result[1].sold).toBe(50)
      expect(result[2].sold).toBe(5)
    })

    it('limits results to 12 products', async () => {
      mockProductFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(baseProduct) })

      const candidates = Array.from({ length: 20 }, (_, i) =>
        makeProduct({ rating: 5.0 - i * 0.1, sold: 100 - i }),
      )

      mockProductFind.mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(candidates),
      })

      const result = await service.getSimilarProducts(productId)

      expect(result).toHaveLength(12)
    })

    it('caches results with 1-hour TTL', async () => {
      mockProductFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(baseProduct) })

      const candidate = makeProduct({ rating: 4.5, sold: 20 })
      mockProductFind.mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([candidate]),
      })

      await service.getSimilarProducts(productId)

      expect(mockRedisSet).toHaveBeenCalledWith(
        `similar:${productId}`,
        expect.any(String),
        'EX',
        3600,
      )
    })

    it('queries with correct price range (±30%)', async () => {
      const priceProduct = makeProduct({
        _id: new Types.ObjectId(productId),
        price: 100000,
        category: categoryId,
      })
      mockProductFindById.mockReturnValue({ lean: jest.fn().mockResolvedValue(priceProduct) })

      mockProductFind.mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      })

      await service.getSimilarProducts(productId)

      const findCall = mockProductFind.mock.calls[0][0]
      expect(findCall.price.$gte).toBe(70000) // 100000 * 0.7
      expect(findCall.price.$lte).toBe(130000) // 100000 * 1.3
    })
  })

  // ── Task 8.5: Aggregation pipeline logic ──────────────────────────────────

  describe('getBoughtTogether — aggregation pipeline', () => {
    const productId = new Types.ObjectId().toString()

    it('returns empty array when no co-purchased products found', async () => {
      mockOrderAggregate.mockResolvedValue([])

      const result = await service.getBoughtTogether(productId)

      expect(result).toEqual([])
      expect(mockRedisSet).toHaveBeenCalledWith(`bought-together:${productId}`, '[]', 'EX', 86400)
    })

    it('returns cached result without running aggregation', async () => {
      const cached = [makeProduct()]
      mockRedisGet.mockResolvedValue(JSON.stringify(cached))

      const result = await service.getBoughtTogether(productId)

      // Result is JSON-deserialized, so compare serialized form
      expect(JSON.stringify(result)).toBe(JSON.stringify(cached))
      expect(mockOrderAggregate).not.toHaveBeenCalled()
    })

    it('runs aggregation pipeline with correct stages', async () => {
      const coProductId = new Types.ObjectId()
      mockOrderAggregate.mockResolvedValue([{ _id: coProductId, count: 3 }])

      const coProduct = makeProduct({ _id: coProductId })
      mockProductFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([coProduct]) })

      await service.getBoughtTogether(productId)

      expect(mockOrderAggregate).toHaveBeenCalledTimes(1)
      const pipeline = mockOrderAggregate.mock.calls[0][0]

      // Stage 0: $match orders containing the target product
      expect(pipeline[0]).toHaveProperty('$match')
      expect(pipeline[0].$match['items.product']).toBeInstanceOf(Types.ObjectId)
      expect(pipeline[0].$match['items.product'].toString()).toBe(productId)

      // Stage 1: $unwind items
      expect(pipeline[1]).toHaveProperty('$unwind', '$items')

      // Stage 2: $match to exclude the target product
      expect(pipeline[2]).toHaveProperty('$match')
      expect(pipeline[2].$match['items.product'].$ne.toString()).toBe(productId)

      // Stage 3: $group by co-purchased product
      expect(pipeline[3]).toHaveProperty('$group')
      expect(pipeline[3].$group._id).toBe('$items.product')
      expect(pipeline[3].$group.count).toEqual({ $sum: 1 })

      // Stage 4: $sort by count descending
      expect(pipeline[4]).toHaveProperty('$sort', { count: -1 })

      // Stage 5: $limit to 12
      expect(pipeline[5]).toHaveProperty('$limit', 12)
    })

    it('preserves co-occurrence order in results', async () => {
      const id1 = new Types.ObjectId()
      const id2 = new Types.ObjectId()
      const id3 = new Types.ObjectId()

      // Aggregation returns in order: id1 (most), id2, id3 (least)
      mockOrderAggregate.mockResolvedValue([
        { _id: id1, count: 10 },
        { _id: id2, count: 5 },
        { _id: id3, count: 2 },
      ])

      // MongoDB find returns in a different order
      const p1 = makeProduct({ _id: id1, name: 'Most bought' })
      const p2 = makeProduct({ _id: id2, name: 'Mid bought' })
      const p3 = makeProduct({ _id: id3, name: 'Least bought' })
      mockProductFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([p3, p1, p2]) })

      const result = await service.getBoughtTogether(productId)

      // Should be reordered to match aggregation order
      expect(result[0]._id.toString()).toBe(id1.toString())
      expect(result[1]._id.toString()).toBe(id2.toString())
      expect(result[2]._id.toString()).toBe(id3.toString())
    })

    it('caches results with 24-hour TTL', async () => {
      const coProductId = new Types.ObjectId()
      mockOrderAggregate.mockResolvedValue([{ _id: coProductId, count: 1 }])

      const coProduct = makeProduct({ _id: coProductId })
      mockProductFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([coProduct]) })

      await service.getBoughtTogether(productId)

      expect(mockRedisSet).toHaveBeenCalledWith(
        `bought-together:${productId}`,
        expect.any(String),
        'EX',
        86400,
      )
    })

    it('returns empty array for invalid product ID', async () => {
      const result = await service.getBoughtTogether('not-a-valid-objectid')
      expect(result).toEqual([])
      expect(mockOrderAggregate).not.toHaveBeenCalled()
    })
  })

  // ── Task 7.3: Cache invalidation ──────────────────────────────────────────

  describe('invalidateBoughtTogetherCache', () => {
    it('deletes Redis keys for all provided product IDs', async () => {
      mockRedisDel.mockResolvedValue(2)

      const id1 = new Types.ObjectId().toString()
      const id2 = new Types.ObjectId().toString()

      await service.invalidateBoughtTogetherCache([id1, id2])

      expect(mockRedisDel).toHaveBeenCalledWith(`bought-together:${id1}`, `bought-together:${id2}`)
    })

    it('does nothing when given an empty array', async () => {
      await service.invalidateBoughtTogetherCache([])
      expect(mockRedisDel).not.toHaveBeenCalled()
    })
  })
})
