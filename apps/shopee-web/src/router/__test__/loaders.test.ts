import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import {
  productDetailLoader,
  productListLoader,
  homeLoader,
  cartLoader,
  userProfileLoader,
  errorLoader,
  createSmartLoader,
} from '../loaders'

// Mock API modules
vi.mock('src/apis/product.api', () => ({
  default: {
    getProductDetail: vi.fn(),
    getProducts: vi.fn(),
  },
}))

vi.mock('src/apis/category.api', () => ({
  default: {
    getCategories: vi.fn(),
  },
}))

vi.mock('src/apis/purchases.api', () => ({
  default: {
    getPurchases: vi.fn(),
  },
}))

vi.mock('src/apis/user.api', () => ({
  default: {
    getProfile: vi.fn(),
  },
}))

describe('Loaders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    }
  })

  describe('productDetailLoader', () => {
    it('should prefetch product detail', async () => {
      const productApi = (await import('src/apis/product.api')).default
      ;(productApi.getProductDetail as any).mockResolvedValue({
        data: { _id: '123', name: 'Test Product' },
      })

      const result = await productDetailLoader({
        params: { productId: '123' },
        request: new Request('http://localhost/product/123'),
      } as any)

      expect(result).toBeInstanceOf(QueryClient)
      expect(productApi.getProductDetail).toHaveBeenCalledWith('123', expect.any(Object))
    })

    it('should handle product not found gracefully', async () => {
      const productApi = (await import('src/apis/product.api')).default
      ;(productApi.getProductDetail as any).mockRejectedValue({
        response: { status: 404 },
      })

      const result = await productDetailLoader({
        params: { productId: '999' },
        request: new Request('http://localhost/product/999'),
      } as any)

      expect(result).toBeInstanceOf(QueryClient)
    })

    it('should prefetch categories', async () => {
      const productApi = (await import('src/apis/product.api')).default
      const categoryApi = (await import('src/apis/category.api')).default
      ;(productApi.getProductDetail as any).mockResolvedValue({ data: {} })
      ;(categoryApi.getCategories as any).mockResolvedValue({ data: [] })

      await productDetailLoader({
        params: { productId: '123' },
        request: new Request('http://localhost/product/123'),
      } as any)

      expect(categoryApi.getCategories).toHaveBeenCalled()
    })

    it('should skip reviews prefetch when includeReviews=false', async () => {
      const productApi = (await import('src/apis/product.api')).default
      ;(productApi.getProductDetail as any).mockResolvedValue({ data: {} })

      const result = await productDetailLoader({
        params: { productId: '123' },
        request: new Request('http://localhost/product/123?includeReviews=false'),
      } as any)

      expect(result).toBeInstanceOf(QueryClient)
    })
  })

  describe('productListLoader', () => {
    it('should prefetch product list with search params', async () => {
      const productApi = (await import('src/apis/product.api')).default
      ;(productApi.getProducts as any).mockResolvedValue({ data: [] })

      const result = await productListLoader({
        request: new Request('http://localhost/products?page=1&limit=20'),
      } as any)

      expect(result).toBeInstanceOf(QueryClient)
      expect(productApi.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ page: '1', limit: '20' }),
        expect.any(Object),
      )
    })

    it('should prefetch categories', async () => {
      const productApi = (await import('src/apis/product.api')).default
      const categoryApi = (await import('src/apis/category.api')).default
      ;(productApi.getProducts as any).mockResolvedValue({ data: [] })
      ;(categoryApi.getCategories as any).mockResolvedValue({ data: [] })

      await productListLoader({
        request: new Request('http://localhost/products'),
      } as any)

      expect(categoryApi.getCategories).toHaveBeenCalled()
    })

    it('should handle errors gracefully', async () => {
      const productApi = (await import('src/apis/product.api')).default
      ;(productApi.getProducts as any).mockRejectedValue(new Error('Network error'))

      const result = await productListLoader({
        request: new Request('http://localhost/products'),
      } as any)

      expect(result).toBeInstanceOf(QueryClient)
    })
  })

  describe('homeLoader', () => {
    it('should prefetch trending products', async () => {
      const productApi = (await import('src/apis/product.api')).default
      ;(productApi.getProducts as any).mockResolvedValue({ data: [] })

      const result = await homeLoader({} as any)

      expect(result).toBeInstanceOf(QueryClient)
      expect(productApi.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ sort_by: 'sold', order: 'desc' }),
        expect.any(Object),
      )
    })

    it('should prefetch new products', async () => {
      const productApi = (await import('src/apis/product.api')).default
      ;(productApi.getProducts as any).mockResolvedValue({ data: [] })

      await homeLoader({} as any)

      expect(productApi.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ sort_by: 'createdAt' }),
        expect.any(Object),
      )
    })

    it('should prefetch featured categories', async () => {
      const categoryApi = (await import('src/apis/category.api')).default
      ;(categoryApi.getCategories as any).mockResolvedValue({ data: [] })

      await homeLoader({} as any)

      expect(categoryApi.getCategories).toHaveBeenCalled()
    })
  })

  describe('cartLoader', () => {
    it('should prefetch cart when user is logged in', async () => {
      ;(global.localStorage.getItem as any).mockReturnValue('mock-token')
      const purchasesApi = (await import('src/apis/purchases.api')).default
      ;(purchasesApi.getPurchases as any).mockResolvedValue({ data: [] })

      const result = await cartLoader({} as any)

      expect(result).toBeInstanceOf(QueryClient)
      expect(purchasesApi.getPurchases).toHaveBeenCalled()
    })

    it('should prefetch user profile when logged in', async () => {
      ;(global.localStorage.getItem as any).mockReturnValue('mock-token')
      const userApi = (await import('src/apis/user.api')).default
      ;(userApi.getProfile as any).mockResolvedValue({ data: {} })

      await cartLoader({} as any)

      expect(userApi.getProfile).toHaveBeenCalled()
    })

    it('should not prefetch when user is not logged in', async () => {
      ;(global.localStorage.getItem as any).mockReturnValue(null)
      const purchasesApi = (await import('src/apis/purchases.api')).default

      const result = await cartLoader({} as any)

      expect(result).toBeInstanceOf(QueryClient)
      expect(purchasesApi.getPurchases).not.toHaveBeenCalled()
    })
  })

  describe('userProfileLoader', () => {
    it('should handle unauthenticated user', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)

      try {
        await userProfileLoader({} as any)
      } catch (e) {
        expect(e).toBeInstanceOf(Response)
      }

      vi.restoreAllMocks()
    })

    it('should prefetch user profile when logged in', async () => {
      ;(global.localStorage.getItem as any).mockReturnValue('mock-token')
      const userApi = (await import('src/apis/user.api')).default
      ;(userApi.getProfile as any).mockResolvedValue({ data: {} })

      const result = await userProfileLoader({} as any)

      expect(result).toBeInstanceOf(QueryClient)
      expect(userApi.getProfile).toHaveBeenCalled()
    })

    it('should prefetch purchase history', async () => {
      ;(global.localStorage.getItem as any).mockReturnValue('mock-token')
      const purchasesApi = (await import('src/apis/purchases.api')).default
      ;(purchasesApi.getPurchases as any).mockResolvedValue({ data: [] })

      await userProfileLoader({} as any)

      expect(purchasesApi.getPurchases).toHaveBeenCalled()
    })
  })

  describe('errorLoader', () => {
    it('should return null', async () => {
      const result = await errorLoader({ params: {} } as any)
      expect(result).toBeNull()
    })

    it('should log error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      await errorLoader({ params: { error: 'test' } } as any)
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('createSmartLoader', () => {
    it('should wrap base loader', async () => {
      const baseLoader = vi.fn().mockResolvedValue(new QueryClient())
      const smartLoader = createSmartLoader(baseLoader)

      const result = await smartLoader({} as any)

      expect(baseLoader).toHaveBeenCalled()
      expect(result).toBeInstanceOf(QueryClient)
    })

    it('should prefetch related data when shouldPrefetchRelated is true', async () => {
      const productApi = (await import('src/apis/product.api')).default
      ;(productApi.getProducts as any).mockResolvedValue({ data: [] })

      const baseLoader = vi.fn().mockResolvedValue(new QueryClient())
      const smartLoader = createSmartLoader(baseLoader, {
        shouldPrefetchRelated: true,
        priorityLevel: 'high',
      })

      await smartLoader({} as any)

      expect(productApi.getProducts).toHaveBeenCalled()
    })

    it('should respect maxPrefetchItems option', async () => {
      const productApi = (await import('src/apis/product.api')).default
      ;(productApi.getProducts as any).mockResolvedValue({ data: [] })

      const baseLoader = vi.fn().mockResolvedValue(new QueryClient())
      const smartLoader = createSmartLoader(baseLoader, {
        shouldPrefetchRelated: true,
        priorityLevel: 'high',
        maxPrefetchItems: 10,
      })

      await smartLoader({} as any)

      expect(productApi.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ limit: '10' }),
        expect.any(Object),
      )
    })

    it('should not prefetch when shouldPrefetchRelated is false', async () => {
      const productApi = (await import('src/apis/product.api')).default
      const baseLoader = vi.fn().mockResolvedValue(new QueryClient())
      const smartLoader = createSmartLoader(baseLoader, {
        shouldPrefetchRelated: false,
      })

      await smartLoader({} as any)

      expect(productApi.getProducts).not.toHaveBeenCalled()
    })

    it('should not prefetch when priority is medium or low', async () => {
      const productApi = (await import('src/apis/product.api')).default
      const baseLoader = vi.fn().mockResolvedValue(new QueryClient())
      const smartLoader = createSmartLoader(baseLoader, {
        shouldPrefetchRelated: true,
        priorityLevel: 'medium',
      })

      await smartLoader({} as any)

      expect(productApi.getProducts).not.toHaveBeenCalled()
    })
  })
})
