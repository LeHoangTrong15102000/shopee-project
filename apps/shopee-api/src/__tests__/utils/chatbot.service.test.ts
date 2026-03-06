/// <reference types="jest" />

// Mock Anthropic SDK - MUST be before imports
const mockCreate = jest.fn()
const mockStream = jest.fn()

jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
      stream: mockStream,
    },
  }))
})

// Mock conversation model
jest.mock('@database/models/conversation.model', () => ({
  MESSAGE_ROLE: { USER: 'user', ASSISTANT: 'assistant' },
}))

// Mock conversation helper
jest.mock('../../utils/conversation.helper', () => ({
  createMessage: jest.fn((content: string, role: string) => ({
    id: 'test-id',
    role,
    content: content.trim(),
    timestamp: new Date(),
  })),
}))

// Set API key before import to avoid warning
process.env.ANTHROPIC_API_KEY = 'test-key'

import {
  generateChatResponse,
  generateStreamingChatResponse,
  generateConversationTitle,
  chatBotService,
} from '../../utils/chatbot.service'

describe('chatbot.service', () => {
  const mockMessages = [
    { id: '1', role: 'user' as const, content: 'Hello', timestamp: new Date() },
    { id: '2', role: 'assistant' as const, content: 'Hi there!', timestamp: new Date() },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = 'test-key'
  })

  describe('generateChatResponse', () => {
    it('should return fallback response when no API key', async () => {
      delete process.env.ANTHROPIC_API_KEY

      const result = await generateChatResponse([], 'xin chào')

      expect(result).toContain('trợ lý ảo')
      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('should return text from API response on success', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Xin chào! Tôi có thể giúp gì?' }],
      })

      const result = await generateChatResponse(mockMessages, 'Tôi cần hỗ trợ')

      expect(result).toBe('Xin chào! Tôi có thể giúp gì?')
      expect(mockCreate).toHaveBeenCalledTimes(1)
    })

    it('should return quota fallback on 429 error', async () => {
      const quotaError = new Error('quota exceeded') as Error & { status?: number }
      quotaError.status = 429
      mockCreate.mockRejectedValueOnce(quotaError)

      const result = await generateChatResponse([], 'test message')

      expect(result).toContain('hết quota')
    })

    it('should return auth fallback on 401 error', async () => {
      const authError = new Error('authentication failed') as Error & { status?: number }
      authError.status = 401
      mockCreate.mockRejectedValueOnce(authError)

      const result = await generateChatResponse([], 'test message')

      expect(result).toContain('xác thực')
    })

    it('should return general fallback on other errors', async () => {
      mockCreate.mockRejectedValueOnce(new Error('Network error'))

      const result = await generateChatResponse([], 'test message')

      expect(result).toContain('bảo trì')
    })

    it('should return product-related fallback for product queries', async () => {
      delete process.env.ANTHROPIC_API_KEY

      const result = await generateChatResponse([], 'Tôi muốn mua sản phẩm')

      expect(result).toContain('sản phẩm')
    })

    it('should return order-related fallback for order queries', async () => {
      delete process.env.ANTHROPIC_API_KEY

      const result = await generateChatResponse([], 'Kiểm tra đơn hàng của tôi')

      expect(result).toContain('đơn hàng')
    })
  })

  describe('generateStreamingChatResponse', () => {
    it('should simulate streaming with fallback when no API key', async () => {
      delete process.env.ANTHROPIC_API_KEY
      jest.useFakeTimers()

      const onChunk = jest.fn()
      const onComplete = jest.fn()
      const onError = jest.fn()

      await generateStreamingChatResponse([], 'xin chào', onChunk, onComplete, onError)

      jest.runAllTimers()

      expect(onChunk).toHaveBeenCalled()
      expect(onComplete).toHaveBeenCalled()
      expect(onError).not.toHaveBeenCalled()
      expect(mockStream).not.toHaveBeenCalled()

      jest.useRealTimers()
    })

    it('should call onChunk for each text event on successful stream', async () => {
      const mockStreamInstance = {
        on: jest.fn((event: string, callback: Function) => {
          if (event === 'text') {
            callback('Hello ')
            callback('World!')
          }
          if (event === 'end') {
            callback()
          }
        }),
      }
      mockStream.mockResolvedValueOnce(mockStreamInstance)

      const onChunk = jest.fn()
      const onComplete = jest.fn()
      const onError = jest.fn()

      await generateStreamingChatResponse(mockMessages, 'test', onChunk, onComplete, onError)

      expect(onChunk).toHaveBeenCalledWith('Hello ')
      expect(onChunk).toHaveBeenCalledWith('World!')
      expect(onComplete).toHaveBeenCalled()
    })

    it('should call onError when stream emits error', async () => {
      const mockStreamInstance = {
        on: jest.fn((event: string, callback: Function) => {
          if (event === 'error') {
            callback(new Error('Stream failed'))
          }
        }),
      }
      mockStream.mockResolvedValueOnce(mockStreamInstance)

      const onChunk = jest.fn()
      const onComplete = jest.fn()
      const onError = jest.fn()

      await generateStreamingChatResponse(mockMessages, 'test', onChunk, onComplete, onError)

      expect(onError).toHaveBeenCalledWith('Stream failed')
    })

    it('should call onError with quota message on 429 error', async () => {
      const quotaError = new Error('quota exceeded') as Error & { status?: number }
      quotaError.status = 429
      mockStream.mockRejectedValueOnce(quotaError)

      const onChunk = jest.fn()
      const onComplete = jest.fn()
      const onError = jest.fn()

      await generateStreamingChatResponse([], 'test', onChunk, onComplete, onError)

      expect(onError).toHaveBeenCalledWith('Quota limit reached')
    })

    it('should call onError with auth message on 401 error', async () => {
      const authError = new Error('auth failed') as Error & { status?: number }
      authError.status = 401
      mockStream.mockRejectedValueOnce(authError)

      const onChunk = jest.fn()
      const onComplete = jest.fn()
      const onError = jest.fn()

      await generateStreamingChatResponse([], 'test', onChunk, onComplete, onError)

      expect(onError).toHaveBeenCalledWith('Authentication failed')
    })
  })

  describe('generateConversationTitle', () => {
    it('should return message as-is when <= 50 chars', async () => {
      const shortMessage = 'Hello world'

      const result = await generateConversationTitle(shortMessage)

      expect(result).toBe(shortMessage)
      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('should truncate to 50 chars + "..." when no API key', async () => {
      delete process.env.ANTHROPIC_API_KEY
      const longMessage = 'A'.repeat(60)

      const result = await generateConversationTitle(longMessage)

      expect(result).toBe('A'.repeat(50) + '...')
      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('should call API and return title for long message with API key', async () => {
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'Generated Title' }],
      })
      const longMessage = 'This is a very long message that exceeds fifty characters limit'

      const result = await generateConversationTitle(longMessage)

      expect(result).toBe('Generated Title')
      expect(mockCreate).toHaveBeenCalledTimes(1)
    })

    it('should truncate on API error', async () => {
      mockCreate.mockRejectedValueOnce(new Error('API Error'))
      const longMessage = 'B'.repeat(60)

      const result = await generateConversationTitle(longMessage)

      expect(result).toBe('B'.repeat(50) + '...')
    })
  })

  describe('chatBotService', () => {
    it('should have generateResponse method', () => {
      expect(chatBotService.generateResponse).toBe(generateChatResponse)
    })

    it('should have generateStreamingResponse method', () => {
      expect(chatBotService.generateStreamingResponse).toBe(generateStreamingChatResponse)
    })

    it('should have generateConversationTitle method', () => {
      expect(chatBotService.generateConversationTitle).toBe(generateConversationTitle)
    })
  })
})

