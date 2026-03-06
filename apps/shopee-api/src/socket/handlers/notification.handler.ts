import { Socket, Server as SocketIOServer } from 'socket.io'
import { SocketEvent, NotificationPayload, SocketErrorPayload, SocketUserData } from '../../@types/socket.type'
import { NotificationModel, NotificationType } from '@database/models/notification.model'
import { SOCKET_CONFIG, SOCKET_ERRORS } from '@constants/socket'
import { Logger } from '@utils/logger'

interface AuthenticatedSocket extends Socket {
  user: SocketUserData
}

/**
 * Register notification event handlers on a socket connection.
 * Handles client-initiated events like marking notifications as read.
 */
export const registerNotificationHandlers = (socket: Socket): void => {
  const authSocket = socket as AuthenticatedSocket

  socket.on(SocketEvent.NOTIFICATION_READ, async (payload: { notification_id: string }) => {
    try {
      if (!payload?.notification_id) {
        const errorPayload: SocketErrorPayload = {
          code: SOCKET_ERRORS.INVALID_PAYLOAD,
          message: 'notification_id is required',
        }
        socket.emit(SocketEvent.ERROR, errorPayload)
        return
      }

      const notification = await NotificationModel.findOne({
        _id: payload.notification_id,
        user: authSocket.user.id,
      })

      if (!notification) {
        const errorPayload: SocketErrorPayload = {
          code: SOCKET_ERRORS.INVALID_PAYLOAD,
          message: 'Notification not found',
        }
        socket.emit(SocketEvent.ERROR, errorPayload)
        return
      }

      await NotificationModel.updateOne({ _id: notification._id }, { is_read: true })

      Logger.apiInfo('Notification marked as read', {
        userId: authSocket.user.id,
        notificationId: payload.notification_id,
      })
    } catch (error) {
      Logger.apiError('Failed to mark notification as read', error)
      const errorPayload: SocketErrorPayload = {
        code: SOCKET_ERRORS.INTERNAL_ERROR,
        message: 'Failed to mark notification as read',
      }
      socket.emit(SocketEvent.ERROR, errorPayload)
    }
  })
}

/**
 * Push a notification to a specific user via Socket.io.
 * Creates the notification in the database and emits it to the user's room.
 */
export const pushNotification = async (
  io: SocketIOServer,
  userId: string,
  notification: {
    title: string
    content: string
    type: NotificationType
    link?: string
  }
): Promise<void> => {
  try {
    const savedNotification = await NotificationModel.create({
      user: userId,
      title: notification.title,
      content: notification.content,
      type: notification.type,
      link: notification.link,
      is_read: false,
    })

    const payload: NotificationPayload = {
      _id: savedNotification._id.toString(),
      title: savedNotification.title,
      content: savedNotification.content,
      type: savedNotification.type,
      link: savedNotification.link,
      created_at: savedNotification.createdAt.toISOString(),
    }

    const userRoom = `${SOCKET_CONFIG.ROOM_PREFIX.USER}${userId}`
    io.to(userRoom).emit(SocketEvent.NOTIFICATION, payload)

    Logger.apiInfo('Notification pushed to user', { userId, notificationId: savedNotification._id })
  } catch (error) {
    Logger.apiError('Failed to push notification', error)
  }
}

/**
 * Send pending (unread) notifications to a user when they connect.
 * Retrieves up to 20 most recent unread notifications.
 */
export const sendPendingNotifications = async (socket: Socket): Promise<void> => {
  const authSocket = socket as AuthenticatedSocket

  try {
    const notifications = await NotificationModel.find({
      user: authSocket.user.id,
      is_read: false,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    for (const notification of notifications) {
      const payload: NotificationPayload = {
        _id: notification._id.toString(),
        title: notification.title,
        content: notification.content,
        type: notification.type,
        link: notification.link,
        created_at: notification.createdAt.toISOString(),
      }
      socket.emit(SocketEvent.NOTIFICATION, payload)
    }

    Logger.apiInfo('Pending notifications sent', {
      userId: authSocket.user.id,
      count: notifications.length,
    })
  } catch (error) {
    Logger.apiError('Failed to send pending notifications', error)
  }
}

/**
 * Broadcast a notification to all connected users via the broadcast:all room.
 * Does NOT persist to DB — caller is responsible for persistence.
 */
export const broadcastToAll = (
  io: SocketIOServer,
  notification: {
    title: string
    content: string
    type: NotificationType
    link?: string
  }
): void => {
  const payload: NotificationPayload = {
    _id: '',
    title: notification.title,
    content: notification.content,
    type: notification.type,
    link: notification.link,
    created_at: new Date().toISOString(),
  }

  io.to(`${SOCKET_CONFIG.ROOM_PREFIX.BROADCAST}all`).emit(SocketEvent.NOTIFICATION, payload)

  Logger.apiInfo('Broadcast notification sent to all users')
}

