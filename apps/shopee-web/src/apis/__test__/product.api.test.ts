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
import productApi from '../product.api'

describe('Product API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getProducts', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { products: [], pagination: {} } } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await productApi.getProducts({ page: 1 })
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      await expect(productApi.getProducts({ page: 1 })).rejects.toThrow('Network error')
    })
  })

  describe('getProductDetail', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1', name: 'Product' } } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await productApi.getProductDetail('1')
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      await expect(productApi.getProductDetail('1')).rejects.toThrow('Network error')
    })
  })

  describe('getSearchSuggestions', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { suggestions: [], products: [] } } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await productApi.getSearchSuggestions({ q: 'test' })
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      await expect(productApi.getSearchSuggestions({ q: 'test' })).rejects.toThrow('Network error')
    })
  })

  describe('getSearchHistory', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: [] } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await productApi.getSearchHistory()
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      await expect(productApi.getSearchHistory()).rejects.toThrow('Network error')
    })
  })

  describe('saveSearchHistory', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { keyword: 'test', saved: true } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await productApi.saveSearchHistory({ keyword: 'test' })
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      await expect(productApi.saveSearchHistory({ keyword: 'test' })).rejects.toThrow(
        'Network error',
      )
    })
  })

  describe('deleteSearchHistory', () => {
    it('should call http.delete on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { deleted_count: 5 } } }
      vi.mocked(http.delete).mockResolvedValue(mockResponse as any)
      const result = await productApi.deleteSearchHistory()
      expect(http.delete).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.delete).mockRejectedValue(new Error('Network error'))
      await expect(productApi.deleteSearchHistory()).rejects.toThrow('Network error')
    })
  })

  describe('deleteSearchHistoryItem', () => {
    it('should call http.delete on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { message: 'deleted' } } }
      vi.mocked(http.delete).mockResolvedValue(mockResponse as any)
      const result = await productApi.deleteSearchHistoryItem('test')
      expect(http.delete).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.delete).mockRejectedValue(new Error('Network error'))
      await expect(productApi.deleteSearchHistoryItem('test')).rejects.toThrow('Network error')
    })
  })
})
