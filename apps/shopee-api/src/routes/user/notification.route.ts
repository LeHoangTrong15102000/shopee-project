import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import * as notificationController from '@controllers/notification.controller'
import { asyncHandler } from '@utils/async-handler'
import {
  validate,
  getNotificationsSchema,
  markAsReadSchema,
  deleteNotificationSchema,
} from '@schemas/index'

export const userNotificationRouter = Router()

// Lấy danh sách thông báo
userNotificationRouter.get(
  '',
  validate(getNotificationsSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(notificationController.getNotifications),
)

// Lấy số thông báo chưa đọc
userNotificationRouter.get(
  '/unread-count',
  authMiddleware.verifyAccessToken,
  asyncHandler(notificationController.getUnreadCount),
)

// Đánh dấu tất cả thông báo đã đọc
userNotificationRouter.put(
  '/read-all',
  authMiddleware.verifyAccessToken,
  asyncHandler(notificationController.markAllAsRead),
)

// Đánh dấu thông báo đã đọc
userNotificationRouter.put(
  '/:id/read',
  validate(markAsReadSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(notificationController.markAsRead),
)

// Xóa thông báo
userNotificationRouter.delete(
  '/:id',
  validate(deleteNotificationSchema),
  authMiddleware.verifyAccessToken,
  asyncHandler(notificationController.deleteNotification),
)
