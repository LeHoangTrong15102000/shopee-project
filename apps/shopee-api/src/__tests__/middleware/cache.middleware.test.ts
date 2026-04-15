/// <reference types="jest" />

jest.mock('@utils/cache.service', () => {
  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }
  return {
    cacheService: mockCacheService,
    CacheKeys: {
      productsList: jest.fn((params) => `products:list:${params.page || 1}`),
      productDetail: jest.fn((id) => `products:detail:${id}`),
      productsPattern: jest.fn(() => 'products:*'),
      categoriesList: jest.fn((exclude) => `categories:list:${exclude || ''}`),
      categoriesPattern: jest.fn(() => 'categories:*'),
    },
    CacheTTL: {
      PRODUCTS_LIST: 300,
      PRODUCT_DETAIL: 600,
      CATEGORIES_LIST: 1800,
    },
  }
})

import { Request } from 'express'
import {
  cacheResponse,
  invalidateCache,
  invalidateProductsCache,
  invalidateCategoriesCache,
  invalidateProductsAndCategoriesCache,
  cacheProductsList,
  cacheProductDetail,
  cacheCategoriesList,
} from '@middleware/cache.middleware'
import { cacheService, CacheKeys, CacheTTL } from '@utils/cache.service'

const createMockReq = (overrides: any = {}) =>
  ({
    method: 'GET',
    query: {},
    params: {},
    ...overrides,
  }) as any

const createMockRes = () => {
  const res: any = {
    statusCode: 200,
  }
  res.json = jest.fn().mockReturnValue(res)
  res.setHeader = jest.fn().mockReturnValue(res)
  return res
}

describe('Cache Middleware', () => {
  let mockNext: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockNext = jest.fn()
  })

  describe('cacheResponse', () => {
    const keyGenerator = (req: Request) => `test:${req.query.id || 'default'}`
    const ttl = 300

    describe('cache miss', () => {
      it('should call next() on cache miss', () => {
        ;(cacheService.get as jest.Mock).mockReturnValue(null)
        const middleware = cacheResponse(keyGenerator, ttl)
        const req = createMockReq({ query: { id: '123' } })
        const res = createMockRes()

        middleware(req, res, mockNext)

        expect(mockNext).toHaveBeenCalled()
      })

      it('should override res.json and set X-Cache=MISS header', () => {
        ;(cacheService.get as jest.Mock).mockReturnValue(null)
        const middleware = cacheResponse(keyGenerator, ttl)
        const req = createMockReq({ query: { id: '123' } })
        const res = createMockRes()
        const originalJson = res.json

        middleware(req, res, mockNext)

        expect(res.json).not.toBe(originalJson)

        const responseData = { message: 'test' }
        res.json(responseData)

        expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS')
      })

      it('should cache 2xx responses', () => {
        ;(cacheService.get as jest.Mock).mockReturnValue(null)
        const middleware = cacheResponse(keyGenerator, ttl)
        const req = createMockReq({ query: { id: '123' } })
        const res = createMockRes()
        res.statusCode = 200

        middleware(req, res, mockNext)

        const responseData = { message: 'success' }
        res.json(responseData)

        expect(cacheService.set).toHaveBeenCalledWith('test:123', responseData, ttl)
      })

      it('should not cache 4xx responses', () => {
        ;(cacheService.get as jest.Mock).mockReturnValue(null)
        const middleware = cacheResponse(keyGenerator, ttl)
        const req = createMockReq({ query: { id: '123' } })
        const res = createMockRes()
        res.statusCode = 400

        middleware(req, res, mockNext)

        const responseData = { error: 'Bad request' }
        res.json(responseData)

        expect(cacheService.set).not.toHaveBeenCalled()
      })

      it('should not cache 5xx responses', () => {
        ;(cacheService.get as jest.Mock).mockReturnValue(null)
        const middleware = cacheResponse(keyGenerator, ttl)
        const req = createMockReq({ query: { id: '123' } })
        const res = createMockRes()
        res.statusCode = 500

        middleware(req, res, mockNext)

        const responseData = { error: 'Server error' }
        res.json(responseData)

        expect(cacheService.set).not.toHaveBeenCalled()
      })
    })

    describe('cache hit', () => {
      it('should return cached data and set X-Cache=HIT header', () => {
        const cachedData = { message: 'cached' }
        ;(cacheService.get as jest.Mock).mockReturnValue(cachedData)
        const middleware = cacheResponse(keyGenerator, ttl)
        const req = createMockReq({ query: { id: '123' } })
        const res = createMockRes()

        middleware(req, res, mockNext)

        expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT')
        expect(res.json).toHaveBeenCalledWith(cachedData)
      })

      it('should NOT call next() on cache hit', () => {
        const cachedData = { message: 'cached' }
        ;(cacheService.get as jest.Mock).mockReturnValue(cachedData)
        const middleware = cacheResponse(keyGenerator, ttl)
        const req = createMockReq({ query: { id: '123' } })
        const res = createMockRes()

        middleware(req, res, mockNext)

        expect(mockNext).not.toHaveBeenCalled()
      })
    })

    describe('non-GET requests', () => {
      it('should call next() directly for POST requests without caching', () => {
        const middleware = cacheResponse(keyGenerator, ttl)
        const req = createMockReq({ method: 'POST' })
        const res = createMockRes()

        middleware(req, res, mockNext)

        expect(mockNext).toHaveBeenCalled()
        expect(cacheService.get).not.toHaveBeenCalled()
      })

      it('should call next() directly for PUT requests without caching', () => {
        const middleware = cacheResponse(keyGenerator, ttl)
        const req = createMockReq({ method: 'PUT' })
        const res = createMockRes()

        middleware(req, res, mockNext)

        expect(mockNext).toHaveBeenCalled()
        expect(cacheService.get).not.toHaveBeenCalled()
      })

      it('should call next() directly for DELETE requests without caching', () => {
        const middleware = cacheResponse(keyGenerator, ttl)
        const req = createMockReq({ method: 'DELETE' })
        const res = createMockRes()

        middleware(req, res, mockNext)

        expect(mockNext).toHaveBeenCalled()
        expect(cacheService.get).not.toHaveBeenCalled()
      })

      it('should call next() directly for PATCH requests without caching', () => {
        const middleware = cacheResponse(keyGenerator, ttl)
        const req = createMockReq({ method: 'PATCH' })
        const res = createMockRes()

        middleware(req, res, mockNext)

        expect(mockNext).toHaveBeenCalled()
        expect(cacheService.get).not.toHaveBeenCalled()
      })
    })
  })

  describe('invalidateCache', () => {
    it('should call next()', () => {
      const middleware = invalidateCache('pattern:*')
      const req = createMockReq()
      const res = createMockRes()

      middleware(req, res, mockNext)

      expect(mockNext).toHaveBeenCalled()
    })

    it('should delete specified patterns on successful response (2xx)', () => {
      const middleware = invalidateCache('pattern1:*', 'pattern2:*')
      const req = createMockReq()
      const res = createMockRes()
      res.statusCode = 200

      middleware(req, res, mockNext)
      res.json({ success: true })

      expect(cacheService.del).toHaveBeenCalledWith('pattern1:*')
      expect(cacheService.del).toHaveBeenCalledWith('pattern2:*')
      expect(cacheService.del).toHaveBeenCalledTimes(2)
    })

    it('should delete patterns on 201 response', () => {
      const middleware = invalidateCache('pattern:*')
      const req = createMockReq()
      const res = createMockRes()
      res.statusCode = 201

      middleware(req, res, mockNext)
      res.json({ created: true })

      expect(cacheService.del).toHaveBeenCalledWith('pattern:*')
    })

    it('should NOT delete patterns on 4xx error response', () => {
      const middleware = invalidateCache('pattern:*')
      const req = createMockReq()
      const res = createMockRes()
      res.statusCode = 400

      middleware(req, res, mockNext)
      res.json({ error: 'Bad request' })

      expect(cacheService.del).not.toHaveBeenCalled()
    })

    it('should NOT delete patterns on 5xx error response', () => {
      const middleware = invalidateCache('pattern:*')
      const req = createMockReq()
      const res = createMockRes()
      res.statusCode = 500

      middleware(req, res, mockNext)
      res.json({ error: 'Server error' })

      expect(cacheService.del).not.toHaveBeenCalled()
    })
  })

  describe('invalidateProductsCache', () => {
    it('should return a middleware function', () => {
      const middleware = invalidateProductsCache()
      expect(typeof middleware).toBe('function')
    })

    it('should invalidate products pattern on successful response', () => {
      const middleware = invalidateProductsCache()
      const req = createMockReq()
      const res = createMockRes()
      res.statusCode = 200

      middleware(req, res, mockNext)
      res.json({ success: true })

      expect(cacheService.del).toHaveBeenCalledWith('products:*')
    })
  })

  describe('invalidateCategoriesCache', () => {
    it('should return a middleware function', () => {
      const middleware = invalidateCategoriesCache()
      expect(typeof middleware).toBe('function')
    })

    it('should invalidate categories pattern on successful response', () => {
      const middleware = invalidateCategoriesCache()
      const req = createMockReq()
      const res = createMockRes()
      res.statusCode = 200

      middleware(req, res, mockNext)
      res.json({ success: true })

      expect(cacheService.del).toHaveBeenCalledWith('categories:*')
    })
  })

  describe('invalidateProductsAndCategoriesCache', () => {
    it('should return a middleware function', () => {
      const middleware = invalidateProductsAndCategoriesCache()
      expect(typeof middleware).toBe('function')
    })

    it('should invalidate both products and categories patterns on successful response', () => {
      const middleware = invalidateProductsAndCategoriesCache()
      const req = createMockReq()
      const res = createMockRes()
      res.statusCode = 200

      middleware(req, res, mockNext)
      res.json({ success: true })

      expect(cacheService.del).toHaveBeenCalledWith('products:*')
      expect(cacheService.del).toHaveBeenCalledWith('categories:*')
      expect(cacheService.del).toHaveBeenCalledTimes(2)
    })
  })

  describe('Pre-configured middlewares', () => {
    describe('cacheProductsList', () => {
      it('should be a function (middleware)', () => {
        expect(typeof cacheProductsList).toBe('function')
      })

      it('should use correct TTL (5 minutes = 300 seconds)', () => {
        ;(cacheService.get as jest.Mock).mockReturnValue(null)
        const req = createMockReq({ query: { page: 1 } })
        const res = createMockRes()
        res.statusCode = 200

        cacheProductsList(req, res, mockNext)
        res.json({ products: [] })

        expect(cacheService.set).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          CacheTTL.PRODUCTS_LIST,
        )
      })
    })

    describe('cacheProductDetail', () => {
      it('should be a function (middleware)', () => {
        expect(typeof cacheProductDetail).toBe('function')
      })

      it('should use correct TTL (10 minutes = 600 seconds)', () => {
        ;(cacheService.get as jest.Mock).mockReturnValue(null)
        const req = createMockReq({ params: { product_id: 'abc123' } })
        const res = createMockRes()
        res.statusCode = 200

        cacheProductDetail(req, res, mockNext)
        res.json({ product: {} })

        expect(cacheService.set).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          CacheTTL.PRODUCT_DETAIL,
        )
      })
    })

    describe('cacheCategoriesList', () => {
      it('should be a function (middleware)', () => {
        expect(typeof cacheCategoriesList).toBe('function')
      })

      it('should use correct TTL (30 minutes = 1800 seconds)', () => {
        ;(cacheService.get as jest.Mock).mockReturnValue(null)
        const req = createMockReq({ query: {} })
        const res = createMockRes()
        res.statusCode = 200

        cacheCategoriesList(req, res, mockNext)
        res.json({ categories: [] })

        expect(cacheService.set).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          CacheTTL.CATEGORIES_LIST,
        )
      })
    })
  })
})
