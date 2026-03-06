import { Document } from 'mongoose'
import {
  IConversation,
  MESSAGE_ROLE,
} from '../database/models/conversation.model'
import type { MessageRole } from '../database/models/conversation.model'
import { ChatMessage } from '../@types/conversation.type'
import { nanoid } from 'nanoid'

/**
 * Helper function để update lastActivity khi có message mới
 * Có thể tái sử dụng cho các middleware khác
 */
export function updateConversationLastActivity(
  conversation: Document & IConversation
): void {
  if (conversation.isModified('messages')) {
    conversation.lastActivity = new Date()
  }
}

/**
 * Helper function để validate message role
 */
export function isValidMessageRole(role: string): role is MessageRole {
  return Object.values(MESSAGE_ROLE).includes(role as MessageRole)
}

/**
 * Helper function để convert mongoose message sang ChatMessage
 */
export function convertToChattMessage(messages: any[]): ChatMessage[] {
  return messages.map((msg) => ({
    id: msg.id,
    role: msg.role as MessageRole,
    content: msg.content,
    timestamp: msg.timestamp,
  }))
}

/**
 * Tạo message object với cấu trúc chuẩn
 */
export const createMessage = (
  content: string,
  role: MessageRole,
  customId?: string
): ChatMessage => {
  return {
    id: customId || nanoid(),
    role,
    content: content.trim(),
    timestamp: new Date(),
  }
}

/**
 * Helper function để validate conversation title
 */
export function validateConversationTitle(title: string): {
  isValid: boolean
  message?: string
} {
  if (!title || title.trim().length === 0) {
    return {
      isValid: false,
      message: 'Tiêu đề conversation không được để trống',
    }
  }

  if (title.length > 200) {
    return {
      isValid: false,
      message: 'Tiêu đề conversation không được quá 200 ký tự',
    }
  }

  return { isValid: true }
}

/**
 * Validate message content
 */
export const validateMessageContent = (
  content: string
): { isValid: boolean; error?: string } => {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: 'Tin nhắn không được để trống' }
  }

  if (content.length > 10000) {
    return { isValid: false, error: 'Tin nhắn không được quá 10000 ký tự' }
  }

  return { isValid: true }
}

/**
 * Format conversation title từ message đầu tiên
 */
export const formatConversationTitle = (firstMessage: string): string => {
  const cleanMessage = firstMessage.trim()

  if (cleanMessage.length <= 50) {
    return cleanMessage
  }

  // Cắt tại từ gần nhất với 50 ký tự
  const truncated = cleanMessage.substring(0, 47)
  const lastSpaceIndex = truncated.lastIndexOf(' ')

  if (lastSpaceIndex > 30) {
    return truncated.substring(0, lastSpaceIndex) + '...'
  }

  return truncated + '...'
}

/**
 * Kiểm tra xem conversation có đang active không
 */
export const isConversationActive = (conversation: any): boolean => {
  return conversation && conversation.status === 'active'
}

/**
 * Lấy message cuối cùng từ conversation
 */
export const getLastMessage = (conversation: any): ChatMessage | null => {
  if (!conversation.messages || conversation.messages.length === 0) {
    return null
  }

  return conversation.messages[conversation.messages.length - 1]
}

/**
 * Đếm số lượng messages của user và assistant
 */
export const getMessageStats = (
  conversation: any
): { userMessages: number; assistantMessages: number; total: number } => {
  if (!conversation.messages) {
    return { userMessages: 0, assistantMessages: 0, total: 0 }
  }

  const userMessages = conversation.messages.filter(
    (msg: ChatMessage) => msg.role === MESSAGE_ROLE.USER
  ).length
  const assistantMessages = conversation.messages.filter(
    (msg: ChatMessage) => msg.role === MESSAGE_ROLE.ASSISTANT
  ).length

  return {
    userMessages,
    assistantMessages,
    total: conversation.messages.length,
  }
}

/**
 * Lấy context messages để gửi cho AI (giới hạn số lượng)
 */
export const getContextMessages = (
  conversation: any,
  maxMessages: number = 20
): ChatMessage[] => {
  if (!conversation.messages || conversation.messages.length === 0) {
    return []
  }

  // Lấy messages gần nhất
  const recentMessages = conversation.messages.slice(-maxMessages)
  return recentMessages
}

/**
 * Làm sạch và chuẩn hóa text input từ user
 */
export const sanitizeUserInput = (input: string): string => {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Thay thế multiple spaces thành single space
    .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF.,!?;:()\-'"]/g, '') // Chỉ giữ lại ký tự cần thiết và tiếng Việt
}

/**
 * Kiểm tra spam hoặc tin nhắn không phù hợp
 */
export const detectSpamOrInappropriate = (
  message: string
): { isSpam: boolean; reason?: string } => {
  const lowerMessage = message.toLowerCase()

  // Kiểm tra tin nhắn quá ngắn và không có ý nghĩa
  if (message.trim().length < 2) {
    return { isSpam: true, reason: 'Tin nhắn quá ngắn' }
  }

  // Kiểm tra tin nhắn chỉ có ký tự đặc biệt
  if (!/[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\d]/.test(message)) {
    return { isSpam: true, reason: 'Tin nhắn chỉ chứa ký tự đặc biệt' }
  }

  // Kiểm tra lặp lại ký tự
  if (/(.)\1{10,}/.test(message)) {
    return { isSpam: true, reason: 'Tin nhắn lặp lại ký tự' }
  }

  return { isSpam: false }
}
