/// <reference types="jest" />
import { Types } from 'mongoose'
import { NotificationService } from '@services/notification.service'
import { INotificationRepository } from '@repositories/interfaces/notification.repository.interface'
import { NotFoundError } from '@services/base.service'

describe('NotificationService', () => {
  let service: NotificationService
  const mockNotificationRepository = {
    findByUser: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    countUnread: jest.fn(),
    createNotification: jest.fn(),
  } as unknown as jest.Mocked<INotificationRepository>

  const userId = new Types.ObjectId().toString()
  const notificationId = new Types.ObjectId().toString()

  beforeEach(() => {
    jest.clearAllMocks()
    service = new NotificationService(mockNotificationRepository)
  })

  describe('getNotifications', () => {
    it('should return paginated results', async () => {
      const mockResult = {
        data: [{ id: notificationId, title: 'Test' }],
        pagination: { page: 1, limit: 10, page_size: 1, total: 1 },
      } as any
      mockNotificationRepository.findByUser.mockResolvedValue(mockResult)

      const result = await service.getNotifications(userId, {}, { page: 1, limit: 10 })

      expect(mockNotificationRepository.findByUser).toHaveBeenCalledWith(
        userId,
        {},
        { page: 1, limit: 10 },
      )
      expect(result).toEqual(mockResult)
    })
  })

  describe('markAsRead', () => {
    it('should mark notification as read when found', async () => {
      const mockNotification = {
        _id: new Types.ObjectId(),
        user: new Types.ObjectId(userId),
        title: 'Test',
        content: 'Content',
        type: 'other',
        is_read: true,
      } as any
      mockNotificationRepository.markAsRead.mockResolvedValue(mockNotification)

      const result = await service.markAsRead(userId, notificationId)

      expect(mockNotificationRepository.markAsRead).toHaveBeenCalledWith(userId, notificationId)
      expect(result).toEqual(mockNotification)
    })

    it('should throw NotFoundError when notification not found', async () => {
      mockNotificationRepository.markAsRead.mockResolvedValue(null)

      await expect(service.markAsRead(userId, notificationId)).rejects.toThrow(NotFoundError)
    })
  })

  describe('markAllAsRead', () => {
    it('should return count of marked notifications', async () => {
      mockNotificationRepository.markAllAsRead.mockResolvedValue(5)

      const result = await service.markAllAsRead(userId)

      expect(mockNotificationRepository.markAllAsRead).toHaveBeenCalledWith(userId)
      expect(result).toBe(5)
    })
  })

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockNotificationRepository.countUnread.mockResolvedValue(3)

      const result = await service.getUnreadCount(userId)

      expect(mockNotificationRepository.countUnread).toHaveBeenCalledWith(userId)
      expect(result).toBe(3)
    })
  })

  describe('createNotification', () => {
    it('should create notification with default type other', async () => {
      const mockNotification = {
        _id: new Types.ObjectId(),
        user: new Types.ObjectId(userId),
        title: 'Test',
        content: 'Content',
        type: 'other',
        is_read: false,
      } as any
      mockNotificationRepository.createNotification.mockResolvedValue(mockNotification)

      const result = await service.createNotification(userId, 'Test', 'Content')

      expect(mockNotificationRepository.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Test', content: 'Content', type: 'other' }),
      )
      expect(result).toEqual(mockNotification)
    })

    it('should create notification with custom type and link', async () => {
      const mockNotification = {
        _id: new Types.ObjectId(),
        user: new Types.ObjectId(userId),
        title: 'Test',
        content: 'Content',
        type: 'order',
        is_read: false,
        link: '/orders/1',
      } as any
      mockNotificationRepository.createNotification.mockResolvedValue(mockNotification)

      const result = await service.createNotification(
        userId,
        'Test',
        'Content',
        'order' as any,
        '/orders/1',
      )

      expect(mockNotificationRepository.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test',
          content: 'Content',
          type: 'order',
          link: '/orders/1',
        }),
      )
      expect(result).toEqual(mockNotification)
    })
  })
})
