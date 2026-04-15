import { Types } from 'mongoose'
import { IBaseRepository, PaginatedResult, PaginationOptions } from './base.repository.interface'

import type { NotificationType } from '@database/models/notification.model'
export type { NotificationType }
export { NOTIFICATION_TYPE } from '@database/models/notification.model'

/**
 * Notification interface
 */
export interface INotificationItem {
  _id?: Types.ObjectId
  user: Types.ObjectId
  title: string
  content: string
  type: NotificationType
  is_read: boolean
  link?: string
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Notification creation DTO
 */
export interface CreateNotificationDTO {
  user: Types.ObjectId | string
  title: string
  content: string
  type?: NotificationType
  link?: string
}

/**
 * Notification filter options
 */
export interface NotificationFilterOptions {
  type?: NotificationType
  is_read?: boolean
}

/**
 * Notification repository interface
 */
export interface INotificationRepository extends IBaseRepository<
  INotificationItem,
  CreateNotificationDTO,
  Partial<INotificationItem>
> {
  /**
   * Find user's notifications with filters
   */
  findByUser(
    userId: string | Types.ObjectId,
    filters: NotificationFilterOptions,
    pagination: PaginationOptions,
  ): Promise<PaginatedResult<INotificationItem>>

  /**
   * Mark notification as read
   */
  markAsRead(
    userId: string | Types.ObjectId,
    notificationId: string | Types.ObjectId,
  ): Promise<INotificationItem | null>

  /**
   * Mark all user's notifications as read
   */
  markAllAsRead(userId: string | Types.ObjectId): Promise<number>

  /**
   * Count unread notifications
   */
  countUnread(userId: string | Types.ObjectId): Promise<number>

  /**
   * Create notification for user
   */
  createNotification(data: CreateNotificationDTO): Promise<INotificationItem>

  /**
   * Create notifications in bulk (for broadcast)
   */
  createBulkNotifications(data: CreateNotificationDTO[]): Promise<INotificationItem[]>
}
