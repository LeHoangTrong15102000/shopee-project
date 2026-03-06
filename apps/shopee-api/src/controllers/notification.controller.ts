import { Request, Response } from 'express'
import { STATUS } from '@constants/status'
import { SOCKET_CONFIG } from '@constants/socket'
import { container } from '../container'
import { NotificationType } from '@repositories/interfaces/notification.repository.interface'
import { UserModel } from '@database/models/user.model'
import { getIO } from '../socket/socket.init'
import { broadcastToAll } from '../socket/handlers/notification.handler'
import { SocketEvent, NotificationPayload } from '../@types/socket.type'

const notificationService = container.services.notification

export const getNotifications = async (req: Request, res: Response) => {
  const user_id = req.jwtDecoded?.id
  const { page = 1, limit = 10, type, is_read } = req.query

  const filters = {
    type: type as NotificationType | undefined,
    is_read: is_read !== undefined ? is_read === 'true' : undefined,
  }

  const result = await notificationService.getNotifications(user_id!, filters, {
    page: Number(page),
    limit: Number(limit),
  })

  res.status(STATUS.OK).json({
    message: 'Lấy danh sách thông báo thành công',
    data: {
      notifications: result.data,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        total_pages: result.pagination.page_size,
      },
    },
  })
}

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  const user_id = req.jwtDecoded?.id
  const notification_id = req.params.id

  const notification = await notificationService.markAsRead(user_id!, notification_id)

  res.status(STATUS.OK).json({
    message: 'Đánh dấu thông báo đã đọc thành công',
    data: notification,
  })
}

export const markAllAsRead = async (req: Request, res: Response) => {
  const user_id = req.jwtDecoded?.id

  const updatedCount = await notificationService.markAllAsRead(user_id!)

  res.status(STATUS.OK).json({
    message: 'Đánh dấu tất cả thông báo đã đọc thành công',
    data: { updated_count: updatedCount },
  })
}

export const getUnreadCount = async (req: Request, res: Response) => {
  const user_id = req.jwtDecoded?.id

  const count = await notificationService.getUnreadCount(user_id!)

  res.status(STATUS.OK).json({
    message: 'Lấy số thông báo chưa đọc thành công',
    data: { count },
  })
}

export const deleteNotification = async (req: Request, res: Response) => {
  const user_id = req.jwtDecoded?.id
  const notification_id = req.params.id

  await notificationService.deleteNotification(user_id!, notification_id)

  res.status(STATUS.OK).json({
    message: 'Xóa thông báo thành công',
  })
}

// --- Admin controllers ---

export const adminCreateNotification = async (req: Request, res: Response) => {
  const { user_id, title, content, type } = req.body

  // Verify user exists
  const userExists = await UserModel.exists({ _id: user_id })
  if (!userExists) {
    res.status(STATUS.NOT_FOUND).json({ message: 'User không tồn tại' })
    return
  }

  const notification = await notificationService.createNotification(user_id, title, content, type)

  // Emit via socket if available (DB already persisted above)
  const io = getIO()
  if (io && notification._id) {
    const payload: NotificationPayload = {
      _id: notification._id.toString(),
      title: notification.title,
      content: notification.content,
      type: notification.type,
      link: notification.link,
      created_at: notification.createdAt?.toISOString() || new Date().toISOString(),
    }
    const userRoom = `${SOCKET_CONFIG.ROOM_PREFIX.USER}${user_id}`
    io.to(userRoom).emit(SocketEvent.NOTIFICATION, payload)
  }

  res.status(STATUS.CREATED).json({
    message: 'Tạo thông báo thành công',
    data: notification,
  })
}

export const adminBroadcastNotification = async (req: Request, res: Response) => {
  const { title, content, type } = req.body

  // Get all user IDs
  const users = await UserModel.find({}).select('_id').lean()
  const userIds = users.map((u) => u._id.toString())

  // Persist for all users
  await notificationService.broadcastNotification(userIds, title, content, type)

  // Broadcast via socket to broadcast:all room
  const io = getIO()
  if (io) {
    broadcastToAll(io, { title, content, type })
  }

  res.status(STATUS.CREATED).json({
    message: 'Broadcast thông báo thành công',
    data: { recipientCount: userIds.length },
  })
}

export const adminGetNotifications = async (req: Request, res: Response) => {
  const { page = 1, limit = 10, type } = req.query

  const filters = {
    type: type as NotificationType | undefined,
  }

  const result = await notificationService.getAdminNotifications(filters, {
    page: Number(page),
    limit: Number(limit),
  })

  res.status(STATUS.OK).json({
    message: 'Lấy danh sách thông báo thành công',
    data: {
      notifications: result.data,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
        total_pages: result.pagination.page_size,
      },
    },
  })
}

export const adminDeleteNotification = async (req: Request, res: Response) => {
  const notification_id = req.params.id

  await notificationService.adminDeleteNotification(notification_id)

  res.status(STATUS.OK).json({
    message: 'Xóa thông báo thành công',
  })
}

