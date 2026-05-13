import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('src/utils/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
  },
}))

import http from 'src/utils/http'
import wishlistApi from '../wishlist.api'

describe('Wishlist API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getWishlist', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { wishlist: [], pagination: {} } } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await wishlistApi.getWishlist()
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      await expect(wishlistApi.getWishlist()).rejects.toThrow('Network error')
    })
  })

  describe('addToWishlist', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1' } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await wishlistApi.addToWishlist({ product_id: '1' })
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      await expect(wishlistApi.addToWishlist({ product_id: '1' })).rejects.toThrow('Network error')
    })
  })

  describe('removeFromWishlist', () => {
    it('should call http.delete on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { message: 'deleted' } } }
      vi.mocked(http.delete).mockResolvedValue(mockResponse as any)
      const result = await wishlistApi.removeFromWishlist('1')
      expect(http.delete).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.delete).mockRejectedValue(new Error('Network error'))
      await expect(wishlistApi.removeFromWishlist('1')).rejects.toThrow('Network error')
    })
  })

  describe('checkInWishlist', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { in_wishlist: true } } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await wishlistApi.checkInWishlist('1')
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      await expect(wishlistApi.checkInWishlist('1')).rejects.toThrow('Network error')
    })
  })

  describe('clearWishlist', () => {
    it('should call http.delete on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { deleted_count: 5 } } }
      vi.mocked(http.delete).mockResolvedValue(mockResponse as any)
      const result = await wishlistApi.clearWishlist()
      expect(http.delete).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.delete).mockRejectedValue(new Error('Network error'))
      await expect(wishlistApi.clearWishlist()).rejects.toThrow('Network error')
    })
  })

  describe('getWishlistCount', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { count: 5 } } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await wishlistApi.getWishlistCount()
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      await expect(wishlistApi.getWishlistCount()).rejects.toThrow('Network error')
    })
  })
})
