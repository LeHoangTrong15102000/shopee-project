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
      },
    },
  },
}))

import { container } from '../../container'
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from '../../controllers/notification.controller'

const mockNotificationService = container.services.notification as jest.Mocked<typeof container.services.notification>

const createMockRequest = (options: any = {}): Partial<Request> => ({
  body: options.body || {},
  params: options.params || {},
  query: options.query || {},
  headers: options.headers || {},
  jwtDecoded: options.jwtDecoded || { id: 'user123', email: 'test@test.com', roles: ['User'], created_at: '2024-01-01' },
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
        data: [{ _id: 'notif1', user: 'user123', title: 'Test Title', content: 'Test notification', type: 'order', is_read: false }],
        pagination: { page: 1, limit: 10, total: 1, page_size: 1 },
      }
      mockNotificationService.getNotifications.mockResolvedValue(mockResult as any)
      const req = createMockRequest()
      const res = createMockResponse()

      await getNotifications(req as Request, res as Response)

      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith('user123', { type: undefined, is_read: undefined }, { page: 1, limit: 10 })
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Lấy danh sách thông báo thành công',
        data: { notifications: mockResult.data, pagination: { page: 1, limit: 10, total: 1, total_pages: 1 } },
      })
    })

    it('should handle custom pagination and type filter', async () => {
      const mockResult = { data: [], pagination: { page: 2, limit: 5, total: 0, page_size: 0 } }
      mockNotificationService.getNotifications.mockResolvedValue(mockResult)
      const req = createMockRequest({ query: { page: '2', limit: '5', type: 'order' } })
      const res = createMockResponse()

      await getNotifications(req as Request, res as Response)

      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith('user123', { type: 'order', is_read: undefined }, { page: 2, limit: 5 })
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('should handle is_read filter as true', async () => {
      const mockResult = { data: [], pagination: { page: 1, limit: 10, total: 0, page_size: 0 } }
      mockNotificationService.getNotifications.mockResolvedValue(mockResult)
      const req = createMockRequest({ query: { is_read: 'true' } })
      const res = createMockResponse()

      await getNotifications(req as Request, res as Response)

      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith('user123', { type: undefined, is_read: true }, { page: 1, limit: 10 })
    })

    it('should handle is_read filter as false', async () => {
      const mockResult = { data: [], pagination: { page: 1, limit: 10, total: 0, page_size: 0 } }
      mockNotificationService.getNotifications.mockResolvedValue(mockResult)
      const req = createMockRequest({ query: { is_read: 'false' } })
      const res = createMockResponse()

      await getNotifications(req as Request, res as Response)

      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith('user123', { type: undefined, is_read: false }, { page: 1, limit: 10 })
    })

    it('should propagate service errors', async () => {
      mockNotificationService.getNotifications.mockRejectedValue(new Error('Service error'))
      const req = createMockRequest()
      const res = createMockResponse()

      await expect(getNotifications(req as Request, res as Response)).rejects.toThrow('Service error')
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read successfully', async () => {
      const mockNotification = { _id: 'notif1', user: 'user123', title: 'Test Title', content: 'Test content', type: 'order', is_read: true }
      mockNotificationService.markAsRead.mockResolvedValue(mockNotification as any)
      const req = createMockRequest({ params: { id: 'notif1' } })
      const res = createMockResponse()

      await markAsRead(req as Request, res as Response)

      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('user123', 'notif1')
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ message: 'Đánh dấu thông báo đã đọc thành công', data: mockNotification })
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
      expect(res.json).toHaveBeenCalledWith({ message: 'Đánh dấu tất cả thông báo đã đọc thành công', data: { updated_count: 5 } })
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
      expect(res.json).toHaveBeenCalledWith({ message: 'Lấy số thông báo chưa đọc thành công', data: { count: 3 } })
    })

    it('should propagate service errors', async () => {
      mockNotificationService.getUnreadCount.mockRejectedValue(new Error('Service unavailable'))
      const req = createMockRequest()
      const res = createMockResponse()

      await expect(getUnreadCount(req as Request, res as Response)).rejects.toThrow('Service unavailable')
    })
  })
})

