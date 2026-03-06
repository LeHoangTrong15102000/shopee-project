import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import * as notificationController from '@controllers/notification.controller'
import { asyncHandler } from '@utils/async-handler'
import {
  validate,
  adminCreateNotificationSchema,
  adminBroadcastNotificationSchema,
  adminGetNotificationsSchema,
  adminDeleteNotificationSchema,
} from '@schemas/index'

const adminNotificationRouter = Router()

// Get all notifications (admin)
adminNotificationRouter.get(
  '/',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(adminGetNotificationsSchema),
  asyncHandler(notificationController.adminGetNotifications)
)

// Create targeted notification (admin)
adminNotificationRouter.post(
  '/',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(adminCreateNotificationSchema),
  asyncHandler(notificationController.adminCreateNotification)
)

// Broadcast notification to all users (admin)
adminNotificationRouter.post(
  '/broadcast',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(adminBroadcastNotificationSchema),
  asyncHandler(notificationController.adminBroadcastNotification)
)

// Delete notification (admin)
adminNotificationRouter.delete(
  '/:id',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  validate(adminDeleteNotificationSchema),
  asyncHandler(notificationController.adminDeleteNotification)
)

export default adminNotificationRouter

