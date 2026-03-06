import { Types } from 'mongoose'
import { nanoid } from 'nanoid'
import {
  IConversationRepository,
  IConversationItem,
  IConversationListItem,
  IMessageItem,
  ConversationFilterOptions,
  MESSAGE_ROLE,
  CONVERSATION_STATUS,
} from '@repositories/interfaces/conversation.repository.interface'
import type { ConversationStatus } from '@repositories/interfaces/conversation.repository.interface'
import { PaginatedResult, PaginationOptions } from '@repositories/interfaces/base.repository.interface'
import { BaseService, NotFoundError, ValidationError, BusinessError } from './base.service'
import { chatBotService } from '@utils/chatbot.service'

export class ConversationService extends BaseService {
  constructor(private readonly conversationRepository: IConversationRepository) {
    super()
  }

  async getConversations(
    userId: string,
    filters: ConversationFilterOptions,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<IConversationListItem>> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    return this.conversationRepository.findByUser(userId, filters, this.normalizePagination(pagination))
  }

  async getConversation(userId: string, conversationId: string): Promise<IConversationItem> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!this.isValidObjectId(conversationId)) {
      throw new ValidationError('Invalid conversation ID format')
    }

    const conversation = await this.conversationRepository.findByIdAndUser(conversationId, userId)
    if (!conversation) {
      throw new NotFoundError('Conversation', conversationId)
    }
    return conversation
  }

  async createConversation(
    userId: string,
    message: string,
    title?: string
  ): Promise<{ conversation: IConversationItem; aiMessage: IMessageItem }> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!message || message.trim().length === 0) {
      throw new ValidationError('Tin nhắn không được để trống')
    }

    const userMessage: IMessageItem = {
      id: nanoid(),
      role: MESSAGE_ROLE.USER,
      content: message.trim(),
      timestamp: new Date(),
    }

    const aiResponseText = await chatBotService.generateResponse([], message)
    const aiMessage: IMessageItem = {
      id: nanoid(),
      role: MESSAGE_ROLE.ASSISTANT,
      content: aiResponseText,
      timestamp: new Date(),
    }

    const conversationTitle = title || (await chatBotService.generateConversationTitle(message))

    const conversation = await this.conversationRepository.create({
      user: new Types.ObjectId(userId),
      title: conversationTitle,
      messages: [userMessage, aiMessage],
      status: CONVERSATION_STATUS.ACTIVE,
    })

    return { conversation, aiMessage }
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    message: string
  ): Promise<{ conversation: IConversationItem; aiMessage: IMessageItem }> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!this.isValidObjectId(conversationId)) {
      throw new ValidationError('Invalid conversation ID format')
    }
    if (!message || message.trim().length === 0) {
      throw new ValidationError('Tin nhắn không được để trống')
    }

    const existing = await this.conversationRepository.findByIdAndUser(conversationId, userId)
    if (!existing) {
      throw new NotFoundError('Conversation', conversationId)
    }
    if (existing.status === CONVERSATION_STATUS.ARCHIVED) {
      throw new BusinessError('Không thể gửi tin nhắn trong cuộc trò chuyện đã lưu trữ')
    }

    const userMessage: IMessageItem = {
      id: nanoid(),
      role: MESSAGE_ROLE.USER,
      content: message.trim(),
      timestamp: new Date(),
    }

    const aiResponseText = await chatBotService.generateResponse(existing.messages, message)
    const aiMessage: IMessageItem = {
      id: nanoid(),
      role: MESSAGE_ROLE.ASSISTANT,
      content: aiResponseText,
      timestamp: new Date(),
    }

    const conversation = await this.conversationRepository.addMessages(conversationId, userId, [userMessage, aiMessage])
    return { conversation: conversation!, aiMessage }
  }

  async updateConversation(
    userId: string,
    conversationId: string,
    data: { title?: string; status?: ConversationStatus }
  ): Promise<IConversationItem> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!this.isValidObjectId(conversationId)) {
      throw new ValidationError('Invalid conversation ID format')
    }

    const conversation = await this.conversationRepository.update(conversationId, userId, data)
    if (!conversation) {
      throw new NotFoundError('Conversation', conversationId)
    }
    return conversation
  }

  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!this.isValidObjectId(conversationId)) {
      throw new ValidationError('Invalid conversation ID format')
    }

    const deleted = await this.conversationRepository.delete(conversationId, userId)
    if (!deleted) {
      throw new NotFoundError('Conversation', conversationId)
    }
  }

  async testChatbot(message: string): Promise<string> {
    if (!message) {
      throw new ValidationError('Tin nhắn test không được để trống')
    }
    return chatBotService.generateResponse([], message)
  }
}

