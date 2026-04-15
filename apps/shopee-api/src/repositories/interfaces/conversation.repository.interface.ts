import { Types } from 'mongoose'
import { PaginatedResult, PaginationOptions } from './base.repository.interface'

import type { MessageRole, ConversationStatus } from '@database/models/conversation.model'
export type { MessageRole, ConversationStatus }
export { MESSAGE_ROLE, CONVERSATION_STATUS } from '@database/models/conversation.model'

/**
 * Message interface
 */
export interface IMessageItem {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
}

/**
 * Conversation interface
 */
export interface IConversationItem {
  _id?: Types.ObjectId
  user: Types.ObjectId
  title: string
  messages: IMessageItem[]
  status: ConversationStatus
  lastActivity: Date
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Conversation list item (without messages)
 */
export interface IConversationListItem {
  _id?: Types.ObjectId
  user: Types.ObjectId
  title: string
  status: ConversationStatus
  lastActivity: Date
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Create conversation DTO
 */
export interface CreateConversationDTO {
  user: string | Types.ObjectId
  title: string
  messages: IMessageItem[]
  status?: ConversationStatus
}

/**
 * Update conversation DTO
 */
export interface UpdateConversationDTO {
  title?: string
  status?: ConversationStatus
}

/**
 * Conversation filter options
 */
export interface ConversationFilterOptions {
  status?: ConversationStatus
}

/**
 * Conversation repository interface
 */
export interface IConversationRepository {
  findByUser(
    userId: string | Types.ObjectId,
    filters: ConversationFilterOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IConversationListItem>>

  findByIdAndUser(
    conversationId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<IConversationItem | null>

  create(data: CreateConversationDTO): Promise<IConversationItem>

  addMessages(
    conversationId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    messages: IMessageItem[],
  ): Promise<IConversationItem | null>

  update(
    conversationId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    data: UpdateConversationDTO,
  ): Promise<IConversationItem | null>

  delete(conversationId: string | Types.ObjectId, userId: string | Types.ObjectId): Promise<boolean>
}
