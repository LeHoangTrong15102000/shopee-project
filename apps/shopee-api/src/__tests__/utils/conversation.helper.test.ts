/// <reference types="jest" />

jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'mock-nanoid-id'),
}))

jest.mock('@database/models/conversation.model', () => ({
  MESSAGE_ROLE: { USER: 'user', ASSISTANT: 'assistant' },
}))

import {
  isValidMessageRole,
  validateConversationTitle,
  validateMessageContent,
  formatConversationTitle,
  isConversationActive,
  getLastMessage,
  getMessageStats,
  getContextMessages,
  sanitizeUserInput,
  detectSpamOrInappropriate,
  createMessage,
  convertToChattMessage,
  updateConversationLastActivity,
} from '../../utils/conversation.helper'

describe('conversation.helper', () => {
  describe('isValidMessageRole', () => {
    it('should return true for "user" role', () => {
      expect(isValidMessageRole('user')).toBe(true)
    })

    it('should return true for "assistant" role', () => {
      expect(isValidMessageRole('assistant')).toBe(true)
    })

    it('should return false for "system" role', () => {
      expect(isValidMessageRole('system')).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isValidMessageRole('')).toBe(false)
    })
  })

  describe('validateConversationTitle', () => {
    it('should return invalid for empty string', () => {
      const result = validateConversationTitle('')
      expect(result.isValid).toBe(false)
    })

    it('should return invalid for whitespace only', () => {
      const result = validateConversationTitle('   ')
      expect(result.isValid).toBe(false)
    })

    it('should return invalid for title over 200 characters', () => {
      const longTitle = 'a'.repeat(201)
      const result = validateConversationTitle(longTitle)
      expect(result.isValid).toBe(false)
    })

    it('should return valid for normal title', () => {
      const result = validateConversationTitle('My Conversation')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateMessageContent', () => {
    it('should return invalid for empty string', () => {
      const result = validateMessageContent('')
      expect(result.isValid).toBe(false)
    })

    it('should return invalid for whitespace only', () => {
      const result = validateMessageContent('   ')
      expect(result.isValid).toBe(false)
    })

    it('should return invalid for content over 10000 characters', () => {
      const longContent = 'a'.repeat(10001)
      const result = validateMessageContent(longContent)
      expect(result.isValid).toBe(false)
    })

    it('should return valid for normal content', () => {
      const result = validateMessageContent('Hello, how are you?')
      expect(result.isValid).toBe(true)
    })
  })

  describe('formatConversationTitle', () => {
    it('should return message as-is if 50 chars or less', () => {
      const shortMessage = 'Short message'
      expect(formatConversationTitle(shortMessage)).toBe(shortMessage)
    })

    it('should return message as-is for exactly 50 chars', () => {
      const exactMessage = 'a'.repeat(50)
      expect(formatConversationTitle(exactMessage)).toBe(exactMessage)
    })

    it('should truncate at word boundary with ellipsis for long message', () => {
      const longMessage = 'This is a very long message that should be truncated at word boundary'
      const result = formatConversationTitle(longMessage)
      expect(result.endsWith('...')).toBe(true)
      expect(result.length).toBeLessThanOrEqual(50)
    })

    it('should truncate at 47 chars + ellipsis if no word boundary found after 30 chars', () => {
      const noSpaceMessage = 'a'.repeat(60)
      const result = formatConversationTitle(noSpaceMessage)
      expect(result).toBe('a'.repeat(47) + '...')
    })
  })

  describe('isConversationActive', () => {
    it('should return true for active conversation', () => {
      expect(isConversationActive({ status: 'active' })).toBe(true)
    })

    it('should return false for archived conversation', () => {
      expect(isConversationActive({ status: 'archived' })).toBe(false)
    })

    it('should return false for null conversation', () => {
      expect(isConversationActive(null)).toBeFalsy()
    })
  })

  describe('getLastMessage', () => {
    it('should return last message when messages exist', () => {
      const messages = [
        { id: '1', role: 'user', content: 'First' },
        { id: '2', role: 'assistant', content: 'Last' },
      ]
      const result = getLastMessage({ messages })
      expect(result).toEqual({ id: '2', role: 'assistant', content: 'Last' })
    })

    it('should return null for empty messages array', () => {
      expect(getLastMessage({ messages: [] })).toBe(null)
    })

    it('should return null when no messages property', () => {
      expect(getLastMessage({})).toBe(null)
    })
  })

  describe('getMessageStats', () => {
    it('should count user and assistant messages correctly', () => {
      const conversation = {
        messages: [
          { role: 'user', content: 'Hi' },
          { role: 'assistant', content: 'Hello' },
          { role: 'user', content: 'How are you?' },
        ],
      }
      const result = getMessageStats(conversation)
      expect(result).toEqual({ userMessages: 2, assistantMessages: 1, total: 3 })
    })

    it('should return all zeros when no messages', () => {
      expect(getMessageStats({})).toEqual({ userMessages: 0, assistantMessages: 0, total: 0 })
    })
  })

  describe('getContextMessages', () => {
    it('should return last N messages', () => {
      const messages = Array.from({ length: 30 }, (_, i) => ({
        id: String(i),
        role: 'user',
        content: `Message ${i}`,
      }))
      const result = getContextMessages({ messages }, 10)
      expect(result.length).toBe(10)
      expect(result[0].content).toBe('Message 20')
    })

    it('should default to 20 messages', () => {
      const messages = Array.from({ length: 30 }, (_, i) => ({
        id: String(i),
        role: 'user',
        content: `Message ${i}`,
      }))
      const result = getContextMessages({ messages })
      expect(result.length).toBe(20)
    })

    it('should return empty array for empty messages', () => {
      expect(getContextMessages({ messages: [] })).toEqual([])
    })

    it('should return empty array when no messages property', () => {
      expect(getContextMessages({})).toEqual([])
    })
  })

  describe('sanitizeUserInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeUserInput('  hello  ')).toBe('hello')
    })

    it('should collapse multiple spaces', () => {
      expect(sanitizeUserInput('hello    world')).toBe('hello world')
    })

    it('should remove special characters', () => {
      expect(sanitizeUserInput('hello@#$%world')).toBe('helloworld')
    })

    it('should keep Vietnamese characters', () => {
      expect(sanitizeUserInput('Xin chào bạn')).toBe('Xin chào bạn')
    })
  })

  describe('detectSpamOrInappropriate', () => {
    it('should detect too short messages as spam', () => {
      const result = detectSpamOrInappropriate('a')
      expect(result.isSpam).toBe(true)
    })

    it('should detect only special characters as spam', () => {
      const result = detectSpamOrInappropriate('!@#$%^&*()')
      expect(result.isSpam).toBe(true)
    })

    it('should detect repeated characters as spam', () => {
      const result = detectSpamOrInappropriate('aaaaaaaaaaaaaa')
      expect(result.isSpam).toBe(true)
    })

    it('should not detect normal message as spam', () => {
      const result = detectSpamOrInappropriate('Hello, how are you?')
      expect(result.isSpam).toBe(false)
    })
  })

  describe('createMessage', () => {
    it('should create message with nanoid', () => {
      const result = createMessage('Hello', 'user')
      expect(result.id).toBe('mock-nanoid-id')
      expect(result.role).toBe('user')
      expect(result.content).toBe('Hello')
      expect(result.timestamp).toBeInstanceOf(Date)
    })

    it('should create message with custom id', () => {
      const result = createMessage('Hello', 'assistant', 'custom-id')
      expect(result.id).toBe('custom-id')
    })

    it('should trim content', () => {
      const result = createMessage('  Hello  ', 'user')
      expect(result.content).toBe('Hello')
    })
  })

  describe('convertToChattMessage', () => {
    it('should convert array correctly', () => {
      const messages = [
        { id: '1', role: 'user', content: 'Hi', timestamp: new Date('2024-01-01') },
        { id: '2', role: 'assistant', content: 'Hello', timestamp: new Date('2024-01-02') },
      ]
      const result = convertToChattMessage(messages)
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: '1',
        role: 'user',
        content: 'Hi',
        timestamp: new Date('2024-01-01'),
      })
      expect(result[1]).toEqual({
        id: '2',
        role: 'assistant',
        content: 'Hello',
        timestamp: new Date('2024-01-02'),
      })
    })
  })

  describe('updateConversationLastActivity', () => {
    it('should update lastActivity when messages modified', () => {
      const conversation = {
        isModified: jest.fn().mockReturnValue(true),
        lastActivity: null as Date | null,
      }
      updateConversationLastActivity(conversation as any)
      expect(conversation.lastActivity).toBeInstanceOf(Date)
    })

    it('should not update lastActivity when messages not modified', () => {
      const conversation = {
        isModified: jest.fn().mockReturnValue(false),
        lastActivity: null as Date | null,
      }
      updateConversationLastActivity(conversation as any)
      expect(conversation.lastActivity).toBe(null)
    })
  })
})
