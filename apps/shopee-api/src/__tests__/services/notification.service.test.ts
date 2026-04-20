/// <reference types="jest" />
import { Types } from 'mongoose'
import { NotificationService } from '@services/notification.service'
import { INotificationRepository } from '@repositories/interfaces/notification.repository.interface'
import { NotFoundError, ValidationError } from '@services/base.service'

describe('NotificationService', () => {
  let service: NotificationService
  const mockNotificationRepository = {
    findByUser: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    countUnread: jest.fn(),
    createNotification: jest.fn(),
    findById: jest.fn(),
    deleteById: jest.fn(),
    findPaginated: jest.fn(),
    createBulkNotifications: jest.fn(),
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

  describe('getNotifications - validation', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(service.getNotifications('invalid-id', {}, { page: 1, limit: 10 })).rejects.toThrow(ValidationError)
    })
  })

  describe('markAsRead - validation', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(service.markAsRead('invalid-id', notificationId)).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid notificationId', async () => {
      await expect(service.markAsRead(userId, 'invalid-id')).rejects.toThrow(ValidationError)
    })
  })

  describe('markAllAsRead - validation', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(service.markAllAsRead('invalid-id')).rejects.toThrow(ValidationError)
    })
  })

  describe('getUnreadCount - validation', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(service.getUnreadCount('invalid-id')).rejects.toThrow(ValidationError)
    })
  })

  describe('createNotification - validation', () => {
    it('should throw ValidationError for invalid userId', async () => {
      await expect(service.createNotification('invalid-id', 'T', 'C')).rejects.toThrow(ValidationError)
    })
  })

  describe('deleteNotification', () => {
    it('should delete notification when user owns it', async () => {
      const mockNotif = { _id: new Types.ObjectId(notificationId), user: userId, title: 'T', content: 'C', type: 'other', is_read: false } as any
      mockNotificationRepository.findById.mockResolvedValue({ ...mockNotif, user: { toString: () => userId } })
      mockNotificationRepository.deleteById.mockResolvedValue(mockNotif)

      const result = await service.deleteNotification(userId, notificationId)
      expect(result).toBeDefined()
    })

    it('should throw NotFoundError when notification not found', async () => {
      mockNotificationRepository.findById.mockResolvedValue(null)
      await expect(service.deleteNotification(userId, notificationId)).rejects.toThrow(NotFoundError)
    })

    it('should throw NotFoundError when user does not own notification', async () => {
      const otherId = new Types.ObjectId().toString()
      mockNotificationRepository.findById.mockResolvedValue({
        _id: new Types.ObjectId(notificationId),
        user: { toString: () => otherId },
      } as any)
      await expect(service.deleteNotification(userId, notificationId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ValidationError for invalid userId', async () => {
      await expect(service.deleteNotification('invalid-id', notificationId)).rejects.toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid notificationId', async () => {
      await expect(service.deleteNotification(userId, 'invalid-id')).rejects.toThrow(ValidationError)
    })
  })

  describe('adminDeleteNotification', () => {
    it('should delete notification as admin', async () => {
      const mockNotif = { _id: new Types.ObjectId(notificationId) } as any
      mockNotificationRepository.deleteById.mockResolvedValue(mockNotif)

      const result = await service.adminDeleteNotification(notificationId)
      expect(result).toBeDefined()
    })

    it('should throw NotFoundError when notification not found', async () => {
      mockNotificationRepository.deleteById.mockResolvedValue(null)
      await expect(service.adminDeleteNotification(notificationId)).rejects.toThrow(NotFoundError)
    })

    it('should throw ValidationError for invalid notificationId', async () => {
      await expect(service.adminDeleteNotification('invalid-id')).rejects.toThrow(ValidationError)
    })
  })

  describe('getAdminNotifications', () => {
    it('should return paginated notifications', async () => {
      const mockResult = { data: [], pagination: { page: 1, limit: 10, total: 0, page_size: 0 } }
      mockNotificationRepository.findPaginated.mockResolvedValue(mockResult as any)

      await service.getAdminNotifications({ type: 'order' as any }, { page: 1, limit: 10 })
      expect(mockNotificationRepository.findPaginated).toHaveBeenCalledWith(
        { type: 'order' },
        { page: 1, limit: 10 },
      )
    })

    it('should call findPaginated without type filter when not provided', async () => {
      const mockResult = { data: [], pagination: { page: 1, limit: 10, total: 0, page_size: 0 } }
      mockNotificationRepository.findPaginated.mockResolvedValue(mockResult as any)

      await service.getAdminNotifications({}, { page: 1, limit: 10 })
      expect(mockNotificationRepository.findPaginated).toHaveBeenCalledWith({}, { page: 1, limit: 10 })
    })
  })

  describe('broadcastNotification', () => {
    it('should create bulk notifications', async () => {
      const userIds = [new Types.ObjectId().toString(), new Types.ObjectId().toString()]
      mockNotificationRepository.createBulkNotifications.mockResolvedValue([] as any)

      await service.broadcastNotification(userIds, 'Broadcast', 'Msg', 'system' as any)
      expect(mockNotificationRepository.createBulkNotifications).toHaveBeenCalled()
    })

    it('should return empty array when no userIds', async () => {
      const result = await service.broadcastNotification([], 'T', 'C', 'other' as any)
      expect(result).toEqual([])
    })
  })
})
