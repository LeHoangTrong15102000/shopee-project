import { Types } from 'mongoose'
import {
  INotificationRepository,
  INotificationItem,
  CreateNotificationDTO,
  NotificationFilterOptions,
  NotificationType,
} from '@repositories/interfaces/notification.repository.interface'
import { PaginatedResult, PaginationOptions } from '@repositories/interfaces/base.repository.interface'
import { BaseService, NotFoundError, ValidationError } from './base.service'

export class NotificationService extends BaseService {
  constructor(private readonly notificationRepository: INotificationRepository) {
    super()
  }

  async getNotifications(
    userId: string,
    filters: NotificationFilterOptions,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<INotificationItem>> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    return this.notificationRepository.findByUser(userId, filters, this.normalizePagination(pagination))
  }

  async markAsRead(userId: string, notificationId: string): Promise<INotificationItem> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!this.isValidObjectId(notificationId)) {
      throw new ValidationError('Invalid notification ID format')
    }

    const notification = await this.notificationRepository.markAsRead(userId, notificationId)
    if (!notification) {
      throw new NotFoundError('Notification', notificationId)
    }
    return notification
  }

  async markAllAsRead(userId: string): Promise<number> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    return this.notificationRepository.markAllAsRead(userId)
  }

  async getUnreadCount(userId: string): Promise<number> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    return this.notificationRepository.countUnread(userId)
  }

  async createNotification(
    userId: string,
    title: string,
    content: string,
    type: NotificationType = 'other',
    link?: string
  ): Promise<INotificationItem> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }

    return this.notificationRepository.createNotification({
      user: new Types.ObjectId(userId),
      title,
      content,
      type,
      link,
    })
  }

  async deleteNotification(userId: string, notificationId: string): Promise<INotificationItem> {
    if (!this.isValidObjectId(userId)) {
      throw new ValidationError('Invalid user ID format')
    }
    if (!this.isValidObjectId(notificationId)) {
      throw new ValidationError('Invalid notification ID format')
    }

    const notification = await this.notificationRepository.findById(notificationId)
    if (!notification || notification.user.toString() !== userId) {
      throw new NotFoundError('Notification', notificationId)
    }

    const deleted = await this.notificationRepository.deleteById(notificationId)
    if (!deleted) {
      throw new NotFoundError('Notification', notificationId)
    }
    return deleted
  }

  async adminDeleteNotification(notificationId: string): Promise<INotificationItem> {
    if (!this.isValidObjectId(notificationId)) {
      throw new ValidationError('Invalid notification ID format')
    }

    const deleted = await this.notificationRepository.deleteById(notificationId)
    if (!deleted) {
      throw new NotFoundError('Notification', notificationId)
    }
    return deleted
  }

  async getAdminNotifications(
    filters: NotificationFilterOptions,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<INotificationItem>> {
    const filter: Record<string, unknown> = {}
    if (filters.type) filter.type = filters.type

    return this.notificationRepository.findPaginated(filter, this.normalizePagination(pagination))
  }

  async broadcastNotification(
    userIds: string[],
    title: string,
    content: string,
    type: NotificationType
  ): Promise<INotificationItem[]> {
    if (userIds.length === 0) return []

    const dtos: CreateNotificationDTO[] = userIds.map((uid) => ({
      user: new Types.ObjectId(uid),
      title,
      content,
      type,
    }))

    return this.notificationRepository.createBulkNotifications(dtos)
  }
}

