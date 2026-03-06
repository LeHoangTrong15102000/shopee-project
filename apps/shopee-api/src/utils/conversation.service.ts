/**
 * Conversation Service - Functions for conversation operations
 *
 * NOTE: File này hiện tại chưa được sử dụng trực tiếp trong ứng dụng.
 * Logic conversation đã được implement trực tiếp trong conversation.controller.ts
 *
 * Tuy nhiên, file này được giữ lại để:
 * 1. Sử dụng trong tương lai khi refactor code
 * 2. Tách biệt business logic khỏi controller (clean architecture)
 * 3. Reuse functions cho các features khác
 *
 * Có thể sử dụng trong tương lai cho:
 * - Background jobs
 * - Batch operations
 * - API optimization
 */

import {
  ConversationModel,
  MESSAGE_ROLE,
  CONVERSATION_STATUS,
} from '../database/models/conversation.model'
import type { MessageRole, ConversationStatus } from '../database/models/conversation.model'
import { ChatMessage } from '../@types/conversation.type'
import { nanoid } from 'nanoid'
import {
  createMessage,
  validateMessageContent,
  validateConversationTitle,
} from './conversation.helper'

interface ConversationFilter {
  user: string
  status?: ConversationStatus
}

/**
 * Service function để tạo conversation mới
 */
export const createNewConversation = async (
  userId: string,
  firstMessage: string,
  title?: string
) => {
  // Validate message
  const messageValidation = validateMessageContent(firstMessage)
  if (!messageValidation.isValid) {
    throw new Error(messageValidation.error || 'Invalid message')
  }

  // Validate title nếu có
  if (title) {
    const titleValidation = validateConversationTitle(title)
    if (!titleValidation.isValid) {
      throw new Error(titleValidation.message)
    }
  }

  // Tạo user message
  const userMessage = createMessage(
    firstMessage.trim(),
    MESSAGE_ROLE.USER,
    nanoid()
  )

  // Tạo conversation
  const conversation = new ConversationModel({
    user: userId,
    title:
      title ||
      firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : ''),
    messages: [userMessage],
    status: CONVERSATION_STATUS.ACTIVE,
    lastActivity: new Date(),
  })

  return await conversation.save()
}

/**
 * Service function để thêm message vào conversation
 */
export const addMessageToConversation = async (
  conversationId: string,
  userId: string,
  messageContent: string,
  role: MessageRole = MESSAGE_ROLE.USER
) => {
  // Validate message
  const messageValidation = validateMessageContent(messageContent)
  if (!messageValidation.isValid) {
    throw new Error(messageValidation.error || 'Invalid message')
  }

  // Tìm conversation
  const conversation = await ConversationModel.findOne({
    _id: conversationId,
    user: userId,
  })

  if (!conversation) {
    throw new Error('Không tìm thấy cuộc trò chuyện')
  }

  // Kiểm tra status
  if (conversation.status === CONVERSATION_STATUS.ARCHIVED) {
    throw new Error('Không thể gửi tin nhắn trong cuộc trò chuyện đã lưu trữ')
  }

  // Tạo message mới
  const newMessage = createMessage(messageContent.trim(), role, nanoid())

  // Thêm message
  conversation.messages.push(newMessage)
  conversation.lastActivity = new Date()

  await conversation.save()
  return { conversation, newMessage }
}

/**
 * Service function để lấy conversations với pagination
 */
export const getConversationsList = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
  status?: ConversationStatus
) => {
  const skip = (page - 1) * limit

  const filter: ConversationFilter = { user: userId }
  if (status) {
    filter.status = status
  }

  // Query conversations
  const conversations = await ConversationModel.find(filter)
    .sort({ lastActivity: -1 })
    .skip(skip)
    .limit(limit)
    .select('-messages') // Không lấy messages để tối ưu
    .lean()

  // Count total
  const total = await ConversationModel.countDocuments(filter)
  const totalPages = Math.ceil(total / limit)

  return {
    conversations,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  }
}

/**
 * Service function để lấy conversation detail
 */
export const getConversationDetail = async (
  conversationId: string,
  userId: string
) => {
  const conversation = await ConversationModel.findOne({
    _id: conversationId,
    user: userId,
  }).lean()

  if (!conversation) {
    throw new Error('Không tìm thấy cuộc trò chuyện')
  }

  return conversation
}

/**
 * Service function để update conversation
 */
export const updateConversationDetails = async (
  conversationId: string,
  userId: string,
  updates: { title?: string; status?: ConversationStatus }
) => {
  // Validate title nếu có
  if (updates.title) {
    const titleValidation = validateConversationTitle(updates.title)
    if (!titleValidation.isValid) {
      throw new Error(titleValidation.message)
    }
  }

  const conversation = await ConversationModel.findOne({
    _id: conversationId,
    user: userId,
  })

  if (!conversation) {
    throw new Error('Không tìm thấy cuộc trò chuyện')
  }

  // Apply updates
  if (updates.title) conversation.title = updates.title
  if (updates.status) conversation.status = updates.status

  return await conversation.save()
}

/**
 * Service function để xóa conversation
 */
export const deleteConversationById = async (
  conversationId: string,
  userId: string
) => {
  const result = await ConversationModel.deleteOne({
    _id: conversationId,
    user: userId,
  })

  if (result.deletedCount === 0) {
    throw new Error('Không tìm thấy cuộc trò chuyện')
  }

  return true
}

/**
 * Service function để lấy conversation messages
 */
export const getConversationMessages = async (
  conversationId: string,
  userId: string
): Promise<ChatMessage[]> => {
  const conversation = await ConversationModel.findOne({
    _id: conversationId,
    user: userId,
  })
    .select('messages')
    .lean()

  if (!conversation) {
    throw new Error('Không tìm thấy cuộc trò chuyện')
  }

  return conversation.messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
  }))
}
