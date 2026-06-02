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
import chatbotApi from '../chatbot.api'

describe('Chatbot API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getConversations', () => {
    it('should call http.get on success', async () => {
      const mockResponse = {
        data: { message: 'ok', data: { conversations: [], pagination: {} } },
      }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await chatbotApi.getConversations()
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      await expect(chatbotApi.getConversations()).rejects.toThrow('Network error')
    })
  })

  describe('getConversation', () => {
    it('should call http.get on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1', messages: [] } } }
      vi.mocked(http.get).mockResolvedValue(mockResponse as any)
      const result = await chatbotApi.getConversation('1')
      expect(http.get).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.get).mockRejectedValue(new Error('Network error'))
      await expect(chatbotApi.getConversation('1')).rejects.toThrow('Network error')
    })
  })

  describe('createConversation', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { conversationId: '1' } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await chatbotApi.createConversation({ message: 'Hello' })
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      await expect(chatbotApi.createConversation({ message: 'Hello' })).rejects.toThrow(
        'Network error',
      )
    })
  })

  describe('sendMessage', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { conversationId: '1' } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await chatbotApi.sendMessage('1', { message: 'Hi' })
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      await expect(chatbotApi.sendMessage('1', { message: 'Hi' })).rejects.toThrow('Network error')
    })
  })

  describe('updateConversation', () => {
    it('should call http.put on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { _id: '1' } } }
      vi.mocked(http.put).mockResolvedValue(mockResponse as any)
      const result = await chatbotApi.updateConversation('1', { title: 'New Title' })
      expect(http.put).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.put).mockRejectedValue(new Error('Network error'))
      await expect(chatbotApi.updateConversation('1', { title: 'New Title' })).rejects.toThrow(
        'Network error',
      )
    })
  })

  describe('deleteConversation', () => {
    it('should call http.delete on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { message: 'deleted' } } }
      vi.mocked(http.delete).mockResolvedValue(mockResponse as any)
      const result = await chatbotApi.deleteConversation('1')
      expect(http.delete).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.delete).mockRejectedValue(new Error('Network error'))
      await expect(chatbotApi.deleteConversation('1')).rejects.toThrow('Network error')
    })
  })

  describe('testChatbot', () => {
    it('should call http.post on success', async () => {
      const mockResponse = { data: { message: 'ok', data: { userMessage: 'test' } } }
      vi.mocked(http.post).mockResolvedValue(mockResponse as any)
      const result = await chatbotApi.testChatbot({ message: 'test' })
      expect(http.post).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should throw on error', async () => {
      vi.mocked(http.post).mockRejectedValue(new Error('Network error'))
      await expect(chatbotApi.testChatbot({ message: 'test' })).rejects.toThrow('Network error')
    })
  })
})
