/**
 * Cache Middleware - Middleware để cache API responses
 */

import { Request, Response, NextFunction } from 'express'
import { cacheService, CacheKeys, CacheTTL } from '@utils/cache.service'

/**
 * Middleware cache response cho API
 * @param keyGenerator - Hàm tạo cache key từ request
 * @param ttlSeconds - Thời gian sống của cache (giây)
 */
export const cacheResponse = (
  keyGenerator: (req: Request) => string,
  ttlSeconds: number
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Chỉ cache GET requests
    if (req.method !== 'GET') {
      return next()
    }

    const cacheKey = keyGenerator(req)
    const cachedData = cacheService.get(cacheKey)

    if (cachedData) {
      // Trả về data từ cache
      res.setHeader('X-Cache', 'HIT')
      res.json(cachedData)
      return
    }

    // Lưu reference của json method gốc
    const originalJson = res.json.bind(res)

    // Override json method để cache response
    res.json = (data: any): Response => {
      // Chỉ cache response thành công (status 2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheService.set(cacheKey, data, ttlSeconds)
      }
      res.setHeader('X-Cache', 'MISS')
      return originalJson(data)
    }

    next()
  }
}

/**
 * Middleware invalidate cache khi data thay đổi
 * @param patterns - Các pattern cache cần xóa
 */
export const invalidateCache = (...patterns: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Lưu reference của json method gốc
    const originalJson = res.json.bind(res)

    // Override json method để invalidate cache sau khi response thành công
    res.json = (data: any): Response => {
      // Chỉ invalidate khi response thành công
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach((pattern) => {
          cacheService.del(pattern)
        })
      }
      return originalJson(data)
    }

    next()
  }
}

/**
 * Middleware invalidate cache cho products
 * Xóa tất cả cache liên quan đến products
 */
export const invalidateProductsCache = () => {
  return invalidateCache(CacheKeys.productsPattern())
}

/**
 * Middleware invalidate cache cho categories
 * Xóa tất cả cache liên quan đến categories
 */
export const invalidateCategoriesCache = () => {
  return invalidateCache(CacheKeys.categoriesPattern())
}

/**
 * Middleware invalidate cache cho cả products và categories
 * Dùng khi thay đổi category có thể ảnh hưởng đến products
 */
export const invalidateProductsAndCategoriesCache = () => {
  return invalidateCache(
    CacheKeys.productsPattern(),
    CacheKeys.categoriesPattern()
  )
}

// Pre-configured cache middlewares cho các routes phổ biến

/**
 * Cache middleware cho danh sách sản phẩm (TTL: 5 phút)
 */
export const cacheProductsList = cacheResponse(
  (req: Request) => CacheKeys.productsList(req.query as any),
  CacheTTL.PRODUCTS_LIST
)

/**
 * Cache middleware cho chi tiết sản phẩm (TTL: 10 phút)
 */
export const cacheProductDetail = cacheResponse(
  (req: Request) => CacheKeys.productDetail(req.params.product_id as string),
  CacheTTL.PRODUCT_DETAIL
)

/**
 * Cache middleware cho danh sách categories (TTL: 30 phút)
 */
export const cacheCategoriesList = cacheResponse(
  (req: Request) => CacheKeys.categoriesList(req.query.exclude as string),
  CacheTTL.CATEGORIES_LIST
)

export default {
  cacheResponse,
  invalidateCache,
  invalidateProductsCache,
  invalidateCategoriesCache,
  invalidateProductsAndCategoriesCache,
  cacheProductsList,
  cacheProductDetail,
  cacheCategoriesList,
}

