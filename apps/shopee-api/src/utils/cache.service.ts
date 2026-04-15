/**
 * Cache Service - In-memory cache implementation
 * Có thể dễ dàng swap sang Redis sau này bằng cách thay đổi implementation
 */

interface CacheEntry<T> {
  data: T
  expireAt: number
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    // Tự động dọn dẹp cache hết hạn mỗi phút
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60 * 1000)
  }

  /**
   * Lấy data từ cache
   * @param key - Cache key
   * @returns Data hoặc null nếu không tìm thấy hoặc đã hết hạn
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Kiểm tra TTL
    if (Date.now() > entry.expireAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Lưu data vào cache
   * @param key - Cache key
   * @param data - Data cần lưu
   * @param ttlSeconds - Thời gian sống (giây), mặc định 5 phút
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    const expireAt = Date.now() + ttlSeconds * 1000
    this.cache.set(key, { data, expireAt })
  }

  /**
   * Xóa một hoặc nhiều cache entries theo pattern
   * @param pattern - Key hoặc pattern (hỗ trợ wildcard *)
   */
  del(pattern: string): number {
    let deletedCount = 0

    if (pattern.includes('*')) {
      // Xóa theo pattern (wildcard)
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key)
          deletedCount++
        }
      }
    } else {
      // Xóa theo key chính xác
      if (this.cache.delete(pattern)) {
        deletedCount = 1
      }
    }

    return deletedCount
  }

  /**
   * Xóa toàn bộ cache
   */
  flush(): void {
    this.cache.clear()
  }

  /**
   * Dọn dẹp các entries đã hết hạn
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expireAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Lấy số lượng entries trong cache
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Hủy cleanup interval khi không cần thiết
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// Singleton instance
export const cacheService = new CacheService()

// ============ Cache Key Generators ============

export const CacheKeys = {
  /**
   * Key cho danh sách sản phẩm
   * Format: products:list:{page}:{limit}:{category}:{sort_by}:{order}:{rating_filter}:{price_min}:{price_max}:{name}
   */
  productsList: (params: {
    page?: number | string
    limit?: number | string
    category?: string
    sort_by?: string
    order?: string
    rating_filter?: string
    price_min?: string
    price_max?: string
    name?: string
  }): string => {
    const {
      page = 1,
      limit = 30,
      category = '',
      sort_by = '',
      order = '',
      rating_filter = '',
      price_min = '',
      price_max = '',
      name = '',
    } = params
    return `products:list:${page}:${limit}:${category}:${sort_by}:${order}:${rating_filter}:${price_min}:${price_max}:${name}`
  },

  /**
   * Key cho chi tiết sản phẩm
   * Format: products:detail:{id}
   */
  productDetail: (id: string): string => {
    return `products:detail:${id}`
  },

  /**
   * Pattern để xóa tất cả cache products
   */
  productsPattern: (): string => {
    return 'products:*'
  },

  /**
   * Key cho danh sách categories
   * Format: categories:list:{exclude}
   */
  categoriesList: (exclude?: string): string => {
    return `categories:list:${exclude || ''}`
  },

  /**
   * Pattern để xóa tất cả cache categories
   */
  categoriesPattern: (): string => {
    return 'categories:*'
  },
}

// TTL constants (giây)
export const CacheTTL = {
  PRODUCTS_LIST: 5 * 60, // 5 phút
  PRODUCT_DETAIL: 10 * 60, // 10 phút
  CATEGORIES_LIST: 30 * 60, // 30 phút
}

export default cacheService
