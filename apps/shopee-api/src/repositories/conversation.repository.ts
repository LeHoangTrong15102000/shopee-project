import { Types } from 'mongoose'
import { ConversationModel, CONVERSATION_STATUS } from '@database/models/conversation.model'
import {
  IConversationRepository,
  IConversationItem,
  IConversationListItem,
  IMessageItem,
  CreateConversationDTO,
  UpdateConversationDTO,
  ConversationFilterOptions,
} from './interfaces/conversation.repository.interface'
import { PaginatedResult, PaginationOptions } from './interfaces/base.repository.interface'

export class ConversationRepository implements IConversationRepository {
  async findByUser(
    userId: string | Types.ObjectId,
    filters: ConversationFilterOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<IConversationListItem>> {
    const { page, limit } = pagination
    const skip = (page - 1) * limit

    const filter: Record<string, unknown> = { user: userId }
    if (filters.status) {
      filter.status = filters.status
    }

    const [data, total] = await Promise.all([
      ConversationModel.find(filter)
        .sort({ lastActivity: -1 })
        .skip(skip)
        .limit(limit)
        .select('-messages')
        .lean<IConversationListItem[]>(),
      ConversationModel.countDocuments(filter),
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        page_size: Math.ceil(total / limit) || 1,
        total,
      },
    }
  }

  async findByIdAndUser(
    conversationId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<IConversationItem | null> {
    return ConversationModel.findOne({
      _id: conversationId,
      user: userId,
    }).lean<IConversationItem | null>()
  }

  async create(data: CreateConversationDTO): Promise<IConversationItem> {
    const conversation = new ConversationModel({
      user: data.user,
      title: data.title,
      messages: data.messages,
      status: data.status || CONVERSATION_STATUS.ACTIVE,
      lastActivity: new Date(),
    })
    const saved = await conversation.save()
    return saved.toObject() as IConversationItem
  }

  async addMessages(
    conversationId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    messages: IMessageItem[],
  ): Promise<IConversationItem | null> {
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      user: userId,
    })
    if (!conversation) return null

    conversation.messages.push(...messages)
    conversation.lastActivity = new Date()
    await conversation.save()
    return conversation.toObject() as IConversationItem
  }

  async update(
    conversationId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
    data: UpdateConversationDTO,
  ): Promise<IConversationItem | null> {
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      user: userId,
    })
    if (!conversation) return null

    if (data.title) conversation.title = data.title
    if (data.status) conversation.status = data.status

    await conversation.save()
    return conversation.toObject() as IConversationItem
  }

  async delete(
    conversationId: string | Types.ObjectId,
    userId: string | Types.ObjectId,
  ): Promise<boolean> {
    const result = await ConversationModel.deleteOne({
      _id: conversationId,
      user: userId,
    })
    return result.deletedCount > 0
  }
}
