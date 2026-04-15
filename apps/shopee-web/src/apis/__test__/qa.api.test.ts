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
import qaApi from '../qa.api'

describe('QA API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getQuestions', () => {
    it('should call http.get on success', async () => {
      const mockResponse = {
        data: { message: 'ok', data: { questions: [], pagination: {} } },
      }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await qaApi.getQuestions({ product_id: '1' })
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      const result = await qaApi.getQuestions({ product_id: '1' })
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('askQuestion', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1', question: 'test' } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await qaApi.askQuestion({ product_id: '1', question: 'test' })
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      const result = await qaApi.askQuestion({ product_id: '1', question: 'test' })
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('answerQuestion', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1' } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await qaApi.answerQuestion('1', { answer: 'test answer' })
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      const result = await qaApi.answerQuestion('1', { answer: 'test answer' })
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('likeQuestion', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { likes_count: 1 } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await qaApi.likeQuestion('1')
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      const result = await qaApi.likeQuestion('1')
      expect(result.data.message).toEqual(expect.any(String))
    })
  })

  describe('likeAnswer', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { likes_count: 1 } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await qaApi.likeAnswer('1', '2')
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should return fallback data on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      const result = await qaApi.likeAnswer('1', '2')
      expect(result.data.message).toEqual(expect.any(String))
    })
  })
})
