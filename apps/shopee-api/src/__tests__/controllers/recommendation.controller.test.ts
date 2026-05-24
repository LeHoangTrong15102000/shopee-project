/// <reference types="jest" />

/**
 * Unit tests for RecommendationController Redis sorted set operations.
 *
 * Task 7.3: Verify ZADD / ZREMRANGEBYRANK / ZREVRANGE calls for
 *           recordView and getRecentlyViewed handlers.
 *
 * Mocks: redisClient, ProductModel, container (RecommendationService).
 */

// ── Mock redisClient ──────────────────────────────────────────────────────────
const mockZadd = jest.fn()
const mockZremrangebyrank = jest.fn()
const mockZrevrange = jest.fn()

jest.mock('@utils/redis.client', () => ({
  redisClient: {
    zadd: jest.fn().mockImplementation((...args: unknown[]) => mockZadd(...args)),
    zremrangebyrank: jest.fn().mockImplementation((...args: unknown[]) => mockZremrangebyrank(...args)),
    zrevrange: jest.fn().mockImplementation((...args: unknown[]) => mockZrevrange(...args)),
  },
}))

// ── Mock ProductModel ─────────────────────────────────────────────────────────
const mockProductFind = jest.fn()

jest.mock('@database/models/product.model', () => ({
  ProductModel: {
    find: jest.fn().mockImplementation((query: unknown) => mockProductFind(query)),
  },
}))

// ── Mock container (RecommendationService) ────────────────────────────────────
jest.mock('../../container', () => ({
  container: {
    services: {
      recommendation: {
        getSimilarProducts: jest.fn().mockResolvedValue([]),
        getBoughtTogether: jest.fn().mockResolvedValue([]),
      },
    },
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
import { Request, Response } from 'express'
import RecommendationController from '../../controllers/recommendation.controller'
import { Types } from 'mongoose'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as unknown as Response
  return res
}

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    params: {},
    query: {},
    body: {},
    jwtDecoded: undefined,
    ...overrides,
  } as unknown as Request
}

const userId = new Types.ObjectId().toString()
const productId = new Types.ObjectId().toString()

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RecommendationController — Redis sorted set operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockZadd.mockResolvedValue(1)
    mockZremrangebyrank.mockResolvedValue(0)
    mockZrevrange.mockResolvedValue([])
  })

  // ── recordView ─────────────────────────────────────────────────────────────

  describe('recordView', () => {
    it('throws 401 when user is not authenticated', async () => {
      const req = makeReq({ params: { id: productId } })
      const res = makeRes()

      await expect(RecommendationController.recordView(req, res)).rejects.toMatchObject({
        status: 401,
      })

      expect(mockZadd).not.toHaveBeenCalled()
    })

    it('calls ZADD with the correct key, score, and product ID', async () => {
      const before = Date.now()
      const req = makeReq({
        params: { id: productId },
        jwtDecoded: { id: userId } as any,
      })
      const res = makeRes()

      await RecommendationController.recordView(req, res)

      expect(mockZadd).toHaveBeenCalledTimes(1)
      const [key, score, member] = mockZadd.mock.calls[0]
      expect(key).toBe(`recently-viewed:${userId}`)
      expect(typeof score).toBe('number')
      expect(score).toBeGreaterThanOrEqual(before)
      expect(member).toBe(productId)
    })

    it('calls ZREMRANGEBYRANK to cap the set at 50 items', async () => {
      const req = makeReq({
        params: { id: productId },
        jwtDecoded: { id: userId } as any,
      })
      const res = makeRes()

      await RecommendationController.recordView(req, res)

      expect(mockZremrangebyrank).toHaveBeenCalledTimes(1)
      const [key, start, stop] = mockZremrangebyrank.mock.calls[0]
      expect(key).toBe(`recently-viewed:${userId}`)
      expect(start).toBe(0)
      // stop = -(cap + 1) = -51 removes all but the top 50
      expect(stop).toBe(-51)
    })

    it('returns 200 success response after recording the view', async () => {
      const req = makeReq({
        params: { id: productId },
        jwtDecoded: { id: userId } as any,
      })
      const res = makeRes()

      await RecommendationController.recordView(req, res)

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) }),
      )
    })
  })

  // ── getRecentlyViewed ──────────────────────────────────────────────────────

  describe('getRecentlyViewed', () => {
    it('throws 401 when user is not authenticated', async () => {
      const req = makeReq()
      const res = makeRes()

      await expect(RecommendationController.getRecentlyViewed(req, res)).rejects.toMatchObject({
        status: 401,
      })

      expect(mockZrevrange).not.toHaveBeenCalled()
    })

    it('calls ZREVRANGE with the correct key to get newest-first IDs', async () => {
      mockZrevrange.mockResolvedValue([])
      const req = makeReq({ jwtDecoded: { id: userId } as any })
      const res = makeRes()

      await RecommendationController.getRecentlyViewed(req, res)

      expect(mockZrevrange).toHaveBeenCalledWith(`recently-viewed:${userId}`, 0, -1)
    })

    it('returns empty array when no products have been viewed', async () => {
      mockZrevrange.mockResolvedValue([])
      const req = makeReq({ jwtDecoded: { id: userId } as any })
      const res = makeRes()

      await RecommendationController.getRecentlyViewed(req, res)

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({ data: [] }),
      )
      expect(mockProductFind).not.toHaveBeenCalled()
    })

    it('batch-fetches products from MongoDB and preserves Redis order', async () => {
      const id1 = new Types.ObjectId().toString()
      const id2 = new Types.ObjectId().toString()
      const id3 = new Types.ObjectId().toString()

      // Redis returns newest-first: id3, id1, id2
      mockZrevrange.mockResolvedValue([id3, id1, id2])

      const p1 = { _id: { toString: () => id1 }, name: 'P1' }
      const p2 = { _id: { toString: () => id2 }, name: 'P2' }
      const p3 = { _id: { toString: () => id3 }, name: 'P3' }

      // MongoDB returns in a different order
      mockProductFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([p1, p2, p3]) })

      const req = makeReq({ jwtDecoded: { id: userId } as any })
      const res = makeRes()

      await RecommendationController.getRecentlyViewed(req, res)

      const responseCall = (res.send as jest.Mock).mock.calls[0][0]
      const data = responseCall.data
      // Should be in Redis order: p3, p1, p2
      expect(data[0].name).toBe('P3')
      expect(data[1].name).toBe('P1')
      expect(data[2].name).toBe('P2')
    })

    it('omits products that no longer exist in MongoDB', async () => {
      const existingId = new Types.ObjectId().toString()
      const deletedId = new Types.ObjectId().toString()

      mockZrevrange.mockResolvedValue([existingId, deletedId])

      const existingProduct = { _id: { toString: () => existingId }, name: 'Existing' }
      // deletedId is not returned by MongoDB (product was deleted)
      mockProductFind.mockReturnValue({ lean: jest.fn().mockResolvedValue([existingProduct]) })

      const req = makeReq({ jwtDecoded: { id: userId } as any })
      const res = makeRes()

      await RecommendationController.getRecentlyViewed(req, res)

      const responseCall = (res.send as jest.Mock).mock.calls[0][0]
      expect(responseCall.data).toHaveLength(1)
      expect(responseCall.data[0].name).toBe('Existing')
    })
  })
})
