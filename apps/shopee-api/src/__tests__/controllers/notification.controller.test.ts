/// <reference types="jest" />
import { Request, Response } from 'express'

jest.mock('../../container', () => ({
  container: {
    services: {
      notification: {
        getNotifications: jest.fn(),
        markAsRead: jest.fn(),
        markAllAsRead: jest.fn(),
        getUnreadCount: jest.fn(),
        deleteNotification: jest.fn(),
        createNotification: jest.fn(),
        broadcastNotification: jest.fn(),
        getAdminNotifications: jest.fn(),
        adminDeleteNotification: jest.fn(),
      },
    },
  },
}))

jest.mock('@database/models/user.model', () => ({
  UserModel: {
    exists: jest.fn(),
    find: jest.fn(),
  },
}))

jest.mock('../../socket/socket.init', () => ({
  getIO: jest.fn().mockReturnValue(null),
}))

jest.mock('../../socket/handlers/notification.handler', () => ({
  broadcastToAll: jest.fn(),
}))

import { container } from '../../container'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  adminCreateNotification,
  adminBroadcastNotification,
  adminGetNotifications,
  adminDeleteNotification,
} from '../../controllers/notification.controller'
import { UserModel } from '@database/models/user.model'

const mockNotificationService = container.services.notification as jest.Mocked<
  typeof container.services.notification
>

const createMockRequest = (options: any = {}): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
  headers: options.headers || {},
  jwtDecoded: options.jwtDecoded || {
    id: 'user123',
    email: 'test@test.com',
    roles: ['User'],
    created_at: '2024-01-01',
  },
})

const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  return res
}

describe('Notification Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getNotifications', () => {
    it('should return notifications with default pagination', async () => {
      const mockResult = {
        data: [
          {
            _id: 'notif1',
            user: 'user123',
            title: 'Test Title',
            content: 'Test notification',
            type: 'order',
            is_read: false,
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, page_size: 1 },
      }
      mockNotificationService.getNotifications.mockResolvedValue(mockResult as any)
      const req = createMockRequest()
      const res = createMockResponse()

      await getNotifications(req as Request, res as Response)

      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith(
        'user123',
        { type: undefined, is_read: undefined },
        { page: 1, limit: 10 },
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy danh sách thông báo thành công',
        data: {
          notifications: mockResult.data,
          pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
        },
      })
    })

    it('should handle custom pagination and type filter', async () => {
      const mockResult = { data: [], pagination: { page: 2, limit: 5, total: 0, page_size: 0 } }
      mockNotificationService.getNotifications.mockResolvedValue(mockResult)
      const req = createMockRequest({ query: { page: '2', limit: '5', type: 'order' } })
      const res = createMockResponse()

      await getNotifications(req as Request, res as Response)

      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith(
        'user123',
        { type: 'order', is_read: undefined },
        { page: 2, limit: 5 },
      )
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('should handle is_read filter as true', async () => {
      const mockResult = { data: [], pagination: { page: 1, limit: 10, total: 0, page_size: 0 } }
      mockNotificationService.getNotifications.mockResolvedValue(mockResult)
      const req = createMockRequest({ query: { is_read: 'true' } })
      const res = createMockResponse()

      await getNotifications(req as Request, res as Response)

      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith(
        'user123',
        { type: undefined, is_read: true },
        { page: 1, limit: 10 },
      )
    })

    it('should handle is_read filter as false', async () => {
      const mockResult = { data: [], pagination: { page: 1, limit: 10, total: 0, page_size: 0 } }
      mockNotificationService.getNotifications.mockResolvedValue(mockResult)
      const req = createMockRequest({ query: { is_read: 'false' } })
      const res = createMockResponse()

      await getNotifications(req as Request, res as Response)

      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith(
        'user123',
        { type: undefined, is_read: false },
        { page: 1, limit: 10 },
      )
    })

    it('should propagate service errors', async () => {
      mockNotificationService.getNotifications.mockRejectedValue(new Error('Service error'))
      const req = createMockRequest()
      const res = createMockResponse()

      await expect(getNotifications(req as Request, res as Response)).rejects.toThrow(
        'Service error',
      )
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      const mockNotification = {
        _id: 'notif1',
        user: 'user123',
        title: 'Test Title',
        content: 'Test content',
        type: 'order',
        is_read: true,
      }
      mockNotificationService.markAsRead.mockResolvedValue(mockNotification as any)
      const req = createMockRequest({ params: { id: 'notif1' } })
      const res = createMockResponse()

      await markAsRead(req as Request, res as Response)

      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('user123', 'notif1')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Đánh dấu thông báo đã đọc thành công',
        data: mockNotification,
      })
    })

    it('should propagate service errors', async () => {
      mockNotificationService.markAsRead.mockRejectedValue(new Error('Not found'))
      const req = createMockRequest({ params: { id: 'invalid' } })
      const res = createMockResponse()

      await expect(markAsRead(req as Request, res as Response)).rejects.toThrow('Not found')
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      mockNotificationService.markAllAsRead.mockResolvedValue(5)
      const req = createMockRequest()
      const res = createMockResponse()

      await markAllAsRead(req as Request, res as Response)

      expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith('user123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Đánh dấu tất cả thông báo đã đọc thành công',
        data: { updated_count: 5 },
      })
    })

    it('should propagate service errors', async () => {
      mockNotificationService.markAllAsRead.mockRejectedValue(new Error('Database error'))
      const req = createMockRequest()
      const res = createMockResponse()

      await expect(markAllAsRead(req as Request, res as Response)).rejects.toThrow('Database error')
    })
  })

  describe('getUnreadCount', () => {
    it('should return unread count successfully', async () => {
      mockNotificationService.getUnreadCount.mockResolvedValue(3)
      const req = createMockRequest()
      const res = createMockResponse()

      await getUnreadCount(req as Request, res as Response)

      expect(mockNotificationService.getUnreadCount).toHaveBeenCalledWith('user123')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy số thông báo chưa đọc thành công',
        data: { count: 3 },
      })
    })

    it('should propagate service errors', async () => {
      mockNotificationService.getUnreadCount.mockRejectedValue(new Error('Service unavailable'))
      const req = createMockRequest()
      const res = createMockResponse()

      await expect(getUnreadCount(req as Request, res as Response)).rejects.toThrow(
        'Service unavailable',
      )
    })
  })

  describe('deleteNotification', () => {
    it('should delete notification successfully', async () => {
      mockNotificationService.deleteNotification.mockResolvedValue(undefined as any)
      const req = createMockRequest({ params: { id: 'notif1' } })
      const res = createMockResponse()

      await deleteNotification(req as Request, res as Response)

      expect(mockNotificationService.deleteNotification).toHaveBeenCalledWith('user123', 'notif1')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ message: 'Xóa thông báo thành công' })
    })

    it('should propagate service errors', async () => {
      mockNotificationService.deleteNotification.mockRejectedValue(new Error('Not found'))
      const req = createMockRequest({ params: { id: 'bad_id' } })
      const res = createMockResponse()

      await expect(deleteNotification(req as Request, res as Response)).rejects.toThrow('Not found')
    })
  })

  describe('adminCreateNotification', () => {
    it('should return 404 when user does not exist', async () => {
      ;(UserModel.exists as jest.Mock).mockResolvedValue(null)
      const req = createMockRequest({
        body: { user_id: 'u999', title: 'T', content: 'C', type: 'order' },
      })
      const res = createMockResponse()

      await adminCreateNotification(req as Request, res as Response)

      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'User không tồn tại' })
    })

    it('should create notification when user exists', async () => {
      ;(UserModel.exists as jest.Mock).mockResolvedValue({ _id: 'u1' })
      const mockNotification = {
        _id: 'notif_new',
        title: 'T',
        content: 'C',
        type: 'order',
        link: null,
        createdAt: new Date(),
      }
      mockNotificationService.createNotification.mockResolvedValue(mockNotification as any)
      const req = createMockRequest({
        body: { user_id: 'u1', title: 'T', content: 'C', type: 'order' },
      })
      const res = createMockResponse()

      await adminCreateNotification(req as Request, res as Response)

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        'u1',
        'T',
        'C',
        'order',
      )
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Tạo thông báo thành công' }),
      )
    })
  })

  describe('adminBroadcastNotification', () => {
    it('should broadcast to all users', async () => {
      ;(UserModel.find as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue([{ _id: 'u1' }, { _id: 'u2' }]) }),
      })
      mockNotificationService.broadcastNotification.mockResolvedValue(undefined as any)
      const req = createMockRequest({
        body: { title: 'Broadcast', content: 'Msg', type: 'system' },
      })
      const res = createMockResponse()

      await adminBroadcastNotification(req as Request, res as Response)

      expect(mockNotificationService.broadcastNotification).toHaveBeenCalledWith(
        ['u1', 'u2'],
        'Broadcast',
        'Msg',
        'system',
      )
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: { recipientCount: 2 } }),
      )
    })
  })

  describe('adminGetNotifications', () => {
    it('should return admin notifications list', async () => {
      const mockResult = {
        data: [{ _id: 'n1', title: 'Admin notif' }],
        pagination: { page: 1, limit: 10, total: 1, page_size: 1 },
      }
      mockNotificationService.getAdminNotifications.mockResolvedValue(mockResult as any)
      const req = createMockRequest({ query: { type: 'order' } })
      const res = createMockResponse()

      await adminGetNotifications(req as Request, res as Response)

      expect(mockNotificationService.getAdminNotifications).toHaveBeenCalledWith(
        { type: 'order' },
        { page: 1, limit: 10 },
      )
      expect(res.status).toHaveBeenCalledWith(200)
    })
  })

  describe('adminDeleteNotification', () => {
    it('should delete notification as admin', async () => {
      mockNotificationService.adminDeleteNotification.mockResolvedValue(undefined as any)
      const req = createMockRequest({ params: { id: 'notif1' } })
      const res = createMockResponse()

      await adminDeleteNotification(req as Request, res as Response)

      expect(mockNotificationService.adminDeleteNotification).toHaveBeenCalledWith('notif1')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ message: 'Xóa thông báo thành công' })
    })
  })
})
