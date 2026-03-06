import { Types, FilterQuery, QueryOptions, UpdateQuery } from 'mongoose'
import { NotificationModel, INotification } from '@database/models/notification.model'
import {
  INotificationRepository,
  INotificationItem,
  CreateNotificationDTO,
  NotificationFilterOptions,
} from './interfaces/notification.repository.interface'
import { PaginatedResult, PaginationOptions } from './interfaces/base.repository.interface'

export class NotificationRepository implements INotificationRepository {
  async findById(id: string | Types.ObjectId): Promise<INotificationItem | null> {
    return NotificationModel.findById(id).lean<INotificationItem | null>()
  }

  async findOne(filter: FilterQuery<INotification>): Promise<INotificationItem | null> {
    return NotificationModel.findOne(filter).lean<INotificationItem | null>()
  }

  async find(filter: FilterQuery<INotification>, options?: QueryOptions): Promise<INotificationItem[]> {
    return NotificationModel.find(filter, null, options).lean<INotificationItem[]>()
  }

  async findPaginated(
    filter: FilterQuery<INotification>,
    options: PaginationOptions
  ): Promise<PaginatedResult<INotificationItem>> {
    const { page, limit, sort } = options
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      NotificationModel.find(filter)
        .sort(sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<INotificationItem[]>(),
      NotificationModel.countDocuments(filter),
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

  async create(data: CreateNotificationDTO): Promise<INotificationItem> {
    const notification = new NotificationModel(data)
    const saved = await notification.save()
    return saved.toObject() as INotificationItem
  }

  async updateById(id: string | Types.ObjectId, data: Partial<INotificationItem>): Promise<INotificationItem | null> {
    return NotificationModel.findByIdAndUpdate(id, data, { new: true }).lean<INotificationItem | null>()
  }

  async updateMany(filter: FilterQuery<INotification>, data: UpdateQuery<INotification>): Promise<number> {
    const result = await NotificationModel.updateMany(filter, data)
    return result.modifiedCount
  }

  async deleteById(id: string | Types.ObjectId): Promise<INotificationItem | null> {
    return NotificationModel.findByIdAndDelete(id).lean<INotificationItem | null>()
  }

  async deleteMany(filter: FilterQuery<INotification>): Promise<number> {
    const result = await NotificationModel.deleteMany(filter)
    return result.deletedCount
  }

  async count(filter: FilterQuery<INotification>): Promise<number> {
    return NotificationModel.countDocuments(filter)
  }

  async exists(filter: FilterQuery<INotification>): Promise<boolean> {
    const doc = await NotificationModel.exists(filter)
    return doc !== null
  }

  async findByUser(
    userId: string | Types.ObjectId,
    filters: NotificationFilterOptions,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<INotificationItem>> {
    const filter: FilterQuery<INotification> = { user: new Types.ObjectId(userId.toString()) }
    
    if (filters.type) {
      filter.type = filters.type
    }
    if (filters.is_read !== undefined) {
      filter.is_read = filters.is_read
    }

    return this.findPaginated(filter, pagination)
  }

  async markAsRead(userId: string | Types.ObjectId, notificationId: string | Types.ObjectId): Promise<INotificationItem | null> {
    return NotificationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(notificationId.toString()),
        user: new Types.ObjectId(userId.toString()),
      },
      { is_read: true },
      { new: true }
    ).lean<INotificationItem | null>()
  }

  async markAllAsRead(userId: string | Types.ObjectId): Promise<number> {
    const result = await NotificationModel.updateMany(
      { user: new Types.ObjectId(userId.toString()), is_read: false },
      { is_read: true }
    )
    return result.modifiedCount
  }

  async countUnread(userId: string | Types.ObjectId): Promise<number> {
    return NotificationModel.countDocuments({
      user: new Types.ObjectId(userId.toString()),
      is_read: false,
    })
  }

  async createNotification(data: CreateNotificationDTO): Promise<INotificationItem> {
    return this.create(data)
  }

  async createBulkNotifications(data: CreateNotificationDTO[]): Promise<INotificationItem[]> {
    if (data.length === 0) return []
    const docs = await NotificationModel.insertMany(data)
    return docs.map((doc) => doc.toObject() as INotificationItem)
  }
}

