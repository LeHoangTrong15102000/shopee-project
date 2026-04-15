/// <reference types="jest" />
import {
  createConversationSchema,
  sendMessageSchema,
  updateConversationSchema,
  getConversationsSchema,
  testChatbotSchema,
  conversationIdParamSchema,
} from '@schemas/conversation.schema'

const VALID_ID = '507f1f77bcf86cd799439011'

describe('Conversation Schemas', () => {
  describe('createConversationSchema', () => {
    it('should pass with valid input', () => {
      const result = createConversationSchema.safeParse({
        body: { message: 'Hello', title: 'Test' },
      })
      expect(result.success).toBe(true)
    })

    it('should fail when message is missing', () => {
      const result = createConversationSchema.safeParse({ body: { title: 'Test' } })
      expect(result.success).toBe(false)
    })

    it('should fail when message is empty', () => {
      const result = createConversationSchema.safeParse({ body: { message: '' } })
      expect(result.success).toBe(false)
    })

    it('should fail when message is too long (>10000)', () => {
      const result = createConversationSchema.safeParse({ body: { message: 'a'.repeat(10001) } })
      expect(result.success).toBe(false)
    })

    it('should fail when title is too long (>200)', () => {
      const result = createConversationSchema.safeParse({
        body: { message: 'Hello', title: 'a'.repeat(201) },
      })
      expect(result.success).toBe(false)
    })

    it('should pass when title is omitted', () => {
      const result = createConversationSchema.safeParse({ body: { message: 'Hello' } })
      expect(result.success).toBe(true)
    })
  })

  describe('sendMessageSchema', () => {
    it('should pass with valid input', () => {
      const result = sendMessageSchema.safeParse({ body: { message: 'Hello' } })
      expect(result.success).toBe(true)
    })

    it('should fail when message is empty', () => {
      const result = sendMessageSchema.safeParse({ body: { message: '' } })
      expect(result.success).toBe(false)
    })
  })

  describe('updateConversationSchema', () => {
    it('should pass with empty body (all optional)', () => {
      const result = updateConversationSchema.safeParse({ body: {} })
      expect(result.success).toBe(true)
    })

    it('should pass with valid title', () => {
      const result = updateConversationSchema.safeParse({ body: { title: 'New Title' } })
      expect(result.success).toBe(true)
    })

    it('should pass with valid status', () => {
      const result = updateConversationSchema.safeParse({ body: { status: 'archived' } })
      expect(result.success).toBe(true)
    })
  })

  describe('getConversationsSchema', () => {
    it('should pass with valid query', () => {
      const result = getConversationsSchema.safeParse({ query: { page: 1, limit: 10 } })
      expect(result.success).toBe(true)
    })

    it('should fail when page is 0', () => {
      const result = getConversationsSchema.safeParse({ query: { page: 0 } })
      expect(result.success).toBe(false)
    })

    it('should fail when limit is 0', () => {
      const result = getConversationsSchema.safeParse({ query: { limit: 0 } })
      expect(result.success).toBe(false)
    })

    it('should fail when limit is 101', () => {
      const result = getConversationsSchema.safeParse({ query: { limit: 101 } })
      expect(result.success).toBe(false)
    })
  })

  describe('testChatbotSchema', () => {
    it('should pass with valid input', () => {
      const result = testChatbotSchema.safeParse({ body: { message: 'Test message' } })
      expect(result.success).toBe(true)
    })

    it('should fail when message is empty', () => {
      const result = testChatbotSchema.safeParse({ body: { message: '' } })
      expect(result.success).toBe(false)
    })

    it('should fail when message is too long (>1000)', () => {
      const result = testChatbotSchema.safeParse({ body: { message: 'a'.repeat(1001) } })
      expect(result.success).toBe(false)
    })
  })

  describe('conversationIdParamSchema', () => {
    it('should pass with valid MongoDB ID', () => {
      const result = conversationIdParamSchema.safeParse({ params: { id: VALID_ID } })
      expect(result.success).toBe(true)
    })

    it('should fail with invalid ID', () => {
      const result = conversationIdParamSchema.safeParse({ params: { id: 'invalid-id' } })
      expect(result.success).toBe(false)
    })
  })
})
